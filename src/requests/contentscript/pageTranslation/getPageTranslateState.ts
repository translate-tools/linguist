import { buildTabRequest } from '../../../lib/requests/requestBuilder';
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
			({ pageTranslator }) =>
				async () => ({
					isTranslated: pageTranslator.isRun(),
					counters: pageTranslator.getStatus(),
					translateDirection: pageTranslator.getTranslateDirection(),
				}),
	},
);
