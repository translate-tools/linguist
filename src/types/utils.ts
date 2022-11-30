import { Dispatch, SetStateAction } from 'react';

/**
 * Type for class object which implement some interface
 *
 * First param for class interface, second for static props
 * @example
 * type SomeCar = ClassObject<AbstractRedCar, typeof AbstractRedCar>;
 */
export type ClassObject<Class, StaticProps extends {} = {}> = {
	new (...args: any[]): Class;
} & StaticProps;

/**
 * Define value and setter for it
 */
export type MutableValue<Name extends string, Type> = {
	[K in `${Name}`]: Type;
} & {
	[K in `set${Capitalize<Name>}`]: Dispatch<SetStateAction<Type>>;
};

/**
 * Return object values as keys
 */
export type RecordValues<T extends Record<any, any>> = T[keyof T];

/**
 * Make all nested properties of object are optional
 */
export type DeepPartial<T> = T extends object
	? {
			[P in keyof T]?: DeepPartial<T[P]>;
	  }
	: T;
