import { Dispatch, SetStateAction } from 'react';

/**
 * Type for class object which implement some interface
 *
 * First param for class interface, second for static props
 * @example
 * type SomeCar = ClassObject<AbstractRedCar, typeof AbstractRedCar>;
 */
export type ClassObject<Class, StaticProps extends {} = {}> = {
	new (): Class;
} & StaticProps;

/**
 * Define value and setter for it
 */
export type MutableValue<Name extends string, Type> = {
	[K in `${Name}`]: Type;
} &
	{
		[K in `set${Capitalize<Name>}`]: Dispatch<SetStateAction<Type>>;
	};
