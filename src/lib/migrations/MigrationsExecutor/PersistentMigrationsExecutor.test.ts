import { PersistentMigrationsExecutor } from './PersistentMigrationsExecutor';

/**
 * Execute jest tests for `PersistentMigrationsExecutor` implementations
 *
 * This function exports to provide reference tests for any implementation of `PersistentMigrationsExecutor` or its storage
 */
export const testPersistentMigrationsExecutor = (
	createPersistentExecutor: () => PersistentMigrationsExecutor,
) => {
	const getMockedMigrations = () => {
		const migrateFooStub = jest.fn();
		const migrateBarStub = jest.fn();

		return [
			{
				name: 'migrationFoo',
				migration: {
					version: 1,
					migrate: migrateFooStub,
				},
			},
			{
				name: 'migrationBar',
				migration: {
					version: 5,
					migrate: migrateBarStub,
				},
			},
		];
	};

	test('migrations does not execute for new users', async () => {
		const persistentMigrationsExecutor = createPersistentExecutor();

		const migrations = getMockedMigrations();

		const migrationFoo = migrations[0];
		const migrationBar = migrations[1];

		// Call first time and only remember migrations versions
		await persistentMigrationsExecutor.executeMigrations(migrations);
		expect(migrationFoo.migration.migrate).not.toHaveBeenCalled();
		expect(migrationBar.migration.migrate).not.toHaveBeenCalled();

		// Call one more time and do nothing
		await persistentMigrationsExecutor.executeMigrations(migrations);
		expect(migrationFoo.migration.migrate).not.toHaveBeenCalled();
		expect(migrationBar.migration.migrate).not.toHaveBeenCalled();
	});

	test('migrations run when versions changes', async () => {
		const persistentMigrationsExecutor = createPersistentExecutor();

		const migrations = getMockedMigrations();

		const migrationFoo = migrations[0];
		const migrationBar = migrations[1];

		// Migrate foo
		jest.clearAllMocks();
		migrationFoo.migration.version++;

		await persistentMigrationsExecutor.executeMigrations(migrations);
		expect(migrationFoo.migration.migrate).toHaveBeenCalled();
		expect(migrationBar.migration.migrate).not.toHaveBeenCalled();

		// Migrate bar
		jest.clearAllMocks();
		migrationBar.migration.version++;

		await persistentMigrationsExecutor.executeMigrations(migrations);
		expect(migrationFoo.migration.migrate).not.toHaveBeenCalled();
		expect(migrationBar.migration.migrate).toHaveBeenCalled();

		// Migrate foo and bar
		jest.clearAllMocks();
		migrationFoo.migration.version++;
		migrationBar.migration.version++;

		await persistentMigrationsExecutor.executeMigrations(migrations);
		expect(migrationFoo.migration.migrate).toHaveBeenCalled();
		expect(migrationBar.migration.migrate).toHaveBeenCalled();

		// Downgrade bar version
		jest.clearAllMocks();
		migrationBar.migration.version = 1;

		await persistentMigrationsExecutor.executeMigrations(migrations);
		expect(migrationFoo.migration.migrate).not.toHaveBeenCalled();
		expect(migrationBar.migration.migrate).not.toHaveBeenCalled();
	});
};

describe('basic implementation of PersistentMigrationsExecutor', () => {
	let migrationsData: Record<string, number> = {};
	testPersistentMigrationsExecutor(() => {
		const storage = {
			setMigrationsVersions: async (migrations: Record<string, number>) => {
				migrationsData = migrations;
			},
			getMigrationsVersions: async () => {
				return migrationsData;
			},
		};

		return new PersistentMigrationsExecutor(storage);
	});
});
