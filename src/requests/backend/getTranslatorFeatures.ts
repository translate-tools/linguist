import { addRequestHandler, bgSendRequest } from '../../lib/communication';
import { tryDecode, type } from '../../lib/types';
import { ArrayOfStrings } from '../../types/runtime';
import { RequestHandlerFactory } from '../types';

export const getTranslatorFeaturesOut = type.type({
	supportedLanguages: ArrayOfStrings,
	isSupportAutodetect: type.boolean,
});

export const getTranslatorFeatures = () =>
	bgSendRequest('getTranslatorFeatures').then((translatorFeatures) =>
		tryDecode(getTranslatorFeaturesOut, translatorFeatures),
	);

export const getTranslatorFeaturesFactory: RequestHandlerFactory = ({ bg }) => {
	addRequestHandler('getTranslatorFeatures', async () => {
		const translator = bg.translator;
		if (translator === undefined) {
			throw new Error('Translator is not ready');
		}

		return {
			supportedLanguages: translator.supportedLanguages(),
			isSupportAutodetect: translator.isSupportAutodetect(),
		};
	});
};
