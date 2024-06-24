import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

import { Landing } from '../components/Landing/Landing';
import { PageLayout } from '../components/PageLayout/PageLayout';

export default function Page(): JSX.Element {
	const { siteConfig } = useDocusaurusContext();
	return (
		<PageLayout>
			<Landing baseUrl={siteConfig.baseUrl} />
		</PageLayout>
	);
}
