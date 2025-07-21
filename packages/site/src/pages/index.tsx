import React from 'react';
import Head from '@docusaurus/Head';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

import { Landing } from '../components/Landing/Landing';
import { PageLayout } from '../components/PageLayout/PageLayout';
import { buildPathGetter } from '../utils/url';

export default function Page(): JSX.Element {
	const { siteConfig } = useDocusaurusContext();
	const getUrl = buildPathGetter(siteConfig.baseUrl);
	return (
		<PageLayout>
			<Head>
				<meta
					property="og:image"
					content={getUrl('screenshots/page-translation.png')}
				/>
			</Head>
			<Landing baseUrl={siteConfig.baseUrl} />
		</PageLayout>
	);
}
