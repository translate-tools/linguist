// Storages
import {
	PersistentMigrationsExecutor,
	PersistentMigrationTask,
} from '../../lib/migrations/MigrationsExecutor/PersistentMigrationsExecutor';
import { PopupWindowStorageMigration } from '../../pages/popup/layout/PopupWindow.utils/PopupWindowStorage.migrations';
import { TextTranslatorStorageMigration } from '../../pages/popup/tabs/TextTranslator/TextTranslator.utils/TextTranslatorStorage.migrations';
import { AutoTranslationMigration } from '../../requests/backend/autoTranslation/autoTranslation.migrations';

import { TranslatorsCacheStorageMigration } from '../Background/TranslatorsCacheStorage/TranslatorsCacheStorage.migrations';
import { ConfigStorageMigration } from '../ConfigStorage/ConfigStorage.migrations';
import { AppMigrationsStorage } from './App/AppMigrationsStorage';

const migrationsList: PersistentMigrationTask[] = [
	{
		name: 'ConfigStorage',
		migration: ConfigStorageMigration,
	},
	{
		name: 'TextTranslatorStorage',
		migration: TextTranslatorStorageMigration,
	},
	{
		name: 'TranslatorCache',
		migration: TranslatorsCacheStorageMigration,
	},
	{
		name: 'PopupWindowStorage',
		migration: PopupWindowStorageMigration,
	},
	{
		name: 'autoTranslationPreferences',
		migration: AutoTranslationMigration,
	},
];

export const migrateAll = async () => {
	const migrationsStorage = new AppMigrationsStorage();
	const migrationExecutor = new PersistentMigrationsExecutor(migrationsStorage);
	await migrationExecutor.executeMigrations(migrationsList);
};
