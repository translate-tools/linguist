import { addRequestHandler, bgSendRequest } from '../../../lib/communication';
import { tryDecode, type } from '../../../lib/types';
import { RequestHandlerFactory } from '../../types';
import { deleteEntry } from './data';

export const deleteTranslation = (id: number): Promise<void> =>
	bgSendRequest('deleteTranslation', id);

const deleteTranslationIn = type.number;

export const deleteTranslationFactory: RequestHandlerFactory = () => {
	addRequestHandler('deleteTranslation', async (rawData) => {
		const id = tryDecode(deleteTranslationIn, rawData);

		return deleteEntry(id);
	});
};
