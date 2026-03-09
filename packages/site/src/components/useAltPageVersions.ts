import { createContext, useContext } from 'react';

import { i18nContext } from '../i18n';

export const PageAltVersionsContext = createContext<i18nContext['altVersions']>([]);

export const useAltPageVersions = () => {
	return useContext(PageAltVersionsContext);
};
