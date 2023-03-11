import * as IDB from 'idb/with-async-ittr';

export type SerializedSpeaker = {
	name: string;
	code: string;
};

export type TTSKey = number;

export interface TTSStorageDBSchema extends IDB.DBSchema {
	speakers: {
		key: TTSKey;
		value: SerializedSpeaker;
	};
}

type DB = IDB.IDBPDatabase<TTSStorageDBSchema>;

/**
 * Storage implementation to keep custom TTS modules
 */
export class TTSStorage {
	private dbPromise: Promise<DB> | null = null;
	private async getDB() {
		if (this.dbPromise === null) {
			const dbPromise = IDB.openDB<TTSStorageDBSchema>('tts', 1, {
				upgrade(db) {
					db.createObjectStore('speakers', {
						autoIncrement: true,
					});
				},
			}).catch((reason) => {
				// Clear promise
				if (this.dbPromise === dbPromise) {
					this.dbPromise = null;
				}

				throw reason;
			});

			this.dbPromise = dbPromise;
		}

		return this.dbPromise;
	}

	public async add(speaker: SerializedSpeaker) {
		const db = await this.getDB();
		const id = await db.put('speakers', speaker);
		return id;
	}

	public async update(id: TTSKey, speaker: SerializedSpeaker) {
		const db = await this.getDB();
		await db.put('speakers', speaker, id);
	}

	public async delete(id: TTSKey) {
		const db = await this.getDB();
		await db.delete('speakers', id);
	}

	public async getAll() {
		const db = await this.getDB();
		const tx = db.transaction('speakers', 'readwrite');

		const speakers: Array<{
			id: TTSKey;
			data: SerializedSpeaker;
		}> = [];

		const startCursor = await tx.store.openCursor(null, 'next');
		if (startCursor !== null) {
			for await (const cursor of startCursor) {
				speakers.push({
					id: cursor.primaryKey,
					data: cursor.value,
				});
			}
		}

		await tx.done;

		return speakers;
	}

	public async get(id: TTSKey) {
		const db = await this.getDB();
		return db.get('speakers', id);
	}
}
