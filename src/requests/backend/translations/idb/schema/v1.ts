import { DBSchema } from 'idb';

import { IDBConstructor } from '../../../../../lib/idb/manager';

export type IDBTranslationsSchemaV1 = DBSchema & {
	translations: {
		key: number;
		value: any;
	};
};

const migration: IDBConstructor<IDBTranslationsSchemaV1> = {
	version: 1,
	apply: (db) => {
		// Create store
		db.createObjectStore('translations', {
			keyPath: 'id',
			autoIncrement: true,
		});
	},
};

export default migration;
