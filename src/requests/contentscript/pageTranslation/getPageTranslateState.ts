import { type } from '../../../lib/types';
import { buildTabRequest } from '../../utils/requestBuilder';

export const PageTranslateStateSignature = type.type({
	resolved: type.number,
	rejected: type.number,
	pending: type.number,
});

export const [getPageTranslateStateFactory, getPageTranslateState] = buildTabRequest(
	'getPageTranslateState',
	{
		responseValidator: type.type({
			isTranslated: type.boolean,
			counters: PageTranslateStateSignature,
			translateDirection: type.union([
				type.type({
					from: type.string,
					to: type.string,
				}),
				type.null,
			]),
		}),

		factoryHandler:
			({ pageTranslationContext }) =>
				async () => {
					const domTranslator = pageTranslationContext.getDOMTranslator();
					if (domTranslator === null) {
						throw new Error('DOM translator are empty');
					}

					return domTranslator.getStatus();
				},
	},
);
