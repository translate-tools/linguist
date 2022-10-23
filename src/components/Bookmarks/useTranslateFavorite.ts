import { useCallback, useEffect, useState } from 'react';
import { isEqual } from 'lodash';
import { useImmutableCallback } from 'react-elegant-ui/esm/hooks/useImmutableCallback';

import { findTranslation } from '../../requests/backend/translations/findTranslation';
import { addTranslation } from '../../requests/backend/translations/addTranslation';
import { deleteTranslation } from '../../requests/backend/translations/deleteTranslation';
import {
	onClearDictionary,
	onDictionaryEntryAdd,
	onDictionaryEntryDelete,
} from '../../requests/backend/translations';

import { ITranslation } from '../../types/translation/Translation';
import { isExtensionContext } from '../../lib/browser';

// TODO: think about consistent name for liked translations: bookmarks, favorites, dictionary entries
// TODO: rename this hook and components consistent, check i18n texts consistent too
export const useTranslateFavorite = (translation: ITranslation | null) => {
	const { from, to, originalText, translatedText } = translation || {};

	const [favId, setFavId] = useState<null | number>(null);

	const findFavId = useCallback(async () => {
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

	const [isFavorite, setIsFavorite] = useState(favId !== null);

	const update = useImmutableCallback(() => {
		findFavId().then(setFavId);
	}, [findFavId]);

	const toggleFavorite = useImmutableCallback(() => {
		const nextState = !isFavorite;
		setIsFavorite(nextState);

		if (nextState) {
			if (favId === null) {
				(async () => {
					const id = await findFavId();
					if (id !== null) {
						setFavId(id);
						return;
					}

					if (
						from === undefined ||
						to === undefined ||
						originalText === undefined ||
						translatedText === undefined
					) {
						setFavId(null);
						return;
					}

					addTranslation({
						from,
						to,
						originalText: originalText.trim(),
						translatedText: translatedText.trim(),
					}).then(setFavId);
				})();
			}
		} else {
			if (favId !== null) {
				deleteTranslation(favId).then(() => setFavId(null));
			}
		}
	}, [favId, findFavId, from, to, isFavorite, originalText, translatedText]);

	useEffect(() => {
		findFavId().then(setFavId);
	}, [findFavId]);

	useEffect(() => {
		setIsFavorite(favId !== null);
	}, [favId]);

	// Observe state
	useEffect(() => {
		// TODO: implement observing for content scripts
		// Don't observe state for content scripts
		if (!isExtensionContext) return;

		const cleanupFunctions: (() => any)[] = [];

		if (favId === null) {
			const cleanup = onDictionaryEntryAdd((newTranslation) => {
				if (translation === null) return;

				const isEqualData = isEqual(newTranslation, translation);
				if (isEqualData) {
					update();
				}
			});

			cleanupFunctions.push(cleanup);
		} else {
			const cleanupOnDelete = onDictionaryEntryDelete(favId, update);
			cleanupFunctions.push(cleanupOnDelete);

			const cleanupOnClear = onClearDictionary(update);
			cleanupFunctions.push(cleanupOnClear);
		}

		return () => {
			cleanupFunctions.map((fn) => fn());
		};
	}, [favId, translation, update]);

	return { isFavorite, toggleFavorite, update };
};
