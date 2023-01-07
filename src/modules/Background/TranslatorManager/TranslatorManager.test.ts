import { TranslatorClass } from '@translate-tools/core/types/Translator';
import { TranslatorInstanceMembers } from '@translate-tools/core/types/Translator';
import { clearAllMocks } from '../../../lib/tests';

import { TranslatorManager } from '.';

const createTranslatorMockClass = (translatorName: string) => {
	return class MockTranslator {
		translate(text: string, from: string, to: string) {
			MockTranslator.mocks.translate();
			return Promise.resolve(`${translatorName}["${text}"-${from}-${to}]`);
		}

		translateBatch(texts: string[], from: string, to: string) {
			MockTranslator.mocks.translateBatch();
			return Promise.all(texts.map((text) => this.translate(text, from, to)));
		}

		getLengthLimit = () => 4000;
		getRequestsTimeout = () => 300;
		checkLimitExceeding = () => -10000;

		static isSupportedAutoFrom = () => true;
		static getSupportedLanguages = () => ['en', 'ru', 'ja', 'de'];
		static translatorName = 'FakeTranslator';
		static isRequiredKey = () => false;

		static mocks = {
			translate: jest.fn(),
			translateBatch: jest.fn(),
		};
	} as TranslatorClass<TranslatorInstanceMembers> & {
		mocks: {
			translate: jest.Mock;
			translateBatch: jest.Mock;
		};
	};
};

const createTranslatorsList = () => ({
	translator1: createTranslatorMockClass('translator1'),
	translator2: createTranslatorMockClass('translator2'),
	translator3: createTranslatorMockClass('translator3'),
});

const defaultConfig = {
	translatorModule: 'translator2',
	scheduler: {
		useCache: true,
		translateRetryAttemptLimit: 2,
		isAllowDirectTranslateBadChunks: true,
		directTranslateLength: null,
		translatePoolDelay: 300,
		chunkSizeForInstantTranslate: null,
	},
	cache: {
		ignoreCase: true,
	},
};

test('TranslatorManager thrown error when translator module not found', () => {
	const translatorManagerConfig = {
		...defaultConfig,
		translatorModule: 'unknown translator id',
	};
	const translatorManager = new TranslatorManager(
		translatorManagerConfig,
		createTranslatorsList(),
	);

	expect(translatorManager.getScheduler).toThrow(Error);
});

test('TranslatorManager translate text with selected translator', async () => {
	const translators = createTranslatorsList();
	const translatorManager = new TranslatorManager(defaultConfig, translators);

	const scheduler = translatorManager.getScheduler();
	const translatedText = await scheduler.translate('Hello world', 'en', 'de');

	const targetTranslator = new translators.translator2();
	const expectedText = await targetTranslator.translate('Hello world', 'en', 'de');

	expect(translatedText).toBe(expectedText);
});

describe('TranslatorManager consider cache preferences', () => {
	beforeEach(clearAllMocks);

	test('TranslatorManager with enabled cache', async () => {
		const translators = createTranslatorsList();
		const translatorManager = new TranslatorManager(defaultConfig, translators);

		const scheduler = translatorManager.getScheduler();

		// Should call translate method first time for each new translation request
		await scheduler.translate('Hello world', 'en', 'de');
		expect(translators.translator2.mocks.translate).toBeCalledTimes(1);

		await scheduler.translate('Another text', 'en', 'de');
		expect(translators.translator2.mocks.translate).toBeCalledTimes(2);

		// Should return translation from cache
		translators.translator2.mocks.translate.mockClear();

		await scheduler.translate('Hello world', 'en', 'de');
		expect(translators.translator2.mocks.translate).not.toBeCalled();
	});

	test('TranslatorManager with disabled cache', async () => {
		const translators = createTranslatorsList();
		const translatorManager = new TranslatorManager(
			{
				...defaultConfig,
				scheduler: {
					...defaultConfig.scheduler,
					useCache: false,
				},
			},
			translators,
		);

		const scheduler = translatorManager.getScheduler();

		// Should call translate method first time for each new translation request
		await scheduler.translate('Hello world', 'en', 'de');
		expect(translators.translator2.mocks.translate).toBeCalledTimes(1);

		await scheduler.translate('Another text', 'en', 'de');
		expect(translators.translator2.mocks.translate).toBeCalledTimes(2);

		// Should call translate method
		translators.translator2.mocks.translate.mockClear();

		await scheduler.translate('Hello world', 'en', 'de');
		expect(translators.translator2.mocks.translate).toBeCalled();

		// Consider config updates
		translatorManager.setConfig(defaultConfig);

		// TODO: implement behavior to reuse scheduler
		const scheduler2 = translatorManager.getScheduler();

		translators.translator2.mocks.translate.mockClear();

		// Should call translate method first time for each new translation request
		await scheduler2.translate('Hello world', 'en', 'de');
		expect(translators.translator2.mocks.translate).toBeCalledTimes(1);

		await scheduler2.translate('Another text', 'en', 'de');
		expect(translators.translator2.mocks.translate).toBeCalledTimes(2);

		// Should return translation from cache
		translators.translator2.mocks.translate.mockClear();

		await scheduler2.translate('Hello world', 'en', 'de');
		expect(translators.translator2.mocks.translate).not.toBeCalled();
	});
});
