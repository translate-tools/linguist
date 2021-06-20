interface Options {
	tokenStart?: string;
	tokenEnd?: string;
	tokenClose?: string;
}

interface TextContainer {
	id: string;
	text: string;
}

/**
 * Util for pack multiple requests to one
 *
 * It's just encode/decode all texts with custom separation options
 */
export class Multiplexor {
	private readonly options: Options = {
		tokenStart: '<',
		tokenEnd: '>',
		tokenClose: '/',
	};

	// private readonly token: Array<Array<string>> = [];
	constructor(options?: Options) {
		if (options !== undefined) {
			['tokenStart', 'tokenEnd', 'tokenClose'].forEach((key) => {
				const item = (options as any)[key];
				if (item !== undefined && item.search(/\&|\:/) !== -1) {
					throw new Error(`Option ${key} has disallow characters (& or :)`);
				}
			});

			for (const key in options) {
				(this.options as any)[key] = (options as any)[key];
			}
		}
	}

	public encode(data: TextContainer[]) {
		const {
			tokenStart: start = '',
			tokenEnd: end = '',
			tokenClose: close = '',
		} = this.options;

		return data
			.map(
				({ id, text }) =>
					start + id + end + this.escape(text) + start + close + id + end,
			)
			.join(' ');
	}

	public decode(text: string) {
		const {
			tokenStart: start = '',
			tokenEnd: end = '',
			tokenClose: close = '',
		} = this.options;

		const pattern = `${start}\\s*(\\d+)\\s*${end}([\\w\\W]+?)${start}\\s*${close}\\s*\\1\\s*${end}`;
		const matchSet = text.matchAll(new RegExp(pattern, 'gm'));

		const result = [];
		let match = matchSet.next();
		while (!match.done) {
			result.push({
				id: match.value[1],
				text: this.unescape(match.value[2]),
			});
			match = matchSet.next();
		}

		return result;
	}

	private escape(text: string) {
		['tokenStart', 'tokenEnd', 'tokenClose'].forEach((key, index) => {
			const token = (this.options as any)[key];
			if (token.length > 0) {
				text = text.replace(
					new RegExp(this.escapeRegExp(token), 'g'),
					`&${index + 1}:`,
				);
			}
		});

		return text;
	}

	private unescape(text: string) {
		['tokenStart', 'tokenEnd', 'tokenClose'].forEach((key, index) => {
			const token = (this.options as any)[key];
			if (token.length > 0) {
				text = text.replace(new RegExp(`&${index + 1}:`, 'g'), token);
			}
		});

		return text;
	}

	private escapeRegExp(text: string) {
		return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
	}
}
