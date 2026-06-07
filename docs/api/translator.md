# Translator

Translator is a core component called to translate texts between languages.

The translator API is designed to handle texts efficiently in terms of translated texts per time, and number of requests ratio.

Translator methods may be called intensively, this is why it is important to set correct rate limits.

### Translator API

The translator must be implemented in [custom module format](./custom-module.md).

The minimal translator must implement the API below:

```ts
class Translator {
	/**
	 * REQUIRED
	 *
	 * Method to translate single text
	*/
	public translate(text: string, from: string, to: string) => Promise<string>;

	/**
	 * REQUIRED
	 *
	 * Method to translate multiple texts
	*/
	public translateBatch(text: string[], from: string, to: string) => Promise<string>;

	/**
	 * REQUIRED
	 *
	 * return maximal length of string for translating
	*/
	public getLengthLimit() => number;

	/**
	 * REQUIRED
	 *
	 * return minimal timeout between requests
	*/
	public getRequestsTimeout() => number;

	/**
	 * REQUIRED
	 *
	 * return number of extra chars for text over limit
	*/
	public checkLimitExceeding(text: string | string[]): number;

	/**
	 * REQUIRED
	 *
	 * is translator support value 'auto' as text language
	*/
	static isSupportedAutoFrom(): boolean;
	/**
	 * REQUIRED
	 *
	 * return array of supported languages as ISO 639-1 codes
	*/
	static getSupportedLanguages(): langCode[];

}
```

## Example

Example of a dummy translator. In your code, feel free to use HTTP requests to any urls.

```js
class FakeTranslator {
	translate = (text, from, to) =>
		Promise.resolve(`FakeTranslator["${text}"-${from}-${to}]`);
	translateBatch = (texts, from, to) =>
		Promise.all(texts.map((text) => this.translate(text, from, to)));

	getLengthLimit = () => 4000;
	getRequestsTimeout = () => 300;
	checkLimitExceeding = () => -10000;

	static isSupportedAutoFrom = () => true;
	static getSupportedLanguages = () => ['en', 'ru', 'ja', 'de'];
}

FakeTranslator;
```
