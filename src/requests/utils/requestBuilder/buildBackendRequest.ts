import * as t from 'io-ts';

import { RequestHandlerFactory, RequestHandlerFactoryProps } from '../../types';
import { tryDecode } from '../../../lib/types';
import { isBackgroundContext } from '../../../lib/browser';

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
	let localHandler: ((options: O) => Promise<R>) | null = null;

	const hook = (options: O) => {
		// Call handler directly for invokes from background context
		if (isBackgroundContext()) {
			if (localHandler === null) {
				throw new Error(
					`Request handler is not initialized for endpoint "${endpoint}"`,
				);
			}

			return localHandler(options);
		}

		// Send request
		return sendBackgroundRequest(endpoint, options).then((response): R => {
			// Validate request props
			if (responseValidator !== undefined) {
				tryDecode(responseValidator, response);
			}

			return response;
		});
	};

	const factory: RequestHandlerFactory = (factoryProps) => {
		const handler = factoryHandler(factoryProps);

		localHandler = handler;
		const cleanup = addRequestHandler(endpoint, async (reqProps) => {
			// Validate request props
			if (requestValidator !== undefined) {
				tryDecode(requestValidator, reqProps);
			}

			return handler(reqProps);
		});

		return () => {
			localHandler = null;
			cleanup();
		};
	};

	return [factory, hook as (options: O) => Promise<R>] as const;
};

export const joinRequestHandlers =
	(handlers: RequestHandlerFactory[]): RequestHandlerFactory =>
		(props) => {
			const cancelHandlers = handlers.map((handler) => handler(props));
			return () => {
				cancelHandlers.forEach((cancel) => {
					cancel();
				});
			};
		};
