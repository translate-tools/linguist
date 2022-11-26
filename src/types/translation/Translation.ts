import { type } from '../../lib/types';

/**
 * Object contains translation data
 */
export type ITranslation = {
	from: string;
	to: string;
	originalText: string;
	translatedText: string;
};

export const TranslationType = type.type({
	from: type.string,
	to: type.string,
	originalText: type.string,
	translatedText: type.string,
});
