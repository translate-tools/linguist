import { TypeOf } from 'io-ts';

import { type } from '../../../../lib/types';

import { getDBInstance } from '../utils';

export const dataSignature = type.boolean;

export type LanguageInfo = TypeOf<typeof dataSignature>;

export const addLanguage = async (language: string, status: LanguageInfo) => {
	const db = await getDBInstance();
	await db.put('autoTranslatedLanguages', status, language);
};

export const deleteLanguage = async (language: string) => {
	const db = await getDBInstance();
	await db.delete('autoTranslatedLanguages', language);
};

export const getLanguage = async (language: string) => {
	const db = await getDBInstance();
	const result = await db.get('autoTranslatedLanguages', language);
	return result ?? null;
};

// export const getLanguages = async () => {
// 	const db = await getDBInstance();
// 	const languages = await db.getAll('autoTranslatedLanguages');

// 	return languages;
// };
