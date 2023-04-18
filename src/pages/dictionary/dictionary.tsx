import { getMessage } from '../../lib/language';
import { renderPage } from '../../lib/renderPage';
import { theme } from '../../themes/presets/default/desktop';

import { DictionaryPage } from './layout/DictionaryPage';

renderPage({
	PageComponent: DictionaryPage,
	title: getMessage('dictionary_pageTitle'),
	theme,
});
