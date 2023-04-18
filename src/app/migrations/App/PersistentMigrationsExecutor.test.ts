import { PersistentMigrationsExecutor } from '../../../lib/migrations/MigrationsExecutor/PersistentMigrationsExecutor';
import { testPersistentMigrationsExecutor } from '../../../lib/migrations/MigrationsExecutor/PersistentMigrationsExecutor.test';
import { clearAllMocks } from '../../../lib/tests';

import { AppMigrationsStorage } from './AppMigrationsStorage';

describe('migrations persistence', () => {
	beforeAll(async () => {
		await clearAllMocks();
	});

	testPersistentMigrationsExecutor(() => {
		const storage = new AppMigrationsStorage();
		return new PersistentMigrationsExecutor(storage);
	});
});
