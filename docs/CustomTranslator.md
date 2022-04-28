With Linguist you can use custom translators.

You may use it to include translators for your favorite translation services and even to use translator deployed on your local machine.

With custom translator you have control over all HTTP requests from the extension (except text to speak service at this time).

## WARNING

When you use custom translator, you insert javascript code which will evaluated in browser extension environment.

This is mean that you MUST trust to this code. Never add custom translators which code you don't understand or don't trust.

Otherwise, hacker may execute any code in your browser - for example, track your translations texts, take access to any opened site, steal your personal data and read your personal messages or steal your money on the site of your bank.

## How to use?

To use custom translator, you have to implement translator API on javascript and add this code on the options page.

If you can't programming, you can please help to your friend. If you can, you may share your translator for other people, just make issue with your code.

## Translator API

Code must have translator class and this object must be a last object in the code.

```js
class MyTranslator {
	// ...
}

// some other code may be after declaration
console.log('Hello world');

// last object in the code must be a translator
MyTranslator;
```

### Translator class signature

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

Example of dummy translator. In your code, you feel free to use HTTP requests to any urls.

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
