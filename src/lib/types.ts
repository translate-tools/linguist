import * as t from 'io-ts';
import { isRight } from 'fp-ts/lib/Either';

export const type = t;

// TODO: remove not declared properties
/**
 * Try to decode object and return object with data or with errors
 */
export function decodeStruct<T>(
	type: t.Type<T>,
	data: any,
):
	| { data: T; errors: null }
	| {
			data: null;
			errors: Array<{
				key: string;
				value: unknown;
				type: t.Decoder<any, any>;
				message?: string;
			}>;
	  } {
	const decodeResult = type.decode(data);

	// Return decoded value
	if (isRight(decodeResult)) {
		return {
			data: decodeResult.right,
			errors: null,
		};
	}

	// Build errors object
	return {
		data: null,
		errors: decodeResult.left.map((error) => {
			// Remove root object from context tree
			const context = error.context.slice(1);
			const targetPropertyContext = context[context.length - 1];

			return {
				key: context.map(({ key }) => key).join('.'),
				value: error.value,
				type: targetPropertyContext.type,
				message: error.message,
			};
		}),
	};
}

// TODO: decode primitive values and generate reports like in `decodeStruct`
/**
 * Helper for decode data by type
 */
export function tryDecode<T>(type: t.Type<T>, data: any): T;
export function tryDecode<T>(type: t.Type<T>, data: any, defaultData: T): T;
export function tryDecode<T>(type: t.Type<T>, data: any, defaultData?: T) {
	const decodedData = type.decode(data);
	if (isRight(decodedData)) {
		return decodedData.right;
	}

	// TODO: remove this
	if (arguments.length >= 3) {
		return defaultData as T;
	}

	console.error('Data for the error below', data);
	throw new TypeError('Invalid type');
}

/**
 * Same as `tryDecode` but only for objects and more verbose
 *
 * @deprecated: use `decodeStruct` instead and generate exception
 */
export const tryDecodeObject = <T extends t.Props>(
	type: t.TypeC<T> | t.PartialC<T>,
	data: any,
) => {
	if (!(data instanceof Object)) {
		throw new TypeError('Data is not object');
	}

	const typeProps = type.props;

	const typeKeys = Object.keys(typeProps);
	const dataKeys = Object.keys(data);
	if (typeKeys.length !== dataKeys.length) {
		throw new RangeError('Number of elements in types and data is not equal');
	}

	for (const key in typeProps) {
		if (!(key in data)) {
			throw new RangeError(`Key "${key}" is not found`);
		}

		const decodedData = typeProps[key].decode(data[key]);
		if (!isRight(decodedData)) {
			throw new TypeError(`Invalid type of key "${key}"`);
		}
	}

	return data as t.TypeOfProps<T>;
};

/**
 * Validate type of value from TypeC object by path
 */
export const checkTypeByPath = <T extends t.Props>(
	typeObject: t.TypeC<T>,
	path: string[],
	value: any,
): boolean => {
	let type: t.TypeC<any> | t.Type<any> = typeObject;

	for (let i = 0; i < path.length; i++) {
		const segment = path[i];
		if ('props' in type) {
			type = type.props[segment];
		} else {
			return false;
		}
	}

	return isRight(type.decode(value));
};

// Type constructors

export const StringLiteralType = <T extends string>(stringOfType: T) =>
	new type.Type(
		`String["${stringOfType}"]`,
		(input: unknown): input is T =>
			typeof input === 'string' && input === stringOfType,
		(input, context) =>
			typeof input === 'string' && input === stringOfType
				? type.success(input as T)
				: type.failure(input, context),
		type.identity,
	);

export const StringPatternType = <T extends string = string>(pattern: RegExp) =>
	new type.Type(
		`StringPatternType["${pattern.source}"]`,
		(input: unknown): input is T => typeof input === 'string' && pattern.test(input),
		(input, context) =>
			typeof input === 'string' && pattern.test(input)
				? type.success(input as T)
				: type.failure(input, context),
		type.identity,
	);
