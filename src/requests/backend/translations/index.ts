// TODO: rework to use events generated on `browser.runtime.getBackgroundPage()`
import { ITranslation } from '../../../types/translation/Translation';
import { addRequestHandler, sendBackgroundRequest } from '../../utils';

const DICTIONARY_EVENTS = {
	ADD: 'event:updateDictionary.add',
	DELETE: 'event:updateDictionary.delete',
	CLEAR: 'event:updateDictionary.clear',
} as const;

const ignoreError = (error: any) => {
	if (error instanceof Error) {
		if (
			error.message.includes(
				'Could not establish connection. Receiving end does not exist.',
			)
		) {
			console.log('IGNORE', error);
			return;
		}
		throw error;
	}
};

export const notifyDictionaryEntryAdd = (translation: ITranslation) => {
	sendBackgroundRequest(DICTIONARY_EVENTS.ADD, translation).catch(ignoreError);
};
export const onDictionaryEntryAdd = (onAdd: (translation: ITranslation) => any) => {
	return addRequestHandler(DICTIONARY_EVENTS.ADD, onAdd);
};

export const notifyDictionaryEntryDelete = (id: number) => {
	sendBackgroundRequest(DICTIONARY_EVENTS.DELETE, id).catch(ignoreError);
};
export const onDictionaryEntryDelete = (id: number, onDelete: () => any) => {
	return addRequestHandler(DICTIONARY_EVENTS.DELETE, (entryId: number) => {
		if (entryId === id) onDelete();
	});
};

export const notifyDictionaryClear = () => {
	sendBackgroundRequest(DICTIONARY_EVENTS.CLEAR).catch(ignoreError);
};
export const onClearDictionary = (onClear: () => any) => {
	return addRequestHandler(DICTIONARY_EVENTS.CLEAR, onClear);
};
