import { TypeOf } from 'io-ts';
import { addRequestHandler, bgSendRequest } from '../../../lib/communication';
import { tryDecode, type } from '../../../lib/types';
import { RequestHandlerFactory } from '../../types';
import { addEntry } from './data';

const addTranslationIn = type.type({
	from: type.string,
	to: type.string,
	text: type.string,
	translate: type.string,
});

const addTranslationOut = type.number;

export const addTranslation = (data: TypeOf<typeof addTranslationIn>) =>
	bgSendRequest('addTranslation', data).then((rsp) =>
		tryDecode(addTranslationOut, rsp),
	);

export const addTranslationFactory: RequestHandlerFactory = () => {
	addRequestHandler('addTranslation', async (rawData) => {
		const data = tryDecode(addTranslationIn, rawData);

		return addEntry({ ...data, date: new Date().getTime() });
	});
};
