import { renderPage } from '../../lib/renderPage';
import { getMessage } from '../../lib/language';

import { theme } from '../../themes/presets/default/desktop';

import { DictionaryPage } from './layout/DictionaryPage';

renderPage({
	PageComponent: DictionaryPage,
	title: getMessage('dictionary_pageTitle'),
	theme,
});
