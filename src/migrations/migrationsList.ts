// Storages
import { ConfigStorageMigration } from '../app/ConfigStorage/ConfigStorage.migrations';
import { PopupWindowStorageMigration } from '../pages/popup/layout/PopupWindow.utils/PopupWindowStorage.migrations';
import { TextTranslatorStorageMigration } from '../pages/popup/tabs/TextTranslator/TextTranslator.utils/TextTranslatorStorage.migrations';
import { TranslatorsCacheStorageMigration } from '../app/Background/TranslatorsCacheStorage/TranslatorsCacheStorage.migrations';
import { AutoTranslationMigration } from '../requests/backend/autoTranslation/autoTranslation.migrations';

import {
	PersistentMigrationTask,
	PersistentMigrationsExecutor,
} from '../lib/migrations/MigrationsExecutor/PersistentMigrationsExecutor';
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
