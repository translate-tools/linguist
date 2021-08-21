import { cloneDeep, set } from 'lodash';

import { checkTypeByPath, type } from '../../lib/types';
import { getMessage } from '../../lib/language';
import { buildBackendRequest } from '../../lib/requestBuilder';
import { AppConfig } from '../../types/runtime';

export const [updateConfigFactory, updateConfig] = buildBackendRequest('updateConfig', {
	requestValidator: type.record(type.string, type.unknown),
	responseValidator: type.type({
		success: type.boolean,
		errors: type.union([type.record(type.string, type.string), type.null]),
	}),

	/**
	 * Partial update config by paths
	 */
	factoryHandler:
		({ cfg }) =>
			async (configMap) => {
			// Get actual config
				const actualConfig = await cfg.getAllConfig();
				if (actualConfig === null) {
					throw new TypeError('Config is not set');
				}

				// Clone
				const newConfigSegments = cloneDeep(actualConfig);

				// Handle
				const errors: Record<string, string> = {};
				for (const path in configMap) {
					const pathArray = path.split('.');
					if (pathArray.length === 0) {
						throw new TypeError(`Invalid path "${path}"`);
					}

					const value = configMap[path];

					// Validate type of new value
					if (checkTypeByPath(AppConfig, pathArray, value)) {
						set(newConfigSegments, path, value);
					} else {
						errors[path] = getMessage('settings_message_common_invalidValueType');
					}
				}

				if (Object.keys(errors).length > 0) {
					return {
						success: false,
						errors,
					};
				} else {
					console.warn('Update config', actualConfig, newConfigSegments);

					await cfg.set(newConfigSegments);
					return {
						success: true,
						errors: null,
					};
				}
			},
});
