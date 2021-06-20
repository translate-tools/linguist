import { addRequestHandler, bgSendRequest } from '../../lib/communication';
import { checkTypeByPath, tryDecode, type } from '../../lib/types';
import { TypeOf } from 'io-ts';
import { cloneDeep, set } from 'lodash';
import { getMessage } from '../../lib/language';
import { AppConfig } from '../../types/runtime';
import { RequestHandlerFactory } from '../types';

export const updateConfigIn = type.record(type.string, type.unknown);

export const updateConfigOut = type.type({
	success: type.boolean,
	errors: type.union([type.record(type.string, type.string), type.null]),
});

export const updateConfig = (configMap: TypeOf<typeof updateConfigIn>) =>
	bgSendRequest('updateConfig', configMap).then((rawData) =>
		tryDecode(updateConfigOut, rawData),
	);

/**
 * Partical update config by paths
 */
export const updateConfigFactory: RequestHandlerFactory = ({ cfg, bg }) => {
	console.warn('DBG translator', bg.translator);

	addRequestHandler('updateConfig', async (rawData) => {
		const configMap = tryDecode(updateConfigIn, rawData);
		const clonedConfig = cloneDeep(cfg.getAllConfig());

		if (clonedConfig === null) {
			throw new TypeError('Config is not set');
		}

		const errors: Record<string, string> = {};
		for (const path in configMap) {
			const pathArray = path.split('.');
			if (pathArray.length === 0) {
				throw new TypeError(`Invalid path "${path}"`);
			}

			const value = configMap[path];

			// Validate type of new value
			if (checkTypeByPath(AppConfig, pathArray, value)) {
				set(clonedConfig, path, value);
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
			console.warn('Update config', cfg.getAllConfig(), clonedConfig);

			cfg.set(clonedConfig);
			return {
				success: true,
				errors: null,
			};
		}
	});
};
