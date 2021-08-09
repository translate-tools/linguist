import { getDBInstance } from '../utils';

export const addLanguage = async (language: string) => {
	const db = await getDBInstance();
	await db.put('autoTranslatedLanguages', language, language);
};

export const deleteLanguage = async (language: string) => {
	const db = await getDBInstance();
	await db.delete('autoTranslatedLanguages', language);
};

export const hasLanguage = async (language: string) => {
	const db = await getDBInstance();
	const result = await db.get('autoTranslatedLanguages', language);
	return result !== undefined;
};

export const getLanguages = async () => {
	const db = await getDBInstance();
	const languages = await db.getAll('autoTranslatedLanguages');

	return languages ?? null;
};
