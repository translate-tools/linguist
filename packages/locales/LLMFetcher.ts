export type MessageObject = {
	role: 'system' | 'user' | 'assistant';
	content: string;
};

export interface LLMFetcher {
	/**
	 * Build completions with a model
	 */
	query(messages: MessageObject[]): Promise<MessageObject[]>;

	/**
	 * Max length of string for prompt
	 */
	getLengthLimit(): number;

	/**
	 * Delay between requests to comply with the requests-per-minute limit.
	 */
	getRequestsTimeout(): number;
}
