With Linguist you can use custom translators.

You may use it to include translators for your favorite translation services and even to use a translator deployed on your local machine.

With a custom translator you have control over all HTTP requests from within the extension (except text to speech services at this time).

## WARNING

When you use a custom translator, you insert javascript code which will be evaluated in the browser extension environment.

This means that you MUST trust this code. Never add custom translators with code that you don't understand or don't trust.

Otherwise, hackers may execute any code in your browser - for example, to track your translated texts, have access to any opened site, steal your personal data and read your personal messages or to steal your money using the site of your bank.

## How to use?

To use a custom translator, you have to implement the translator API in javascript and add this code to the options page.

If you can't program, you can ask for help from your friend. If you can, you may share your translator to other people. Just make an issue with your code.

## Translator API

Code must have a translator class and this object must be the last object in the code.

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

See also code for another services in [Offline translation manual](./manuals/OfflineTranslation.md)
