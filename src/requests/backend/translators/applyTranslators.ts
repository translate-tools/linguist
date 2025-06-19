import { DEFAULT_TRANSLATOR } from '../../../config';
import { buildBackendRequest } from '../../utils/requestBuilder';

import { getTranslatorsClasses, isCustomTranslatorId } from '.';
// TODO: move logic to `TranslateSchedulerConfig`
export const [applyTranslatorsFactory, applyTranslators] = buildBackendRequest(
	'applyTranslators',
	{
		factoryHandler: ({ backgroundContext, config }) => {
			const update = async () => {
				const translatorsClasses = await getTranslatorsClasses();
				const latestConfig = await config.get();
				const { translatorModule: translatorName } = latestConfig;
				if (isCustomTranslatorId(translatorName)) {
					const isCurrentTranslatorAvailable =
						translatorName in translatorsClasses;
					// Reset translator to default
					if (!isCurrentTranslatorAvailable) {
						await config.set({
							...latestConfig,
							translatorModule: DEFAULT_TRANSLATOR,
						});
					}
				}
				const translateManager = await backgroundContext.getTranslateManager();
				translateManager.setTranslators(translatorsClasses);
			};
			update();
			return update;
		},
	},
);
