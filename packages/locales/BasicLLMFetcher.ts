import OpenAI, { ClientOptions } from 'openai';

import { LLMFetcher } from './LLMFetcher';

export class BasicLLMFetcher implements LLMFetcher {
	private readonly api: OpenAI;
	constructor(
		params: ClientOptions,
		private readonly config: { model: string; temperature?: number },
	) {
		this.api = new OpenAI(params);
	}

	async fetch(prompt: string) {
		const response = await this.api.chat.completions.create({
			model: this.config.model,
			temperature: this.config.temperature,
			messages: [{ role: 'user', content: prompt }],
		});

		const { content } = response.choices[0].message;

		if (!content) throw new Error('Invalid response');

		return content;
	}

	getLengthLimit() {
		return 5000;
	}

	getRequestsTimeout() {
		return 300;
	}
}
