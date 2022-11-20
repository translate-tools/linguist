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
