/**
 * This file imported from a bergamot project
 * Source: https://github.com/browsermt/bergamot-translator/blob/82c276a15c23a40bc7e21e8a1e0a289a6ce57017/wasm/module/worker/translator-worker.js
 */

/**
 * YAML parser for trivial cases
 */
export class YAML {
	/**
	 * Parses YAML into dictionary. Does not interpret types, all values are a
	 * string. No support for objects other than the top level.
	 */
	static parse(yaml: string) {
		const out: Record<string, string> = {};

		yaml.split('\n').forEach((line, i) => {
			let match;
			if ((match = line.match(/^\s*([A-Za-z0-9_][A-Za-z0-9_-]*):\s*(.*)$/))) {
				const key = match[1];
				out[key] = match[2].trim();
			} else if (!line.trim()) {
				// whitespace, ignore
			} else {
				throw Error(`Could not parse line ${i + 1}: "${line}"`);
			}
		});

		return out;
	}

	/**
	 * Turns an object into a YAML string. No support for objects, only simple
	 * types and lists of simple types.
	 */
	static stringify(data: Record<string, string | number | boolean | string[]>) {
		return Object.entries(data).reduce((str, [key, value]) => {
			let stringifiedValue = '';
			if (Array.isArray(value)) {
				// Strings array
				stringifiedValue = value.map((val) => `\n  - ${val}`).join('');
			} else if (
				typeof value === 'number' ||
				typeof value === 'boolean' ||
				value.match(/^\d*(\.\d+)?$/)
			) {
				// Number
				stringifiedValue = `${value}`;
			} else {
				stringifiedValue = `${value}`; // Quote?
			}

			return str + `${key}: ${stringifiedValue}\n`;
		}, '');
	}
}
