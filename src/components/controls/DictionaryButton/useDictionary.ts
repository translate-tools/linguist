import { useCallback, useEffect, useState } from 'react';
import { useImmutableCallback } from 'react-elegant-ui/esm/hooks/useImmutableCallback';
import { isEqual } from 'lodash';

import { isExtensionContext } from '../../../lib/browser';
import {
	onClearDictionary,
	onDictionaryEntryAdd,
	onDictionaryEntryDelete,
} from '../../../requests/backend/translations';
import { addTranslation } from '../../../requests/backend/translations/addTranslation';
import { deleteTranslation } from '../../../requests/backend/translations/deleteTranslation';
import { findTranslation } from '../../../requests/backend/translations/findTranslation';
import { ITranslation } from '../../../types/translation/Translation';

export const useDictionary = (translation: ITranslation | null) => {
	const { from, to, originalText, translatedText } = translation || {};
	const [dictionaryEntryId, setDictionaryEntryId] = useState<null | number>(null);
	const getDictionaryEntryId = useCallback(async () => {
		if (
			from === undefined ||
			to === undefined ||
			originalText === undefined ||
			translatedText === undefined
		)
			return null;
		return findTranslation({
			from,
			to,
			originalText: originalText.trim(),
			translatedText: translatedText.trim(),
		});
	}, [from, to, originalText, translatedText]);
	const [isInDictionary, setIsInDictionary] = useState(dictionaryEntryId !== null);
	const update = useImmutableCallback(() => {
		getDictionaryEntryId().then(setDictionaryEntryId);
	}, [getDictionaryEntryId]);
	const toggle = useImmutableCallback(() => {
		const nextState = !isInDictionary;
		setIsInDictionary(nextState);
		if (nextState) {
			if (dictionaryEntryId === null) {
				(async () => {
					const id = await getDictionaryEntryId();
					if (id !== null) {
						setDictionaryEntryId(id);
						return;
					}
					if (
						from === undefined ||
						to === undefined ||
						originalText === undefined ||
						translatedText === undefined
					) {
						setDictionaryEntryId(null);
						return;
					}
					addTranslation({
						from,
						to,
						originalText: originalText.trim(),
						translatedText: translatedText.trim(),
					}).then(setDictionaryEntryId);
				})();
			}
		} else {
			if (dictionaryEntryId !== null) {
				deleteTranslation(dictionaryEntryId).then(() =>
					setDictionaryEntryId(null),
				);
			}
		}
	}, [
		dictionaryEntryId,
		getDictionaryEntryId,
		from,
		to,
		isInDictionary,
		originalText,
		translatedText,
	]);

	useEffect(() => {
		getDictionaryEntryId().then(setDictionaryEntryId);
	}, [getDictionaryEntryId]);
	useEffect(() => {
		setIsInDictionary(dictionaryEntryId !== null);
	}, [dictionaryEntryId]);
	// Observe state
	useEffect(() => {
		// TODO: implement observing for content scripts
		// Don't observe state for content scripts
		if (!isExtensionContext) return;
		const cleanupFunctions: (() => any)[] = [];
		if (dictionaryEntryId === null) {
			const cleanup = onDictionaryEntryAdd((newTranslation) => {
				if (translation === null) return;
				const isEqualData = isEqual(newTranslation, translation);
				if (isEqualData) {
					update();
				}
			});
			cleanupFunctions.push(cleanup);
		} else {
			const cleanupOnDelete = onDictionaryEntryDelete(dictionaryEntryId, update);
			cleanupFunctions.push(cleanupOnDelete);
			const cleanupOnClear = onClearDictionary(update);
			cleanupFunctions.push(cleanupOnClear);
		}
		return () => {
			cleanupFunctions.map((fn) => fn());
		};
	}, [dictionaryEntryId, translation, update]);
	return { has: isInDictionary, toggle, update };
};
