import { migrateSitePreferences } from '../requests/backend/autoTranslation/migrations';

export type Migration = () => Promise<any>;

/**
 * Function for run all migrations
 *
 * Migration is are process of converting data from old format to new.
 * For example, move data from `localStorage` to `indexedDB`
 *
 * NOTE: migration must be lazy i.e. run only by condition and only once
 */
export const migrateAll = async () => {
	const migrations: Migration[] = [migrateSitePreferences];

	console.log('Start migrations');

	for (const migration of migrations) {
		await migration().catch((error) => {
			console.error('Migration error', error);
		});
	}

	console.log('End of migrations');
};
