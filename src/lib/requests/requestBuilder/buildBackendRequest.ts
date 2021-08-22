import * as t from 'io-ts';

import {
	RequestHandlerFactory,
	RequestHandlerFactoryProps,
} from '../../../requests/types';
import { tryDecode } from '../../types';

import { sendBackgroundRequest, addRequestHandler } from '..';

type BackgroundOptions<O = any, R = any> = {
	factoryHandler: (props: RequestHandlerFactoryProps) => (options: O) => Promise<R>;
	requestValidator?: t.Type<O, O>;
	responseValidator?: t.Type<R, R>;
};

/**
 * Factory for building requests which ensure its types
 */
export const buildBackendRequest = <O = void, R = void>(
	endpoint: string,
	{ factoryHandler, requestValidator, responseValidator }: BackgroundOptions<O, R>,
) => {
	const hook = (options: O) =>
		sendBackgroundRequest(endpoint, options).then((response): R => {
			// Validate request props
			if (responseValidator !== undefined) {
				tryDecode(responseValidator, response);
			}

			return response;
		});

	const factory: RequestHandlerFactory = (factoryProps) => {
		const handler = factoryHandler(factoryProps);

		return addRequestHandler(endpoint, async (reqProps) => {
			// Validate request props
			if (requestValidator !== undefined) {
				tryDecode(requestValidator, reqProps);
			}

			return handler(reqProps);
		});
	};

	return [
		factory,
		hook as O extends void ? () => Promise<R> : (options: O) => Promise<R>,
	] as const;
};
