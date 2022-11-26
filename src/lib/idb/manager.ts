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
 * WARNING: to correct typing provide latest scheme as last element in a static array
 *
 * Plan provide a hooks to manage IDB:
 * - `update` to update IDB version and execute migrations
 */
export const getIDBPlan = <ActualDBSchema = unknown>(
	schemes: readonly [...IDBConstructor<any>[], IDBConstructor<ActualDBSchema>],
): {
	latestVersion: number;
	upgrade: UpgradeHandler<ActualDBSchema>;
} => {
	const sortedSchemes = [...schemes].sort(
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
			if (schemes.length === 0) {
				throw new Error('IDB constructors array are empty');
			}

			// Remove versions under or equal to previous and over current
			const schemesToUse = sortedSchemes.filter(
				(scheme) =>
					scheme.version > prevVersion && scheme.version <= currentVersion,
			);

			if (schemesToUse[schemesToUse.length - 1].version !== currentVersion) {
				throw new Error(
					'Not found constructor to update IDB to version ' + currentVersion,
				);
			}

			let migrateFrom: number | null = prevVersion;
			for (const scheme of schemesToUse) {
				if (isAborted) {
					throw new Error('Update transaction was aborted');
				}

				// Cast to any, because we apply several schemes to one DB
				await scheme.apply(db as any, {
					// Cast type because we can provide one transaction to several schemes
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
		latestVersion: sortedSchemes[sortedSchemes.length - 1].version,
		upgrade,
	};
};
