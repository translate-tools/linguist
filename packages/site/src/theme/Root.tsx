/* eslint-disable @cspell/spellchecker */
import React from 'react';

import { AnalyticsProvider } from '../components/Analytics/AnalyticsProvider';

export default function Root({ children }) {
	return (
		<AnalyticsProvider
			googleAnalytics={{ tagId: 'G-NGGDLX42RQ' }}
			plausible={{
				domain: 'linguister.io',
				apiHost: 'https://uxt.vitonsky.net',
			}}
		>
			{children}
		</AnalyticsProvider>
	);
}
