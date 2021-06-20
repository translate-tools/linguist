import { ITranslateOptions, ITranslateScheduler } from './ITranslateScheduler';
import { langCode, langCodeWithAuto, Translator } from '../types/Translator';
import { QueueSemafor } from '../lib/QueueSemafor';

interface Config {
	/**
	 * Number of attempts for retry request
	 */
	translateRetryAttemptLimit?: number;

	/**
	 * If true - rejected requests will use direct translate
	 */
	isAllowDirectTranslateBadChunks?: boolean;

	/**
	 * Length of string for direct translate.
	 *
	 * null for disable the condition
	 */
	directTranslateLength?: number | null;

	/**
	 * Delay for translate a chunk. The bigger the more requests will collect
	 */
	translatePoolDelay?: number;

	/**
	 * When chunk collect this size, it's will be instant add to a translate queue
	 *
	 * null for disable the condition
	 */
	chunkSizeForInstantTranslate?: number | null;
}

interface TaskConstructor {
	text: string;
	from: langCodeWithAuto;
	to: langCode;

	/**
	 * For combine tasks by unique key
	 */
	context?: string;
}

interface TaskConstructorInternal extends TaskConstructor {
	/**
	 * Current retry attempt
	 */
	attempt?: number;

	resolve: (value: string | PromiseLike<string>) => void;
	reject: (reason?: any) => void;
}

interface Task {
	text: string;
	from: langCodeWithAuto;
	to: langCode;

	/**
	 * Current retry attempt
	 */
	attempt: number;

	resolve: (value: string | PromiseLike<string>) => void;
	reject: (reason?: any) => void;
}

interface TaskContainer {
	/**
	 * For combine tasks by unique key
	 */
	context: string;

	from: langCodeWithAuto;
	to: langCode;
	tasks: Task[];

	/**
	 * Total length of text from all tasks
	 */
	length: number;
}

/**
 * Module for scheduling and optimization of translate a text streams
 *
 * - It can union many translate requests to one
 * - You can group any requests by context
 * - It's configurable. You can set retry limit and edge for direct translate
 */
export class TranslateScheduler implements ITranslateScheduler {
	private readonly semafor;
	private readonly translator;
	private readonly config: Required<Config> = {
		translateRetryAttemptLimit: 2,
		isAllowDirectTranslateBadChunks: true,
		directTranslateLength: null,
		translatePoolDelay: 300,
		chunkSizeForInstantTranslate: null,
	};

	constructor(translator: Translator, config?: Config) {
		this.translator = translator;

		if (config !== undefined) {
			for (const key in config) {
				(this.config as any)[key] = (config as any)[key];
			}
		}

		this.semafor = new QueueSemafor({ timeout: translator.throttleTime() });
	}

	private contextCounter = 0;
	public async translate(
		text: string,
		from: langCodeWithAuto,
		to: langCode,
		options?: ITranslateOptions,
	) {
		const { context = '', directTranslate: directTranslateForThisRequest = false } =
			options !== undefined ? options : {};

		if (this.translator.checkLimitExceeding(text) <= 0) {
			// Direct translate
			if (
				directTranslateForThisRequest ||
				(this.config.directTranslateLength !== null &&
					text.length >= this.config.directTranslateLength)
			) {
				return this.directTranslate(text, from, to);
			} else {
				return this.makeTask({ text: text, from, to, context });
			}
		} else {
			// Split text by words and translate
			return this.splitAndTranslate(text, from, to, context);
		}
	}

	private async directTranslate(text: string, from: langCodeWithAuto, to: langCode) {
		const free = await this.semafor.take();
		return this.translator.translate(text, from, to).finally(free);
	}

	private splitAndTranslate(
		text: string,
		from: langCodeWithAuto,
		to: langCode,
		context: string = '',
	) {
		const splittedText: string[] = [];
		const charsetIndexes: number[] = [];

		let wordsBuffer = '';
		for (const textMatch of text.matchAll(/([^\s]+)(\s*)/g)) {
			const newPart = textMatch[0];
			const newBuffer = wordsBuffer + newPart;

			// Add word to buffer if can
			if (this.translator.checkLimitExceeding(newBuffer) <= 0) {
				wordsBuffer = newBuffer;
				continue;
			}

			// Write and clear buffer if not empthy
			if (wordsBuffer.length > 0) {
				splittedText.push(wordsBuffer);
				wordsBuffer = '';
			}

			// Handle new part
			if (this.translator.checkLimitExceeding(newPart) <= 0) {
				// Add to buffer
				wordsBuffer += newPart;
				continue;
			} else {
				// Slice by chars
				let charsBuffer = newPart;
				while (charsBuffer.length > 0) {
					const extraChars = this.translator.checkLimitExceeding(charsBuffer);
					if (extraChars > 0) {
						const offset = charsBuffer.length - extraChars;

						// Write slice and remainder
						splittedText.push(charsBuffer.slice(0, offset));
						charsBuffer = charsBuffer.slice(offset);

						charsetIndexes.push(splittedText.length - 1);
					}
				}
			}
		}

		const ctxPrefix = context.length > 0 ? context + ';' : '';
		return Promise.all(
			splittedText.map((text, index) =>
				charsetIndexes.indexOf(index) !== -1
					? text
					: this.makeTask({
						text,
						from,
						to,
						context: ctxPrefix + `text#${this.contextCounter++}`,
					  }),
			),
		).then((translatedParts) => translatedParts.join(''));
	}

