import * as t from 'io-ts';

import {
	RequestHandlerFactory,
	RequestHandlerFactoryProps,
	ClientRequestHandlerFactory,
	ClientRequestHandlerFactoryProps,
} from '../../requests/types';
import { sendBackgroundRequest, sendTabRequest, addRequestHandler } from '.';
import { tryDecode } from '../types';

// TODO: add property `allowManyHandlers` and when it `false` (by default) throw exception while attempt define 2 endpoints with same name
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

// TODO: split here

type TabOptions<O = any, R = any> = {
	factoryHandler: (
		props: ClientRequestHandlerFactoryProps,
	) => (options: O) => Promise<R>;
	requestValidator?: t.Type<O, O>;
	responseValidator?: t.Type<R, R>;
};

/**
 * Factory for building requests which ensure its types
 */
export const buildTabRequest = <O = void, R = void>(
	endpoint: string,
	{ factoryHandler, requestValidator, responseValidator }: TabOptions<O, R>,
) => {
	const hook = (tabId: number, options: O) =>
		sendTabRequest(tabId, endpoint, options).then((response): R => {
			// Validate request props
			if (responseValidator !== undefined) {
				tryDecode(responseValidator, response);
			}

			return response;
		});

	const factory: ClientRequestHandlerFactory = (factoryProps) => {
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
		hook as O extends void
			? (tabId: number) => Promise<R>
			: (tabId: number, options: O) => Promise<R>,
	] as const;
};
