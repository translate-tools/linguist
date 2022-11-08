import * as IDB from 'idb/with-async-ittr';

/**
 * Object contains constructor for exact IDB version
 */
export type IDBConstructor<T extends IDB.DBSchema | unknown> = {
	/**
	 * IDB version to apply constructor
	 */
	version: number;
	apply: (
		database: IDB.IDBPDatabase<T>,
		options: {
			transaction: IDB.IDBPTransaction<T, IDB.StoreNames<T>[], 'versionchange'>;
			oldVersion: number;
			newVersion: number | null;
			migrateFrom: number | null;
		},
	) => any;
};

// TODO: return IDB hooks, latest scheme version
/**
 * Configure IDB constructor to update version
 */
export const configureIDB = <ActualDBSchema>(
	constructors: IDBConstructor<any>[],
): Exclude<IDB.OpenDBCallbacks<ActualDBSchema>['upgrade'], undefined> => {
	return async (db, prevVersion, currentVersion, transaction) => {
		// `null` mean IDB will delete https://developer.mozilla.org/en-US/docs/Web/API/IDBVersionChangeEvent/newVersion#value
		const isDeletionUpgrade = currentVersion === null;
		if (isDeletionUpgrade) return;

		let isAborted = false;
		transaction.addEventListener(
			'abort',
			() => {
				isAborted = true;
			},
			{ once: true },
		);

		try {
			if (constructors.length === 0) {
				throw new Error('IDB constructors array are empty');
			}

			const constructorsToUse = constructors
				// Sort by versions
				.sort((scheme1, scheme2) => scheme1.version - scheme2.version)
				// Remove versions under or equal to previous and over current
				.filter(
					(scheme) =>
						scheme.version > prevVersion && scheme.version <= currentVersion,
				);

			if (
				constructorsToUse[constructorsToUse.length - 1].version !== currentVersion
			) {
				throw new Error(
					'Not found constructor to update IDB to version ' + currentVersion,
				);
			}

			let migrateFrom: number | null = prevVersion;
			for (const scheme of constructorsToUse) {
				if (isAborted) {
					throw new Error('Update transaction was aborted');
				}

				await scheme.apply(db, {
					transaction: transaction as any,
					oldVersion: prevVersion,
					newVersion: currentVersion,
					migrateFrom,
				});

				migrateFrom = scheme.version;
			}

			return transaction.done;
		} catch (error) {
			if (!isAborted) {
				transaction.abort();
			}

			throw error;
		}
	};
};
