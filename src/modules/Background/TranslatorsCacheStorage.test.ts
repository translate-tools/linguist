import { clearAllMocks } from '../../lib/tests';
import { TranslatorsCacheStorage } from './TranslatorsCacheStorage';

beforeEach(clearAllMocks);

const testData = Array(10)
	.fill(null)
	.map((_, id) => ({
		from: 'en',
		to: 'de',
		originalText: 'original text ' + id,
		translatedText: 'translated text ' + id,
	}));

test('TranslatorsCacheStorage test', async () => {
	const cacheStorage = new TranslatorsCacheStorage('test-translator');

	// Write data
	for (const translationData of testData) {
		await cacheStorage.set(
			translationData.originalText,
			translationData.translatedText,
			translationData.from,
			translationData.to,
		);
	}

	// Test data persistence
	for (const translationData of testData) {
		const translatedText = await cacheStorage.get(
			translationData.originalText,
			translationData.from,
			translationData.to,
		);
		expect(translatedText).toBe(translationData.translatedText);
	}

	// Test after clear
	await cacheStorage.clear();

	const translationSample = testData[0];
	const translatedText = await cacheStorage.get(
		translationSample.originalText,
		translationSample.from,
		translationSample.to,
	);
	expect(translatedText).toBe(null);
});

describe('TranslatorsCacheStorage options', () => {
	test('TranslatorsCacheStorage with enabled `ignoreCase`', async () => {
		const translationSample = testData[0];
		const cacheStorage = new TranslatorsCacheStorage('test-translator', {
			ignoreCase: true,
		});

		// Write data
		await cacheStorage.set(
			translationSample.originalText,
			translationSample.translatedText,
			translationSample.from,
			translationSample.to,
		);

		const translatedTextForOriginalCase = await cacheStorage.get(
			translationSample.originalText,
			translationSample.from,
			translationSample.to,
		);
		expect(translatedTextForOriginalCase).toBe(translationSample.translatedText);

		const translatedTextForUpperCase = await cacheStorage.get(
			translationSample.originalText.toUpperCase(),
			translationSample.from,
			translationSample.to,
		);
		expect(translatedTextForUpperCase).toBe(translationSample.translatedText);
	});

	test('TranslatorsCacheStorage with disabled `ignoreCase`', async () => {
		const translationSample = testData[0];
		const cacheStorage = new TranslatorsCacheStorage('test-translator', {
			ignoreCase: false,
		});

		// Write data
		await cacheStorage.set(
			translationSample.originalText,
			translationSample.translatedText,
			translationSample.from,
			translationSample.to,
		);

		const translatedTextForOriginalCase = await cacheStorage.get(
			translationSample.originalText,
			translationSample.from,
			translationSample.to,
		);
		expect(translatedTextForOriginalCase).toBe(translationSample.translatedText);

		const translatedTextForUpperCase = await cacheStorage.get(
			translationSample.originalText.toUpperCase(),
			translationSample.from,
			translationSample.to,
		);
		expect(translatedTextForUpperCase).toBe(null);
	});
});

describe('multiple cache instances', () => {
	test('parallel use multiple cache instances', async () => {
		const cache1 = new TranslatorsCacheStorage('cache1');
		const cache2 = new TranslatorsCacheStorage('cache2');

		const dataSample1 = testData[0];
		const dataSample2 = testData[1];

		// Const write data
		await cache1.set(
			dataSample1.originalText,
			dataSample1.translatedText,
			dataSample1.from,
			dataSample1.to,
		);
		await cache2.set(
			dataSample2.originalText,
			dataSample2.translatedText,
			dataSample2.from,
			dataSample2.to,
		);

		// Test cached data
		const translatedText1 = await cache1.get(
			dataSample1.originalText,
			dataSample1.from,
			dataSample1.to,
		);
		expect(translatedText1).toBe(dataSample1.translatedText);

		const translatedText2 = await cache2.get(
			dataSample2.originalText,
			dataSample2.from,
			dataSample2.to,
		);
		expect(translatedText2).toBe(dataSample2.translatedText);

		// Test data independency
		await cache1.clear();
		await cache1
			.get(dataSample1.originalText, dataSample1.from, dataSample1.to)
			.then((translatedText) => {
				expect(translatedText).toBe(null);
			});

		await cache2
			.get(dataSample2.originalText, dataSample2.from, dataSample2.to)
			.then((translatedText) => {
				expect(translatedText).toBe(dataSample2.translatedText);
			});

		// Clear another stores
		const translatorNames = ['foo', 'bar', 'baz'];
		for (const translatorName of translatorNames) {
			const cacheToClean = new TranslatorsCacheStorage(translatorName);
			await cacheToClean.clear();
		}

		// Test data keep persistent
		await cache2
			.get(dataSample2.originalText, dataSample2.from, dataSample2.to)
			.then((translatedText) => {
				expect(translatedText).toBe(dataSample2.translatedText);
			});
	});
});
