import { type } from '../../lib/types';

/**
 * Object contains translation data
 */
export type ITranslation = {
	from: string;
	to: string;
	// TODO: rename to `originalText`
	text: string;
	// TODO: rename to `translatedText`
	translate: string;
};

export const TranslationType = type.type({
	from: type.string,
	to: type.string,
	text: type.string,
	translate: type.string,
});
