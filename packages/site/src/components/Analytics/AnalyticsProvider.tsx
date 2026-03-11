import React, { PropsWithChildren, useCallback, useEffect, useState } from 'react';
import ReactGA from 'react-ga4';
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
import { useLocation } from '@docusaurus/router';

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

	useEffect(() => {
		ReactGA.initialize(googleAnalytics.tagId);
	}, [googleAnalytics.tagId]);

	const spaLocation = useLocation();
	useEffect(() => {
		ReactGA.send({
			hitType: 'pageview',
			page: spaLocation.pathname + spaLocation.search,
		});
	}, [spaLocation]);

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

			ReactGA.event({
				action: eventName,
				category: 'User Interaction',
				...props,
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
			{children}
		</analyticsContext.Provider>
	);
};
