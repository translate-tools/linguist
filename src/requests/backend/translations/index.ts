import { ITranslation } from '../../../types/translation/Translation';
import { addRequestHandler, sendBackgroundRequest } from '../../utils';

const DICTIONARY_EVENTS = {
	ADD: 'event:updateDictionary.add',
	DELETE: 'event:updateDictionary.delete',
	CLEAR: 'event:updateDictionary.clear',
} as const;

export const notifyDictionaryEntryAdd = (translation: ITranslation) => {
	sendBackgroundRequest(DICTIONARY_EVENTS.ADD, translation);
};
export const onDictionaryEntryAdd = (onAdd: (translation: ITranslation) => any) => {
	return addRequestHandler(DICTIONARY_EVENTS.ADD, onAdd);
};

export const notifyDictionaryEntryDelete = (id: number) => {
	sendBackgroundRequest(DICTIONARY_EVENTS.DELETE, id);
};
export const onDictionaryEntryDelete = (id: number, onDelete: () => any) => {
	return addRequestHandler(DICTIONARY_EVENTS.DELETE, (entryId: number) => {
		if (entryId === id) onDelete();
	});
};

export const notifyDictionaryClear = () => {
	sendBackgroundRequest(DICTIONARY_EVENTS.CLEAR);
};
export const onClearDictionary = (onClear: () => any) => {
	return addRequestHandler(DICTIONARY_EVENTS.CLEAR, onClear);
};
