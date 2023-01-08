import { buildTabRequest } from '../../utils/requestBuilder';
import { type } from '../../../lib/types';

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
			({ pageContext }) =>
				async () => {
					const domTranslator = pageContext.getDOMTranslator();
					if (domTranslator === null) {
						throw new Error('DOM translator are empty');
					}

					return {
						isTranslated: domTranslator.isRun(),
						counters: domTranslator.getStatus(),
						translateDirection: domTranslator.getTranslateDirection(),
					};
				},
	},
);
