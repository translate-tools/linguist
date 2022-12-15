// Storages
import { ConfigStorageMigration } from '../modules/ConfigStorage/migrations';
import { PopupWindowStorageMigration } from '../pages/popup/layout/PopupWindow.utils/migrations';
import { TextTranslatorStorageMigration } from '../layouts/TextTranslator/TextTranslator.utils/migrations';
import { TranslatorsCacheStorageMigration } from '../modules/Background/migrations';
import { SitePreferencesMigration } from '../requests/backend/autoTranslation/migrations';

import { ExpectedMigration, migrateData } from './migrateData/migrateData';

const migrationsList: ExpectedMigration[] = [
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
		migration: SitePreferencesMigration,
	},
];

export const migrateAll = async () => {
	await migrateData(migrationsList);
};
