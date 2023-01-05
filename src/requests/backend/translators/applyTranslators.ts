import { TranslatorClass } from '@translate-tools/core/types/Translator';

import {
	DEFAULT_TRANSLATOR,
	mergeCustomTranslatorsWithBasicTranslators,
} from '../../../modules/Background';
import { buildBackendRequest } from '../../utils/requestBuilder';

import { getTranslators } from './data';
import { loadTranslator } from './utils';

export const getCustomTranslatorsClasses = () =>
	getTranslators({ order: 'asc' }).then(async (translators) => {
		const translatorsRecord: Record<string, TranslatorClass> = {};

		// Validate and collect translators
		for (const { key, data: translatorData } of translators) {
			try {
				translatorsRecord[key] = loadTranslator(translatorData.code);
			} catch (error) {
				console.error(
					`Translator "${translatorData.name}" (id:${key}) is thrown exception`,
					error,
				);
			}
		}

		return translatorsRecord;
	});

// TODO: move logic to `TranslateSchedulerConfig`
export const [applyTranslatorsFactory, applyTranslators] = buildBackendRequest(
	'applyTranslators',
	{
		factoryHandler: ({ bg, config }) => {
			const update = async () =>
				getCustomTranslatorsClasses()
					.then(async (customTranslators) => {
						const translateManager = await bg.getTranslateManager();

						const translatorClasses =
							mergeCustomTranslatorsWithBasicTranslators(customTranslators);
						translateManager.setTranslators(translatorClasses);

						return customTranslators;
					})
					.then(async (translators) => {
						const latestConfig = await config.get();
						const { translatorModule: translatorName } = latestConfig;

						const isCustomTranslator = translatorName[0] === '#';
						if (!isCustomTranslator) return;

						// Reset translator to default if custom translator is not available
						const customTranslatorName = translatorName.slice(1);
						if (!(customTranslatorName in translators)) {
							await config.set({
								...latestConfig,
								translatorModule: DEFAULT_TRANSLATOR,
							});
						}
					});

			update();

			return update;
		},
	},
);
