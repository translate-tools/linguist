import React from 'react';
import Head from '@docusaurus/Head';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { PageAltVersionsContext } from '@site/src/components/useAltPageVersions';
import { createI18nInstance, i18nContext } from '@site/src/i18n';

import { Landing } from '../../components/Landing/Landing';
import { PageLayout } from '../../components/PageLayout/PageLayout';
import { buildPathGetter } from '../../utils/url';

export default function Page({ i18n }: { i18n: i18nContext }): JSX.Element {
	const { siteConfig } = useDocusaurusContext();
	const getUrl = buildPathGetter(siteConfig.baseUrl);

	return (
		<PageLayout i18n={createI18nInstance(i18n.lang, i18n.resources)}>
			<Head>
				<meta
					property="og:image"
					content={getUrl('screenshots/page-translation.png')}
				/>
			</Head>
			<PageAltVersionsContext.Provider value={i18n.altVersions}>
				<Landing baseUrl={siteConfig.baseUrl} />
			</PageAltVersionsContext.Provider>
		</PageLayout>
	);
}
