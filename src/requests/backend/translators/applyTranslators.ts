import { TranslatorClass } from '@translate-tools/core/types/Translator';

import { DEFAULT_TRANSLATOR } from '../../../modules/Background';
import { buildBackendRequest } from '../../utils/requestBuilder';

import { getTranslators } from './data';
import { loadTranslator } from './utils';

// TODO: move logic to `TranslateSchedulerConfig`
export const [applyTranslatorsFactory, applyTranslators] = buildBackendRequest(
	'applyTranslators',
	{
		factoryHandler: ({ bg, config }) => {
			const update = async () =>
				getTranslators({ order: 'asc' })
					.then(async (translators) => {
						const translatorsRecord: Record<string, TranslatorClass> = {};

						translators.forEach(({ key, data: { name, code } }) => {
							try {
								translatorsRecord[key] = loadTranslator(code);
							} catch (error) {
								console.error(
									`Translator "${name}" (id:${key}) is thrown exception`,
									error,
								);
							}
						});

						const translateManager = await bg.getTranslateManager();
						translateManager.setCustomTranslators(translatorsRecord);

						return translatorsRecord;
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
