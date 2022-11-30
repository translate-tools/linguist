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
 *
 * This class exists primarily to bind a storage classes to one interface
 */

export abstract class AbstractVersionedStorage {
	public static storageVersion = 0;
}
