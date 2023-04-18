import { getMessage } from '../../lib/language';
import { renderPage } from '../../lib/renderPage';
import { theme } from '../../themes/presets/default/desktop';

import { HistoryPage } from './layout/HistoryPage';

renderPage({
	PageComponent: HistoryPage,
	title: getMessage('history_pageTitle'),
	theme,
});
