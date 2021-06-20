// This code contains parts from https://github.com/plainheart/bing-translate-api/blob/e5ac48d346096681a758856bd606f147854d07cb/src/index.js

const fetchConfig = async () => {
	var pageText = await fetch('https://www.bing.com/translator').then((r) => r.text());

	const IIGSearch = pageText.match(/IG:"([^"]+)"/);
	if (IIGSearch === null) {
		throw new Error("Can't find IIG");
	}

	const IIG = IIGSearch[1];

	const IIDSearch = pageText.match(/data-iid="([^"]+)"/);
	if (IIDSearch === null) {
		throw new Error("Can't find IID");
	}

	const IID = IIDSearch[1];

	const TokenParamsSearch = pageText.match(
		/params_RichTranslateHelper\s?=\s?([^\]]+\])/,
	);
	if (TokenParamsSearch === null) {
		throw new Error("Can't find token params");
	}

	const [key, token, lifetime] = JSON.parse(TokenParamsSearch[1]);
	if (typeof key !== 'number') {
		throw new Error('Invalid key type');
	}
	if (typeof token !== 'string') {
		throw new Error('Invalid token type');
	}
	if (typeof lifetime !== 'number') {
		throw new Error('Invalid token lifetime type');
	}

	return {
		IID,
		IIG,
		key,
		token,
		lifetime,
	};
};

let lastConfig: null | {
	IID: string;
	IIG: string;

	/**
	 * Token timestamp
	 */
	key: number;

	token: string;

	/**
	 * Token lifetime in sec
	 */
	lifetime: number;
} = null;

function isTokenExpired() {
	if (lastConfig === null) {
		return true;
	}

	const { key: tokenTs, lifetime: tokenExpiryInterval } = lastConfig;
	return Date.now() - tokenTs > tokenExpiryInterval;
}

export const getConfig = async () => {
	if (isTokenExpired()) {
		lastConfig = await fetchConfig();
	}

	return lastConfig as Exclude<typeof lastConfig, null>;
};
