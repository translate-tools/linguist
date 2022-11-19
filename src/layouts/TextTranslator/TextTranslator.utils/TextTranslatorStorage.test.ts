import { browser } from 'webextension-polyfill-ts';
import { TextTranslatorStorage } from './TextTranslatorStorage';

// TODO: add test for data migration
// "{"from":"en","to":"ja","translate":{"text":"wanderer in jungle","translate":"ジャングルの放浪者"}}"
test('TextTranslatorStorage CRUD operations', async () => {
	expect(typeof (global as any).chrome.storage.local.get).toBe('function');
	expect(typeof browser.storage.local.get).toBe('function');

	const sampleData = {
		from: 'en',
		to: 'ja',
		translate: {
			originalText: 'wanderer in jungle',
			translatedText: 'ジャングルの放浪者',
		},
	};

	TextTranslatorStorage.setData(sampleData as any);

	const dataFromStorage = await TextTranslatorStorage.getData();
	expect(dataFromStorage).toEqual(sampleData);
});
