With custom translator you may use Linguist with your favorite translation service if you not enough an embedded translators.

All you need to do it
- Go to Linguist settings in a section "Custom translators"
- Press button "Manage translators"
- Press "Add"
- Input translator name and insert module code

## Custom translators list

You can find a custom translators in a [custom translators list](https://github.com/translate-tools/linguist-translators).

Read [Offline translation manual](./manuals/OfflineTranslation.md) to get known how to setup offline translation with Linguist.

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
	/** * REQUIRED * * Method to translate single text */
	public translate(text: string, from: string, to: string) => Promise<string>;
	/** * REQUIRED * * Method to translate multiple texts */
	public translateBatch(text: string[], from: string, to: string) => Promise<string>;
	/** * REQUIRED * * return maximal length of string for translating */
	public getLengthLimit() => number;
	/** * REQUIRED * * return minimal timeout between requests */
	public getRequestsTimeout() => number;
	/** * REQUIRED * * return number of extra chars for text over limit */
	public checkLimitExceeding(text: string | string[]): number;
	/** * REQUIRED * * is translator support value 'auto' as text language */
	static isSupportedAutoFrom(): boolean;
	/** * REQUIRED * * return array of supported languages as ISO 639-1 codes */
	static getSupportedLanguages(): langCode[];
}
```

## Example

Example of a dummy translator. In your code, feel free to use HTTP requests to any urls.

```js
class FakeTranslator {
	translate = (text, from, to) => Promise.resolve(`FakeTranslator["${text}"-${from}-${to}]`);
	translateBatch = (texts, from, to) => Promise.all(texts.map((text) => this.translate(text, from, to)));
	getLengthLimit = () => 4000; getRequestsTimeout = () => 300; checkLimitExceeding = () => -10000;
	static isSupportedAutoFrom = () => true;
	static getSupportedLanguages = () => ['en', 'ru', 'ja', 'de'];
}
FakeTranslator;
```
