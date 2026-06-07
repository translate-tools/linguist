# Translator

The translator is a core component used to translate texts between languages.

The translator API is designed to handle texts efficiently in terms of the ratio of texts translated per time to number of requests.

Translator methods may be called intensively, which is why it is important to set correct rate limits.

## Translator API

The translator must be implemented in [custom module format](./custom-module.md).

The minimal translator must implement the following API:

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
	public translateBatch(text: string[], from: string, to: string) => Promise<string[]>;

	/**
	 * REQUIRED
	 *
	 * returns the maximum length of string for translating
	*/
	public getLengthLimit() => number;

	/**
	 * REQUIRED
	 *
	 * returns the minimum timeout between requests
	*/
	public getRequestsTimeout() => number;

	/**
	 * REQUIRED
	 *
	 * returns the number of extra chars for text over the limit
	*/
	public checkLimitExceeding(text: string | string[]): number;

	/**
	 * REQUIRED
	 *
	 * whether the translator supports the value 'auto' as the text language
	*/
	static isSupportedAutoFrom(): boolean;
	/**
	 * REQUIRED
	 *
	 * returns an array of supported languages as ISO 639-1 codes
	*/
	static getSupportedLanguages(): langCode[];

}
```

## Example

Example of a dummy translator. In your code, feel free to use HTTP requests to any URLs.

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
