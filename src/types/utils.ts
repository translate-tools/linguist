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
 * Versioned storage object.
 *
 * All storages must extend this class to standardize behavior
 */
export interface VersionedStorage {
	/**
	 * Public name for write in versions DB
	 */
	publicName: string;

	/**
	 * Storage version must be increase with every change of storage structure.
	 *
	 * While run application this version will compared to version from storages database and if it different, will call method `updateStorageVersion`
	 */
	storageVersion: number;

	/**
	 * Method which call for each update storage version
	 *
	 * This method may be used to implement migration data between application versions,
	 * such as migrations must run only by condition
	 */
	updateStorageVersion: (prevVersion: number | null) => Promise<void>;
}

/**
 * Abstract class for `VersionedStorage` interface
 */
export abstract class AbstractVersionedStorage {
	public static storageVersion = 0;

	public static async updateStorageVersion(_prevVersion: number | null) {}
}

/**
 * Make all nested properties of object are optional
 */
export type DeepPartial<T> = T extends object
	? {
			[P in keyof T]?: DeepPartial<T[P]>;
	  }
	: T;
