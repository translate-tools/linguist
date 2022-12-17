import { testPersistentMigrationsExecutor } from '../../lib/migrations/MigrationsExecutor/PersistentMigrationsExecutor.test';
import { PersistentMigrationsExecutor } from '../../lib/migrations/MigrationsExecutor/PersistentMigrationsExecutor';
import { clearAllMocks } from '../../lib/tests';

import { AppMigrationsStorage } from './AppMigrationsStorage';

describe('migrations persistence', () => {
	beforeAll(async () => {
		await clearAllMocks();

		// TODO: encapsulate initializing
		// Init storage
		const migrationsStorage = new AppMigrationsStorage();
		await migrationsStorage.prepareStorage();
	});

	testPersistentMigrationsExecutor(() => {
		const storage = new AppMigrationsStorage();
		return new PersistentMigrationsExecutor(storage);
	});
});
