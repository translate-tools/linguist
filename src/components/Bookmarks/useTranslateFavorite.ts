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

// TODO: think about consistent name for liked translations: bookmarks, favorites, dictionary entries
// TODO: rename this hook and components consistent, check i18n texts consistent too
export const useTranslateFavorite = ({
	from,
	to,
	text,
	translate,
}: {
	from?: string;
	to?: string;
	text?: string;
	translate: string | null;
}) => {
	const [favId, setFavId] = useState<null | number>(null);

	const findFavId = useCallback(async () => {
		if (
			text === undefined ||
			translate === null ||
			from === undefined ||
			to === undefined
		) {
			return null;
		} else {
			return findTranslation({
				from,
				to,
				text: text.trim(),
				translate: translate.trim(),
			});
		}
	}, [from, text, to, translate]);

	const [isFavorite, setIsFavorite] = useState(favId !== null);

	const update = useImmutableCallback(() => {
		findFavId().then(setFavId);
	}, [findFavId]);

	const toggleFavorite = useImmutableCallback(() => {
		const state = !isFavorite;
		setIsFavorite(state);

		if (state) {
			if (favId === null) {
				(async () => {
					const id = await findFavId();
					if (id !== null) {
						setFavId(id);
						return;
					}

					if (
						text === undefined ||
						translate === null ||
						from === undefined ||
						to === undefined
					) {
						setFavId(null);
					} else {
						addTranslation({
							from,
							to,
							text: text.trim(),
							translate: translate.trim(),
						}).then(setFavId);
					}
				})();
			}
		} else {
			if (favId !== null) {
				deleteTranslation(favId).then(() => setFavId(null));
			}
		}
	}, [favId, findFavId, from, isFavorite, text, to, translate]);

	useEffect(() => {
		findFavId().then(setFavId);
	}, [findFavId]);

	useEffect(() => {
		setIsFavorite(favId !== null);
	}, [favId]);

	// Observe state
	useEffect(() => {
		const cleanupFunctions: (() => any)[] = [];

		if (favId === null) {
			const cleanup = onDictionaryEntryAdd((translation) => {
				const isEqualData = isEqual(translation, {
					from,
					to,
					text,
					translate,
				});

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
	}, [favId, from, text, to, translate, update]);

	return { isFavorite, toggleFavorite, update };
};
