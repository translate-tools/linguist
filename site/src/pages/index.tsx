import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

import { Landing } from '../components/Landing/Landing';

export default function Page(): JSX.Element {
	const { siteConfig } = useDocusaurusContext();
	return <Landing baseUrl={siteConfig.baseUrl} />;
}
