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

/**
 * Return object values as keys
 */
export type RecordValues<T extends Record<any, any>> = {
	[K in keyof T as T[K]]: any;
};

/**
 * Make type from object values
 */
export type RecordValue<T extends Record<any, string | number>> = keyof RecordValues<T>;

/**
 * Abstract storage object.
 *
 * All storages must extend this class to standardize behavior
 */
export abstract class AbstractVersionedStorage {
	/**
	 * Storage version must be increase with every change of storage structure.
	 *
	 * While run application this version will compared to version from storages database and if it different, will call method `updateStorageVersion`
	 */
	public static storageVersion = 0;

	/**
	 * Method which call for each update storage version
	 *
	 * This method may be used to implement migration data between application versions,
	 * such as migrations must run only by condition
	 */
	public static async updateStorageVersion(_prevVersion: number | null) {}
}
