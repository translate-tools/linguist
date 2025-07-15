import OpenAI, { ClientOptions } from 'openai';

import { LLMFetcher, MessageObject } from './LLMFetcher';

export class BasicLLMFetcher implements LLMFetcher {
	private readonly api: OpenAI;
	constructor(
		params: ClientOptions,
		private readonly config: {
			model: string;
			temperature?: number;
			systemPrompt?: MessageObject[];
		},
	) {
		this.api = new OpenAI(params);
	}

	async query(messages: MessageObject[]): Promise<MessageObject[]> {
		const response = await this.api.chat.completions.create({
			model: this.config.model,
			temperature: this.config.temperature,
			messages: [...(this.config.systemPrompt ?? []), ...messages],
		});

		const result: MessageObject[] = [];
		for (const choice of response.choices) {
			const { message } = choice;
			if (typeof message.content !== 'string') throw new Error('Invalid response');

			result.push(message as MessageObject);
		}

		return result;
	}

	getLengthLimit() {
		return 25000;
	}

	getRequestsTimeout() {
		return 300;
	}
}
