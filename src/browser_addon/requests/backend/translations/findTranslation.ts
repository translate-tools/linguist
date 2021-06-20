import { TypeOf } from 'io-ts';
import { addRequestHandler, bgSendRequest } from '../../../lib/communication';
import { tryDecode, type } from '../../../lib/types';
import { RequestHandlerFactory } from '../../types';
import { findEntry } from './data';

const findTranslationIn = type.type({
	from: type.union([type.string, type.undefined]),
	to: type.union([type.string, type.undefined]),
	text: type.union([type.string, type.undefined]),
	translate: type.union([type.string, type.undefined]),
});

const findTranslationOut = type.union([type.number, type.null]);

export const findTranslation = (data: TypeOf<typeof findTranslationIn>) =>
	bgSendRequest('findTranslation', data).then((rsp) =>
		tryDecode(findTranslationOut, rsp),
	);

export const findTranslationFactory: RequestHandlerFactory = () => {
	addRequestHandler('findTranslation', async (rawData) => {
		const data = tryDecode(findTranslationIn, rawData);
		const entry = await findEntry(data);

		return entry === null ? null : entry.key;
	});
};
