import { TranslatorBacking } from '../../../../thirdparty/bergamot/src/frontend/TranslatorBacking';
import {
	TranslationModelFileReference,
	LanguagesDirection,
} from '../../../../thirdparty/bergamot/src/types';

import { addBergamotFile } from '../../../requests/backend/bergamot/addBergamotFile';
import { getBergamotFile } from '../../../requests/backend/bergamot/getBergamotFile';

export class TranslatorBackingWithCache extends TranslatorBacking {
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
}
