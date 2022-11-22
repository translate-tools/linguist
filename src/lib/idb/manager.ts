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

export type ExtractSchemeFromIDBConstructor<T> = T extends {
	upgrade: (db: IDB.IDBPDatabase<infer X>, ...params: any[]) => any;
}
	? X
	: never;

type UpgradeHandler<T> = Exclude<IDB.OpenDBCallbacks<T>['upgrade'], undefined>;

/**
 * Configure IDB plan by schemes array
 *
 * Plan provide a hooks to manage IDB:
 * - `update` to update IDB version and execute migrations
 */
export const getIDBPlan = <ActualDBSchema = unknown>(
	constructors: readonly [...IDBConstructor<any>[], IDBConstructor<ActualDBSchema>],
): {
	latestVersion: number;
	upgrade: UpgradeHandler<ActualDBSchema>;
} => {
	const sortedConstructors = [...constructors].sort(
		(scheme1, scheme2) => scheme1.version - scheme2.version,
	);

	const upgrade: UpgradeHandler<ActualDBSchema> = async (
		db,
		prevVersion,
		currentVersion,
		transaction,
	) => {
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

			// Remove versions under or equal to previous and over current
			const constructorsToUse = sortedConstructors.filter(
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

	return {
		latestVersion: sortedConstructors[sortedConstructors.length - 1].version,
		upgrade,
	};
};
