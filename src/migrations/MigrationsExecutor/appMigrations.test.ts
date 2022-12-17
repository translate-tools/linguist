import { clearAllMocks } from '../../lib/tests';
import { MigrationsStorage } from './MigrationsStorage';
import { PersistentMigrationsExecutor } from './PersistentMigrationsExecutor';

describe('migrations persistence', () => {
	beforeAll(async () => {
		await clearAllMocks();

		// TODO: encapsulate initializing
		// Init storage
		const migrationsStorage = new MigrationsStorage();
		await migrationsStorage.prepareStorage();
	});

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
		const migrationsStorage = new MigrationsStorage();
		const persistentMigrationsExecutor = new PersistentMigrationsExecutor(
			migrationsStorage,
		);

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
		const migrationsStorage = new MigrationsStorage();
		const persistentMigrationsExecutor = new PersistentMigrationsExecutor(
			migrationsStorage,
		);

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
});
