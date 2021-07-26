import { renderPage } from '../../lib/renderPage';
import { getMessage } from '../../lib/language';

import { theme } from '../../themes/presets/default/desktop';

import { OptionsPage } from './layout/OptionsPage';

renderPage({
	PageComponent: OptionsPage,
	title: getMessage('settings_pageTitle'),
	theme,
});
