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

const languageCodes = [
	'aa',
	'ab',
	'ae',
	'af',
	'ak',
	'am',
	'an',
	'ar',
	'as',
	'av',
	'ay',
	'az',
	'ba',
	'be',
	'bg',
	'bh',
	'bi',
	'bm',
	'bn',
	'bo',
	'br',
	'bs',
	'ca',
	'ce',
	'ch',
	'co',
	'cr',
	'cs',
	'cu',
	'cv',
	'cy',
	'da',
	'de',
	'dv',
	'dz',
	'ee',
	'el',
	'en',
	'eo',
	'es',
	'et',
	'eu',
	'fa',
	'ff',
	'fi',
	'fj',
	'fo',
	'fr',
	'fy',
	'ga',
	'gd',
	'gl',
	'gn',
	'gu',
	'gv',
	'ha',
	'he',
	'hi',
	'ho',
	'hr',
	'ht',
	'hu',
	'hy',
	'hz',
	'ia',
	'id',
	'ie',
	'ig',
	'ii',
	'ik',
	'io',
	'is',
	'it',
	'iu',
	'ja',
	'jv',
	'ka',
	'kg',
	'ki',
	'kj',
	'kk',
	'kl',
	'km',
	'kn',
	'ko',
	'kr',
	'ks',
	'ku',
	'kv',
	'kw',
	'ky',
	'la',
	'lb',
	'lg',
	'li',
	'ln',
	'lo',
	'lt',
	'lu',
	'lv',
	'mg',
	'mh',
	'mi',
	'mk',
	'ml',
	'mn',
	'mr',
	'ms',
	'mt',
	'my',
	'na',
	'nb',
	'nd',
	'ne',
	'ng',
	'nl',
	'nn',
	'no',
	'nr',
	'nv',
	'ny',
	'oc',
	'oj',
	'om',
	'or',
	'os',
	'pa',
	'pi',
	'pl',
	'ps',
	'pt',
	'qu',
	'rm',
	'rn',
	'ro',
	'ru',
	'rw',
	'sa',
	'sc',
	'sd',
	'se',
	'sg',
	'si',
	'sk',
	'sl',
	'sm',
	'sn',
	'so',
	'sq',
	'sr',
	'ss',
	'st',
	'su',
	'sv',
	'sw',
	'ta',
	'te',
	'tg',
	'th',
	'ti',
	'tk',
	'tl',
	'tn',
	'to',
	'tr',
	'ts',
	'tt',
	'tw',
	'ty',
	'ug',
	'uk',
	'ur',
	'uz',
	've',
	'vi',
	'vo',
	'wa',
	'wo',
	'xh',
	'yi',
	'yo',
	'za',
	'zh',
	'zu',
];

export const postprocessLocale = (
	localeObject: Record<any, any>,
	languageCode: string,
) => {
	const languageCodePrefix = 'langCode_';
	const langFormatter = new Intl.DisplayNames([languageCode, 'en'], {
		type: 'language',
	});

	// Replace languages to ensure it's correct names
	const processedObject = Object.fromEntries(
		Object.entries(localeObject)
			// Remove all exists language names
			.filter(([key]) => !key.startsWith(languageCodePrefix))
			// Add all language codes list
			.concat(
				languageCodes.map((code) => {
					const languageName = langFormatter.of(code);

					// Handle case if can't find language
					if (!languageName)
						return [languageCodePrefix + code, { message: code }];

					const capitalizedLanguageName =
						languageName.slice(0, 1).toUpperCase() + languageName.slice(1);
					return [
						languageCodePrefix + code,
						{ message: capitalizedLanguageName },
					];
				}),
			),
	);

	return orderKeysInLocalizationObject(processedObject);
};
