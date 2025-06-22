import browser from 'webextension-polyfill';

import { TranslatorBacking } from '../../../../thirdparty/bergamot/src/frontend/TranslatorBacking';
import {
	LanguagesDirection,
	TranslationModel,
	TranslationModelFileReference,
} from '../../../../thirdparty/bergamot/src/types';
import { addBergamotFile } from '../../../requests/backend/bergamot/addBergamotFile';
import { getBergamotFile } from '../../../requests/backend/bergamot/getBergamotFile';
import { isChromium } from '../../browser';

import { OffscreenWorker } from './OffscreenWorker';

export class TranslatorBackingWithCache extends TranslatorBacking {
	private readonly backingStorageName = 'bergamotBacking';

	async loadModelRegistery(): Promise<TranslationModel[]> {
		// TODO: return cache only when fetch failed
		const { [this.backingStorageName]: dataFromStorage } =
			await browser.storage.local.get(this.backingStorageName);
		if (dataFromStorage) {
			return dataFromStorage;
		}
		const modelRegistry = await super.loadModelRegistery();
		// Write data
		await browser.storage.local.set({ [this.backingStorageName]: modelRegistry });
		return modelRegistry;
	}
	async getModelFile(
		part: string,
		file: TranslationModelFileReference,
		direction: LanguagesDirection,
	) {
		// Try get from cache
		const cachedData = await getBergamotFile({
			type: part,
			expectedSha256Hash: file.expectedSha256Hash,
			direction,
		});
		if (cachedData !== null) {
			return [part, cachedData.buffer] as const;
		}
		// Load data
		const result = await super.getModelFile(part, file, direction);
		// Write cache
		const buffer = result[1];
		if (buffer !== null) {
			await addBergamotFile({
				name: file.name,
				expectedSha256Hash: file.expectedSha256Hash,
				type: part,
				buffer,
				direction,
			});
		}
		return result;
	}
	protected createWorker = (url: string): Worker => {
		if (isChromium()) {
			return new OffscreenWorker(url);
		} else {
			return new Worker(url);
		}
	};
}
