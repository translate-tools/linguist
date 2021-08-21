import * as t from 'io-ts';

import { RequestHandlerFactory, RequestHandlerFactoryProps } from '../requests/types';
import { bgSendRequest, addRequestHandler } from './communication';
import { tryDecode } from './types';

// TODO: add property `allowManyHandlers` and when it `false` (by default) throw exception while attempt define 2 endpoints with same name
type Options<O = any, R = any> = {
	factoryHandler: (props: RequestHandlerFactoryProps) => (options: O) => Promise<R>;
	requestValidator?: t.Type<O, O>;
	responseValidator?: t.Type<R, R>;
};

/**
 * Factory for building requests which ensure its types
 */
export const buildBackendRequest = <O = void, R = void>(
	endpoint: string,
	{ factoryHandler, requestValidator, responseValidator }: Options<O, R>,
) => {
	const hook = (options: O) =>
		bgSendRequest(endpoint, options).then((response): R => {
			// Validate request props
			if (responseValidator !== undefined) {
				tryDecode(responseValidator, response);
			}

			return response;
		});

	const factory: RequestHandlerFactory = (factoryProps) => {
		const handler = factoryHandler(factoryProps);

		addRequestHandler(endpoint, async (reqProps) => {
			// Validate request props
			if (requestValidator !== undefined) {
				tryDecode(requestValidator, reqProps);
			}

			return handler(reqProps);
		});
	};

	return [factory, hook] as const;
};
