import React from 'react';
import { useTranslation } from 'react-i18next';
import Head from '@docusaurus/Head';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {
	PageAltVersionsContext,
	useAltPageVersions,
} from '@site/src/components/useAltPageVersions';
import { createI18nInstance, i18nContext } from '@site/src/i18n';

import { Landing } from '../../components/Landing/Landing';
import { PageLayout } from '../../components/PageLayout/PageLayout';
import { buildPathGetter } from '../../utils/url';

const MetaTags = () => {
	const altVersions = useAltPageVersions();

	const { siteConfig } = useDocusaurusContext();
	const getUrl = buildPathGetter(siteConfig.baseUrl);
	const { t, i18n } = useTranslation('landing');

	const title = t('meta.title', { defaultValue: '' });
	const description = t('meta.description', { defaultValue: '' });

	return (
		<Head>
			<html lang={i18n.language} />
			{title && <title>{title}</title>}
			{description && <meta name="description" content={description} />}
			<link
				rel="sitemap"
				type="application/xml"
				title="Sitemap"
				href="/sitemap.xml"
			></link>
			<meta
				property="og:image"
				content={getUrl('screenshots/page-translation.png')}
			/>
			{altVersions.map((version) => (
				<link
					key={version.langCode}
					rel="alternate"
					hrefLang={version.langCode}
					href={version.url}
				></link>
			))}
		</Head>
	);
};

export default function Page({ i18n }: { i18n: i18nContext }): JSX.Element {
	const { siteConfig } = useDocusaurusContext();

	return (
		<PageLayout i18n={createI18nInstance(i18n.lang, i18n.resources)}>
			<PageAltVersionsContext.Provider value={i18n.altVersions}>
				<MetaTags />
				<Landing baseUrl={siteConfig.baseUrl} />
			</PageAltVersionsContext.Provider>
		</PageLayout>
	);
}
