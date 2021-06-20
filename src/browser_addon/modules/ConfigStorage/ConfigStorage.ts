import * as t from 'io-ts';
import { isEqual, cloneDeep } from 'lodash';
import { tryDecodeObject } from '../../lib/types';

export type Callback<T extends t.Props> = (
	newProps: Partial<t.TypeOfProps<T>>,
	oldProps: Partial<t.TypeOfProps<T>>,
) => void;

export type Middleware<T extends t.Props> = (
	newProps: Partial<t.TypeOfProps<T>>,
	currentProps: t.TypeOfProps<T>,
) => boolean;

export class ConfigStorage<T extends t.Props> {
	private readonly types: T;
	private readonly buildedType: t.TypeC<T>;

	private readonly callbacks = new Set<Callback<T>>();
	private state: t.TypeOfProps<T> | null = null;
	private readonly defaultData?: Partial<t.TypeOfProps<T>>;

	constructor(types: T, defaultData?: Partial<t.TypeOfProps<T>>) {
		this.types = types;
		this.buildedType = t.type(types);

		if (defaultData !== undefined) {
			this.defaultData = tryDecodeObject(t.partial(this.types), defaultData);
		}

		this.write(this.read());
	}

	public subscribe(callback: Callback<T>) {
		this.callbacks.add(callback);
	}

	public unsubscribe(callback: Callback<T>) {
		this.callbacks.delete(callback);
	}

	public getAllConfig() {
		return this.state;
	}

	public getConfig<K extends keyof t.TypeOfProps<T>, D = null>(
		key: K,
		defaultValue?: D,
	): t.TypeOfProps<T>[K] | D {
		return this.state !== null && key in this.state
			? this.state[key]
			: defaultValue !== undefined
				? defaultValue
				: null;
	}

	public set(data: Partial<t.TypeOfProps<T>>) {
		const newData: typeof data = {};
		const oldData: typeof data = {};

		if (this.state === null) {
			throw Error('Config state is not init');
		}

		for (const key in data) {
			if (!isEqual(this.state[key], (data as any)[key])) {
				(newData as any)[key] = (data as any)[key];
				(oldData as any)[key] = cloneDeep(this.state[key]);
			}
		}

		// Call to middleware
		for (const middleware of this.middlewareHandlers) {
			if (!middleware(newData, this.state)) {
				return false;
			}
		}

		this.write(newData);

		// Send to all subscribers
		this.callbacks.forEach((callback) => callback(newData, oldData));

		return true;
	}

	private readonly middlewareHandlers = new Set<Middleware<T>>();
	public addMiddleware(middleware: Middleware<T>) {
		this.middlewareHandlers.add(middleware);
	}

	public removeMiddleware(middleware: Middleware<T>) {
		this.middlewareHandlers.delete(middleware);
	}

	private write(newData: Partial<t.TypeOfProps<T>>) {
		if (this.state === null) {
			this.state = {} as t.TypeOfProps<T>;
		}

		// Write data
		for (const key in newData) {
			const encodedData = JSON.stringify((newData as any)[key]);

			// To store
			localStorage.setItem(key, encodedData);

			// To local property
			this.state[key] = (newData as any)[key];
		}
	}

	private read(): t.TypeOfProps<T> {
		const dataCollector: Record<string, any> = {};

		for (const key in this.types) {
			const rawData = localStorage.getItem(key);
			if (rawData === null) {
				if (this.defaultData === undefined || !(key in this.defaultData)) {
					throw new Error(
						`Key "${key}" not found in storage and not defined default value in constructor`,
					);
				}
				dataCollector[key] = this.defaultData[key];
			} else {
				dataCollector[key] = JSON.parse(rawData);
			}
		}

		return tryDecodeObject(this.buildedType, dataCollector);
	}
}
