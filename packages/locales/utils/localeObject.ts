export const orderKeysInLocalizationObject = (object: Record<any, any>) =>
	Object.fromEntries(
		Object.entries(object).sort(([keyA], [keyB]) => {
			const sortPredicate = (a: any, b: any) => (a < b ? -1 : a > b ? 1 : 0);

			// Place lang codes at end of list
			const weightA = keyA.startsWith('langCode_') ? 1 : 0;
			const weightB = keyB.startsWith('langCode_') ? 1 : 0;

			if (weightA > 0 || weightB > 0) {
				// Lexicographical sorting if both keys are language codes
				if (weightA > 0 && weightB > 0) return sortPredicate(keyA, keyB);

				return weightA > 0 ? 1 : -1;
			}

			// Lexicographical sorting
			return sortPredicate(keyA, keyB);
		}),
	);
