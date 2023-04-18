import { createMigrationTask } from '../../../../lib/migrations/createMigrationTask';

import { PopupWindowStorage } from './PopupWindowStorage';

export const PopupWindowStorageMigration = createMigrationTask([
	{
		version: 1,
		async migrate() {
			// Migrate data from `localStorage`
			const keyPrefix = 'PopupPage.tabSet#';
			for (const key of Object.keys(localStorage)) {
				// Skip not match keys
				if (!key.startsWith(keyPrefix)) continue;

				// Copy
				const activeTabId = localStorage.getItem(key);
				if (typeof activeTabId === 'string') {
					// Cut prefix to get hash from key
					const hash = key.slice(keyPrefix.length);

					// Write data
					await new PopupWindowStorage().setActiveTab(hash, activeTabId);
				}

				// Remove
				localStorage.removeItem(key);
			}
		},
	},
]);
