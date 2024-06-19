/**
 * Object describes migration
 */
export type Migration = {
	/**
	 * Data structure version
	 */
	version: number;

	/**
	 * Function to migrate data
	 */
	migrate: (previousVersion: number) => Promise<void>;
};

export type MigrationHooks = {
	onComplete?: () => Promise<void>;
};

/**
 * Task to migrate from one version to another
 * Task may execute several migrations, so it may take a time
 */
export type MigrationTask = {
	/**
	 * Task version
	 */
	version: number;

	/**
	 * Function to migrate data
	 *
	 * WARNING: previous version may contain `0` in case when data structure run migration first time
	 */
	migrate: (previousVersion: number, currentVersion: number) => Promise<void>;

	hooks?: MigrationHooks;
};

/**
 * Build migration task from migrations list
 */
export const createMigrationTask = (
	migrations: Migration[],
	hooks?: MigrationHooks,
): MigrationTask => {
	const sortedMigrations = migrations.sort(
		(migration1, migration2) => migration1.version - migration2.version,
	);

	const latestMigration =
		sortedMigrations.length > 0
			? sortedMigrations[sortedMigrations.length - 1]
			: undefined;
	const lastMigrationVersion = latestMigration ? latestMigration.version : 0;

	return {
		version: lastMigrationVersion,
		hooks,
		migrate: async (fromVersion: number, toVersion: number) => {
			const migrationsToApply = sortedMigrations.filter(
				(migration) =>
					migration.version > fromVersion && migration.version <= toVersion,
			);

			if (migrationsToApply.length === 0) return;

			let currentVersion = fromVersion;
			for (const migration of migrationsToApply) {
				await migration.migrate(currentVersion);
				currentVersion = migration.version;
			}
		},
	};
};
