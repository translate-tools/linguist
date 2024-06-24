import React, { PropsWithChildren, useCallback, useEffect, useState } from 'react';
import Plausible from 'plausible-tracker';
import { PlausibleInitOptions } from 'plausible-tracker/build/main/lib/tracker';

import { analyticsContext, IAnalyticsContext } from './useAnalyticsContext';

export const AnalyticsProvider = ({
	options,
	children,
}: PropsWithChildren<{ options: PlausibleInitOptions }>) => {
	const [plausible] = useState(() => Plausible(options));

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
			{children}
		</analyticsContext.Provider>
	);
};
