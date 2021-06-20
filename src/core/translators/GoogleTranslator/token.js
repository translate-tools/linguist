// TKK value from https://github.com/FilipePS/Traduzir-paginas-web/blob/f3a4956a1aa96b7a9124864158a5200827694521/background/translationService.js
const googleTranslateTKK = '448487.932609646';

//
// Obfuscated logic: START
//
/* eslint-disable no-bitwise */

function shiftLeftOrRightThenSumOrXor(num, optString) {
	for (let i = 0; i < optString.length - 2; i += 3) {
		let acc = optString.charAt(i + 2);
		if ('a' <= acc) {
			acc = acc.charCodeAt(0) - 87;
		} else {
			acc = Number(acc);
		}
		if (optString.charAt(i + 1) == '+') {
			acc = num >>> acc;
		} else {
			acc = num << acc;
		}
		if (optString.charAt(i) == '+') {
			num += acc & 4294967295;
		} else {
			num ^= acc;
		}
	}
	return num;
}

function transformQuery(query) {
	const bytesArray = [];
	let idx = [];
	for (let i = 0; i < query.length; i++) {
		let charCode = query.charCodeAt(i);

		if (128 > charCode) {
			bytesArray[idx++] = charCode;
		} else {
			if (2048 > charCode) {
				bytesArray[idx++] = (charCode >> 6) | 192;
			} else {
				if (
					55296 == (charCode & 64512) &&
					i + 1 < query.length &&
					56320 == (query.charCodeAt(i + 1) & 64512)
				) {
					charCode =
						65536 +
						((charCode & 1023) << 10) +
						(query.charCodeAt(++i) & 1023);
					bytesArray[idx++] = (charCode >> 18) | 240;
					bytesArray[idx++] = ((charCode >> 12) & 63) | 128;
				} else {
					bytesArray[idx++] = (charCode >> 12) | 224;
				}
				bytesArray[idx++] = ((charCode >> 6) & 63) | 128;
			}
			bytesArray[idx++] = (charCode & 63) | 128;
		}
	}
	return bytesArray;
}

function calcHash(query, windowTkk) {
	const tkkSplited = windowTkk.split('.');
	const tkkIndex = Number(tkkSplited[0]) || 0;
	const tkkKey = Number(tkkSplited[1]) || 0;

	const bytesArray = transformQuery(query);

	let encondingRound = tkkIndex;
	for (let i = 0; i < bytesArray.length; i++) {
		encondingRound += bytesArray[i];
		encondingRound = shiftLeftOrRightThenSumOrXor(encondingRound, '+-a^+6');
	}
	encondingRound = shiftLeftOrRightThenSumOrXor(encondingRound, '+-3^+b+-f');

	encondingRound ^= tkkKey;
	if (encondingRound <= 0) {
		encondingRound = (encondingRound & 2147483647) + 2147483648;
	}

	const normalizedResult = encondingRound % 1000000;
	return normalizedResult.toString() + '.' + (normalizedResult ^ tkkIndex);
}

/* eslint-enable no-bitwise */
//
// Obfuscated logic: END
//

export function getToken(query) {
	return new Promise((res) => res({ value: calcHash(query, googleTranslateTKK) }));
}
