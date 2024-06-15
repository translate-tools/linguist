import * as t from 'io-ts';

import { tryDecode } from '../../../lib/types';
import { RequestHandlerFactory, RequestHandlerFactoryProps } from '../../types';

import { addRequestHandler, sendBackgroundRequest } from '..';

type BackgroundOptions<O = any, R = any, C = RequestHandlerFactoryProps> = {
	factoryHandler: (props: C) => (options: O) => Promise<R>;
	filter?: (props: C) => (options: O) => boolean;
	requestValidator?: t.Type<O, O>;
	responseValidator?: t.Type<R, R>;
};

/**
 * Factory for building requests which ensure its types
 */
export const buildBackendRequest = <O = void, R = void, C = RequestHandlerFactoryProps>(
	endpoint: string,
	{
		factoryHandler,
		filter,
		requestValidator,
		responseValidator,
	}: BackgroundOptions<O, R, C>,
) => {
	const registeredListenersUrls = new Set<string>();
	let preparedRequestHandler: {
		handler: (options: O) => Promise<R>;
		filter?: (options: O) => boolean;
	} | null = null;

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
			if (preparedRequestHandler === null) {
				throw new Error(
					`Request handler is not initialized for endpoint "${endpoint}"`,
				);
			}

			if (preparedRequestHandler.filter) {
				const shouldBeHandled = preparedRequestHandler.filter(options);
				if (!shouldBeHandled)
					throw new Error(
						`Request handler available only in the same frame where request sent, but request rejected by filter`,
					);
			}

			return preparedRequestHandler.handler(options);
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

	const factory: RequestHandlerFactory<C> = (factoryProps) => {
		const requestFilter = filter ? filter(factoryProps) : undefined;
		const requestHandler = factoryHandler(factoryProps);

		const listenerUrl = location.href;
		registeredListenersUrls.add(listenerUrl);

		preparedRequestHandler = {
			handler: requestHandler,
			filter: requestFilter,
		};
		const cleanup = addRequestHandler(endpoint, (reqProps) => {
			if (requestFilter) {
				const shouldBeHandled = requestFilter(reqProps);
				if (!shouldBeHandled) return;
			}

			return Promise.resolve().then(async () => {
				// Validate request props
				if (requestValidator !== undefined) {
					tryDecode(requestValidator, reqProps);
				}

				return requestHandler(reqProps);
			});
		});

		return () => {
			registeredListenersUrls.delete(listenerUrl);
			preparedRequestHandler = null;
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
