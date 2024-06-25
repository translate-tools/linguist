import React, { PropsWithChildren, useCallback, useEffect, useState } from 'react';
import Plausible from 'plausible-tracker';
import { PlausibleInitOptions } from 'plausible-tracker/build/main/lib/tracker';
import Head from '@docusaurus/Head';

import { analyticsContext, IAnalyticsContext } from './useAnalyticsContext';

export type AnalyticsProviderProps = PropsWithChildren<{
	plausible: PlausibleInitOptions;
	googleAnalytics: {
		tagId: string;
	};
}>;

export const AnalyticsProvider = ({
	plausible: plausibleOptions,
	googleAnalytics,
	children,
}: AnalyticsProviderProps) => {
	const [plausible] = useState(() => Plausible(plausibleOptions));

	const trackEvent: IAnalyticsContext['trackEvent'] = useCallback(
		(eventName, props) => {
			const timestamp = performance.now();
			plausible.trackEvent(eventName, {
				// Additional props for every event
				props: {
					// Current location
					location: location.toString(),
					// Time since visit page
					timestamp: timestamp,
					timestampSeconds: timestamp / 1000,
					...props,
				},
			});
		},
		[plausible],
	);

	// Setup default analytic listeners
	useEffect(() => {
		plausible.enableAutoPageviews();
		plausible.enableAutoOutboundTracking();

		// Track clicks
		document.body.addEventListener('click', (event: MouseEvent) => {
			// Explore click targets to find a link element
			const targets = event?.composedPath() || [event.target];
			for (const target of targets) {
				if (!(target instanceof HTMLAnchorElement)) continue;

				trackEvent('Link click', {
					url: target.href,
					text: target.innerText,
				});
				break;
			}
		});
	}, [plausible, trackEvent]);

	return (
		<analyticsContext.Provider value={{ trackEvent }}>
			<Head>
				<script
					async
					src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalytics.tagId}`}
				></script>
			</Head>
			<script
				dangerouslySetInnerHTML={{
					__html: `
						window.dataLayer = window.dataLayer || [];
						function gtag(){dataLayer.push(arguments);}
						gtag('js', new Date());

						gtag('config', '${googleAnalytics.tagId}');
					`
						.replace(/\t/g, '')
						.trim(),
				}}
			/>
			{children}
		</analyticsContext.Provider>
	);
};
