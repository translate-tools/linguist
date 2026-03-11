import React, { PropsWithChildren, useCallback, useEffect, useState } from 'react';
import {
	enableAutoOutboundTracking,
	enableAutoPageviews,
	enableEngagementTracking,
	enableLinkClicksCapture,
	enableSessionScoring,
	EngagementTimeTracker,
	Plausible,
	PlausibleInitOptions,
	skipForHosts,
	userId,
} from 'plausible-client';
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
	const [plausible] = useState(
		() =>
			new Plausible({
				...plausibleOptions,
				filter: skipForHosts(['localhost']),
				transform: userId(),
			}),
	);

	const [engagementTracker] = useState(() => new EngagementTimeTracker());
	useEffect(() => {
		engagementTracker.start();
		return () => {
			engagementTracker.stop();
		};
	});

	const trackEvent: IAnalyticsContext['trackEvent'] = useCallback(
		(eventName, props) => {
			plausible.trackEvent(eventName, {
				// Additional props for every event
				props: {
					// Current location
					location: location.toString(),
					timeOnPage: Math.round(engagementTracker.getTotalTime() / 1000),
					engagementTime: Math.round(
						engagementTracker.getCurrentSegmentTime() / 1000,
					),
					languages: navigator.languages.join(','),
					...props,
				},
			});
		},
		[engagementTracker, plausible],
	);

	// Setup default analytic listeners
	useEffect(() => {
		const cleanups = [
			enableAutoPageviews(plausible),
			enableEngagementTracking(plausible),
			enableSessionScoring(plausible),

			enableAutoOutboundTracking(plausible, { captureText: true }),
			enableLinkClicksCapture(plausible, { captureText: true }),
		];

		return () => {
			cleanups.forEach((cleanup) => cleanup?.());
		};
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
