import { TranslatorClass } from '@translate-tools/core/types/Translator';

import { DEFAULT_TRANSLATOR } from '../../../config';
import { buildBackendRequest } from '../../utils/requestBuilder';
import {
	getCustomTranslatorsMapWithFormattedKeys,
	translatorModules,
} from '../../../app/Background';

import { getTranslators } from './data';
import { loadTranslator } from './utils';

export const getCustomTranslatorsClasses = () =>
	getTranslators({ order: 'asc' }).then(async (translators) => {
		const translatorsRecord: Record<number, TranslatorClass> = {};

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
		factoryHandler: ({ backgroundContext, config }) => {
			const update = async () => {
				const customTranslators = await getCustomTranslatorsClasses().then(
					getCustomTranslatorsMapWithFormattedKeys,
				);

				const translatorClasses = {
					...translatorModules,
					...customTranslators,
				};

				const latestConfig = await config.get();
				const { translatorModule: translatorName } = latestConfig;

				const isCustomTranslator = translatorName[0] === '#';
				if (isCustomTranslator) {
					const customTranslatorName = translatorName.slice(1);
					const isCurrentTranslatorAvailable =
						customTranslatorName in translatorClasses;

					// Reset translator to default
					if (!isCurrentTranslatorAvailable) {
						await config.set({
							...latestConfig,
							translatorModule: DEFAULT_TRANSLATOR,
						});
					}
				}

				const translateManager = await backgroundContext.getTranslateManager();

				translateManager.setTranslators(translatorClasses);
			};

			update();

			return update;
		},
	},
);
