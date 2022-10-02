import { useCallback, useEffect, useState } from 'react';
import { findTranslation } from '../../requests/backend/translations/findTranslation';
import { useImmutableCallback } from 'react-elegant-ui/esm/hooks/useImmutableCallback';
import { addTranslation } from '../../requests/backend/translations/addTranslation';
import { deleteTranslation } from '../../requests/backend/translations/deleteTranslation';

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

	return { isFavorite, toggleFavorite, update };
};
