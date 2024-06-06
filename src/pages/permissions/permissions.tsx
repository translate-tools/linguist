import { renderPage } from '../../lib/renderPage';
import { theme } from '../../themes/presets/default/desktop';

import { PermissionsPage } from './layout/PermissionsPage';

renderPage({
	PageComponent: PermissionsPage,
	title: 'Permissions',
	theme,
});
