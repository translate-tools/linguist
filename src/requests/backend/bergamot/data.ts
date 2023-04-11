import * as IDB from 'idb/with-async-ittr';
import { isEqual } from 'lodash';

import { type } from '../../../lib/types';

export type File = {
	name: string;
	expectedSha256Hash: string;

	type: string;
	direction: {
		from: string;
		to: string;
	};
	buffer: ArrayBuffer;

	timestamp: number;
};

export type FileEntry = {
	name: string;
	expectedSha256Hash: string;

	type: string;
	direction: {
		from: string;
		to: string;
	};

	timestamp: number;
};

export type FileChunk = {
	fileId: number;
	partNumber: number;
	data: ArrayBuffer;
};

export const FileType = type.type({
	name: type.string,
	expectedSha256Hash: type.string,

	type: type.string,
	timestamp: type.number,
	direction: type.type({
		from: type.string,
		to: type.string,
	}),
	buffer: type.array(type.number),
});

export const FileWithKeyType = type.type({
	key: type.number,
	data: FileType,
});

export type IFileWithKey = { key: number; data: FileEntry };

export interface DBSchema extends IDB.DBSchema {
	files: {
		key: number;
		value: FileEntry;
	};
	chunks: {
		key: number;
		value: FileChunk;
		indexes: {
			fileId: number;
		};
	};
}

type DB = IDB.IDBPDatabase<DBSchema>;

let DBInstance: null | DB = null;
const getDB = async () => {
	const DBName = 'bergamot';

	if (DBInstance === null) {
		DBInstance = await IDB.openDB<DBSchema>(DBName, 1, {
			upgrade(db) {
				db.createObjectStore('files', {
					keyPath: 'id',
					autoIncrement: true,
				});
				const chunks = db.createObjectStore('chunks', {
					keyPath: 'id',
					autoIncrement: true,
				});
				chunks.createIndex('fileId', 'fileId');
			},
		});
	}

	return DBInstance;
};

const maxBufferLen = 50 * 1024 ** 2;

export const addFile = async (entry: File) => {
	const db = await getDB();
	const transaction = db.transaction(['files', 'chunks'], 'readwrite');

	const { buffer, ...fileData } = entry;

	// Write file entry
	const fileId = await transaction.objectStore('files').put(fileData);

	// Write file chunks
	// We split file to chunks, to support any file size
	console.warn('Add file to bergamot cache. Size: ', buffer.byteLength);
	for (let offset = 0; offset < buffer.byteLength; offset += maxBufferLen) {
		const slice = buffer.slice(offset, offset + maxBufferLen);
		await transaction.objectStore('chunks').put({
			fileId,
			partNumber: offset,
			data: slice,
		});
	}

	await transaction.done;
};

export type FileSearchParams = Partial<
	Pick<FileEntry, 'type' | 'direction' | 'expectedSha256Hash'>
>;
export const getFile = async (searchParams: FileSearchParams) => {
	let file: File | null = null;

	const searchParamsEntry = Object.entries(searchParams);

	const db = await getDB();
	const transaction = db.transaction(['files', 'chunks'], 'readonly');
	const startCursor = await transaction.objectStore('files').openCursor(null);
	if (startCursor !== null) {
		fileSearchLoop: for await (const fileCursor of startCursor) {
			const fileData = fileCursor.value;

			// Search file by exact match params
			const isMatchSearchParams = searchParamsEntry.every(([key, value]) =>
				isEqual(fileData[key as keyof FileSearchParams], value),
			);
			if (!isMatchSearchParams) continue;

			const chunksStartCursor = transaction
				.objectStore('chunks')
				.index('fileId')
				.iterate(fileCursor.primaryKey);
			if (chunksStartCursor !== null) {
				// Collect chunks
				const chunks: FileChunk[] = [];
				for await (const chunkCursor of chunksStartCursor) {
					chunks.push(chunkCursor.value);
				}

				if (chunks.length === 0) throw new Error('No file chunks found');

				// Get buffer
				let buffer: ArrayBuffer;
				if (chunks.length === 1) {
					// Set buffer as is
					buffer = chunks[0].data;
				} else {
					// Build buffer
					const bufferLen = chunks.reduce(
						(acc, { data }) => acc + data.byteLength,
						0,
					);
					const mergedBuffer = new Uint8Array(bufferLen);

					let bytesOffset = 0;
					chunks
						.sort((a, b) => a.partNumber - b.partNumber)
						.forEach(({ data }) => {
							mergedBuffer.set(new Uint8Array(data), bytesOffset);
							bytesOffset += data.byteLength;
						});

					buffer = mergedBuffer.buffer;
				}

				// Collect file
				file = {
					...fileData,
					buffer,
				};

				break fileSearchLoop;
			}
		}
	}
	await transaction.done;

	return file;
};
