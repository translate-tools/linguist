// TODO: show sites preference list on options page

import { TypeOf } from 'io-ts';

import { type } from '../../../../lib/types';

import { getDBInstance } from '../utils';

export const dataSignature = type.type({
	/**
	 * While `false`, auto translate will not work, while `true` will work with consider other options
	 */
	enableAutoTranslate: type.boolean,

	/**
	 * While size greater than 0, page language code must be in array
	 */
	autoTranslateLanguages: type.array(type.string),
});

export type SiteData = TypeOf<typeof dataSignature>;

// TODO: migrate data from `translateAlways`
// const storageKeyPrefix = 'SitePreferences:';

export const setPreferences = async (site: string, options: SiteData) => {
	const db = await getDBInstance();
	await db.put('sitePreferences', options, site);
};

export const getPreferences = async (site: string) => {
	const db = await getDBInstance();
	const entry = await db.get('sitePreferences', site);

	return entry ?? null;
};
