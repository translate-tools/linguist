// Storages
import { ConfigStorageMigration } from '../modules/ConfigStorage/ConfigStorage.migrations';
import { PopupWindowStorageMigration } from '../pages/popup/layout/PopupWindow.utils/PopupWindowStorage.migrations';
import { TextTranslatorStorageMigration } from '../layouts/TextTranslator/TextTranslator.utils/TextTranslatorStorage.migrations';
import { TranslatorsCacheStorageMigration } from '../modules/Background/TranslatorsCacheStorage.migrations';
import { AutoTranslationMigration } from '../requests/backend/autoTranslation/autoTranslation.migrations';

import { PersistentMigrationTask, migrateData } from './migrateData/migrateData';

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
	await migrateData(migrationsList);
};
