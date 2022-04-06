import { buildBackendRequest } from '../../utils/requestBuilder';
import { getTranslators } from './data';

// import { getTranslators } from './getTranslators';
import { loadTranslator } from './utils';

export const [applyTranslatorsFactory, applyTranslators] = buildBackendRequest(
	'applyTranslators',
	{
		factoryHandler: ({ bg }) => {
			const update = async () =>
				getTranslators({ order: 'asc' }).then((translators) => {
					const translatorsRecord: any = {};

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

					bg.updateCustomTranslatorsList(translatorsRecord);
				});

			update();

			return update;
		},
	},
);
