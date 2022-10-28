import * as IDB from 'idb/with-async-ittr';

/**
 * Object contains constructor for exact IDB version
 */
export type IDBConstructor<T extends IDB.DBSchema | unknown> = {
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

/**
 * Configure IDB constructor to update version
 */
export const configureIDB = <ActualDBSchema>(
	constructors: IDBConstructor<any>[],
): IDB.OpenDBCallbacks<ActualDBSchema>['upgrade'] => {
	return async (db, prevVersion, currentVersion, transaction) => {
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

			const isFirstUpdate = prevVersion === 0;
			const constructorsToUse = constructors
				// Sort by versions
				.sort((scheme1, scheme2) => scheme1.version - scheme2.version)
				// Leave only last version for first update
				.slice(isFirstUpdate ? -1 : 0);

			if (
				constructorsToUse[constructorsToUse.length - 1].version !== currentVersion
			) {
				throw new Error(
					'Not found constructor to update IDB to version ' + currentVersion,
				);
			}

			let migrateFrom: number | null = null;
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
