import * as t from 'io-ts';
import { isRight } from 'fp-ts/lib/Either';

export const type = t;

/**
 * Helper for decode data by type
 */
export const tryDecode = <T>(type: t.Type<T>, data: any) => {
	const decodedData = type.decode(data);
	if (isRight(decodedData)) {
		return decodedData.right;
	}

	console.error('Data for the error below', data);
	throw new TypeError('Invalid type');
};

/**
 * Same as `tryDecode` but only for objects and more verbose
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

export const StringType = <T extends string>(stringOfType: T) =>
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