	private makeTask({ text, from, to, context = '' }: TaskConstructor) {
		return new Promise<string>((resolve, reject) => {
			this.addToTaskContainer({
				text,
				from,
				to,
				context,
				resolve,
				reject,
			});
		});
	}

	private readonly taskContainersStorage = new Set<TaskContainer>();
	private addToTaskContainer({
		text,
		from,
		to,
		attempt = 0,
		context = '',
		resolve,
		reject,
	}: TaskConstructorInternal) {
		// create task
		const task: Task = {
			text,
			from,
			to,
			attempt,
			resolve,
			reject,
		};

		let container: TaskContainer | null = null;

		// try add to exists container
		for (const taskContainer of this.taskContainersStorage) {
			if (taskContainer.from !== from || taskContainer.to !== to) continue;
			if (taskContainer.context !== context) continue;

			// Lightweight check to overflow
			// NOTE: Do strict check here if you need comply a limit contract
			if (
				this.translator.lengthLimit() >=
				taskContainer.length + task.text.length
			) {
				taskContainer.tasks.push(task);
				taskContainer.length += task.text.length;
				container = taskContainer;
			}
		}

		// make container
		if (container === null) {
			const newTaskContainer: TaskContainer = {
				context,
				from,
				to,
				tasks: [task],
				length: task.text.length,
			};
			this.taskContainersStorage.add(newTaskContainer);
			container = newTaskContainer;
		}

		if (
			this.config.chunkSizeForInstantTranslate !== null &&
			container.length >= this.config.chunkSizeForInstantTranslate
		) {
			this.addToTranslateQueue(container);
		} else {
			this.updateDelayForAddToTranslateQueue(container);
		}
	}

	private readonly translateQueue = new Set<TaskContainer>();
	private readonly timersMap = new Map<TaskContainer, number>();
	private updateDelayForAddToTranslateQueue(taskContainer: TaskContainer) {
		// Flush timer
		if (this.timersMap.has(taskContainer)) {
			window.clearTimeout(this.timersMap.get(taskContainer));
		}

		this.timersMap.set(
			taskContainer,
			window.setTimeout(() => {
				this.addToTranslateQueue(taskContainer);
			}, this.config.translatePoolDelay),
		);
	}

	private addToTranslateQueue(taskContainer: TaskContainer) {
		// Flush timer
		if (this.timersMap.has(taskContainer)) {
			window.clearTimeout(this.timersMap.get(taskContainer));
			this.timersMap.delete(taskContainer);
		}

		this.taskContainersStorage.delete(taskContainer);
		this.translateQueue.add(taskContainer);

		if (!this.workerState) {
			this.runWorker();
		}
	}

	private workerState = false;
	private async runWorker() {
		this.workerState = true;

		for (const taskContainer of this.translateQueue) {
			this.translateQueue.delete(taskContainer);

			const textArray = taskContainer.tasks.map((i) => i.text);

			const free = await this.semafor.take();

			await this.translator
				.translateBatch(textArray, taskContainer.from, taskContainer.to)
				.then((result) => {
					for (const index in taskContainer.tasks) {
						const task = taskContainer.tasks[index];

						const translatedText = result[index];
						if (translatedText !== undefined) {
							task.resolve(translatedText);
						} else {
							this.taskErrorHandler(
								task,
								new Error("Translator module can't translate this"),
								taskContainer.context,
							);
						}
					}
				})
				.catch((reason) => {
					console.error(reason);

					for (const task of taskContainer.tasks) {
						this.taskErrorHandler(task, reason, taskContainer.context);
					}
				})
				.finally(free);
		}

		this.workerState = false;
	}

	private taskErrorHandler(task: Task, error: any, context: string) {
		if (task.attempt >= this.config.translateRetryAttemptLimit) {
			if (this.config.isAllowDirectTranslateBadChunks) {
				const { text, from, to, resolve, reject } = task;
				this.directTranslate(text, from, to).then(resolve, reject);
			} else {
				task.reject(error);
			}
		} else {
			this.addToTaskContainer({
				...task,
				attempt: task.attempt + 1,
				context,
			});
		}
	}
}
