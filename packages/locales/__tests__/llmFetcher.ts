import { MessageObject } from '../LLMFetcher';

const TRANSLATION_SYMBOL = 'REQUEST TO TRANSLATE:';
export const fakeTranslationPrompt = (json: string) => TRANSLATION_SYMBOL + json;

export const configureFakeLLMQuery =
	(translate: (text: string) => string) =>
		async (messages: MessageObject[]): Promise<MessageObject[]> => {
			const message = messages.find((message) =>
				message.content.startsWith(TRANSLATION_SYMBOL),
			);
			if (!message) throw new Error("Can't find message for translate");

			return [
				{
					role: 'assistant',
					content: translate(message.content.slice(TRANSLATION_SYMBOL.length)),
				},
			];
		};
