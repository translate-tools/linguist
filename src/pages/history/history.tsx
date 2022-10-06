import { renderPage } from '../../lib/renderPage';
import { getMessage } from '../../lib/language';

import { theme } from '../../themes/presets/default/desktop';

import { HistoryPage } from './layout/HistoryPage';

renderPage({
	PageComponent: HistoryPage,
	title: getMessage('history_pageTitle'),
	theme,
});
