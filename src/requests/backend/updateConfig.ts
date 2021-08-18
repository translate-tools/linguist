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
 * Partial update config by paths
 */
export const updateConfigFactory: RequestHandlerFactory = ({ cfg, bg }) => {
	console.warn('DBG translator', bg.translator);

	addRequestHandler('updateConfig', async (rawData) => {
		// Get actual config
		const actualConfig = await cfg.getAllConfig();
		if (actualConfig === null) {
			throw new TypeError('Config is not set');
		}

		// Clone
		const newConfigSegments = cloneDeep(actualConfig);

		// Handle
		const configMap = tryDecode(updateConfigIn, rawData);
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
	});
};
