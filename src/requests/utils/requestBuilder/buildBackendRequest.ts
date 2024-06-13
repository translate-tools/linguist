import * as t from 'io-ts';

import { tryDecode } from '../../../lib/types';
import { RequestHandlerFactory, RequestHandlerFactoryProps } from '../../types';

import { addRequestHandler, sendBackgroundRequest } from '..';

type BackgroundOptions<O = any, R = any, C = RequestHandlerFactoryProps> = {
	factoryHandler: (props: C) => (options: O) => Promise<R>;
	requestValidator?: t.Type<O, O>;
	responseValidator?: t.Type<R, R>;
};

/**
 * Factory for building requests which ensure its types
 */
export const buildBackendRequest = <O = void, R = void, C = RequestHandlerFactoryProps>(
	endpoint: string,
	{ factoryHandler, requestValidator, responseValidator }: BackgroundOptions<O, R, C>,
) => {
	const registeredListenersUrls = new Set<string>();
	let localHandler: ((options: O) => Promise<R>) | null = null;

	const hook = (options: O) => {
		// TODO: throw exceptions for attempts to call not ready handlers
		// Request listeners respond to requests from any frames except its own,
		// so if request sent from the same frame the listener set, no response will be sent
		// For this special case we call handler directly, instead of sent request.
		// We also should wait at least one request handler been registered, before call local handler,
		// because if no request handlers registered, then handler is not configured and does not ready to call
		const isExistsListenersInAnotherUrl = Array.from(
			registeredListenersUrls.values(),
		).some((url) => url !== location.href);
		const isHandlerReady = registeredListenersUrls.size > 0;
		if (isHandlerReady && !isExistsListenersInAnotherUrl) {
			if (localHandler === null) {
				throw new Error(
					`Request handler is not initialized for endpoint "${endpoint}"`,
				);
			}

			return localHandler(options);
		}

		// Send request
		console.warn('Sent request: ', endpoint);
		return sendBackgroundRequest(endpoint, options).then((response): R => {
			// Validate request props
			if (responseValidator !== undefined) {
				tryDecode(responseValidator, response);
			}

			return response;
		});
	};

	const factory: RequestHandlerFactory<C> = (factoryProps) => {
		const handler = factoryHandler(factoryProps);

		const listenerUrl = location.href;
		registeredListenersUrls.add(listenerUrl);

		localHandler = handler;
		const cleanup = addRequestHandler(endpoint, async (reqProps) => {
			// Validate request props
			if (requestValidator !== undefined) {
				tryDecode(requestValidator, reqProps);
			}

			console.warn('Request handler: ', endpoint);

			return handler(reqProps);
		});

		return () => {
			registeredListenersUrls.delete(listenerUrl);
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
