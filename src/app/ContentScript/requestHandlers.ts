import { getPageLanguageFactory } from '../../requests/contentscript/getPageLanguage';
import { disableTranslatePageFactory } from '../../requests/contentscript/pageTranslation/disableTranslatePage';
import { enableTranslatePageFactory } from '../../requests/contentscript/pageTranslation/enableTranslatePage';
import { getPageTranslateStateFactory } from '../../requests/contentscript/pageTranslation/getPageTranslateState';
import { pingFactory } from '../../requests/contentscript/ping';
import { translateSelectedTextFactory } from '../../requests/contentscript/translateSelectedText';

export const requestHandlers = [
	pingFactory,
	getPageTranslateStateFactory,
	getPageLanguageFactory,
	enableTranslatePageFactory,
	disableTranslatePageFactory,
	translateSelectedTextFactory,
];
