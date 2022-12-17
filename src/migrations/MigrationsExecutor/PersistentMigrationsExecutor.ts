import { MigrationTask } from '../migrations';

import { MigrationsStorage } from './MigrationsStorage';

export type PersistentMigrationTask = {
	name: string;
	migration: MigrationTask;
};

export class PersistentMigrationsExecutor {
	private readonly storage: MigrationsStorage;
	constructor(storage: MigrationsStorage) {
		this.storage = storage;
	}

	/**
	 * Run migrations
	 *
	 * Migration is a process of converting data from a legacy format to an actual format.
	 * For example, move data from `localStorage` to `indexedDB`
	 *
	 * Migrations are not execute for a new users
	 */
	public async executeMigrations(
		migrationsList: PersistentMigrationTask[],
	): Promise<void> {
		const migrationsVersions = await this.storage.getMigrationsVersions();

		// Filter migrations
		const migrationsToApply = migrationsList.filter(
			(migrationObject, index, migrations) => {
				const { name, migration } = migrationObject;

				if (name.length === 0) {
					console.error('Data for error below', {
						index,
						migration: migrationObject,
					});
					throw new TypeError('Storage must have name');
				}

				const migrationNameIndex = migrations.findIndex(
					(migration) => migration.name === name,
				);
				if (migrationNameIndex !== index) {
					console.error('Data for error below', {
						index,
						migration: migrationObject,
					});
					throw new Error('Storage names must be unique');
				}

				const shouldApplyMigration =
					!(name in migrationsVersions) ||
					migrationsVersions[name] < migration.version;
				return shouldApplyMigration;
			},
		);

		// Not have migrations to apply
		if (migrationsToApply.length === 0) return;

		// Set actual data structure versions and exit for new users
		const shouldOnlySetVersions = Object.keys(migrationsVersions).length === 0;
		if (shouldOnlySetVersions) {
			console.log('Set actual storage versions');

			for (const { name, migration } of migrationsToApply) {
				migrationsVersions[name] = migration.version;
			}

			await this.storage.setMigrationsVersions(migrationsVersions);
			return;
		}

		console.log('Start migrations');

		// Execute migrations
		for (const { name, migration } of migrationsToApply) {
			const latestVersion = migration.version;

			// Special value '0' for case when storage apply migration first time
			const currentVersion = migrationsVersions[name] ?? 0;

			await migration.migrate(currentVersion, latestVersion);

			// Update storage version
			migrationsVersions[name] = latestVersion;
			await this.storage.setMigrationsVersions(migrationsVersions);
		}

		console.log('End of migrations');
	}
}
