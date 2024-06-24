import React, { FC, PropsWithChildren, useEffect } from 'react';
import Plausible from 'plausible-tracker';
import { ChakraBaseProvider } from '@chakra-ui/react';
import Head from '@docusaurus/Head';

import theme from '../theme';

export const PageLayout: FC<PropsWithChildren> = ({ children }) => {
	useEffect(() => {
		const plausible = Plausible({
			domain: 'linguister.io',
			apiHost: 'https://pulse2.vitonsky.net',
		});

		plausible.enableAutoPageviews();
		plausible.enableAutoOutboundTracking();

		// Track clicks
		document.body.addEventListener('click', (event: MouseEvent) => {
			// Explore click targets to find a link element
			const targets = event?.composedPath() || [event.target];
			for (const target of targets) {
				if (!(target instanceof HTMLAnchorElement)) continue;

				const timestamp = performance.now();
				plausible.trackEvent('Link click', {
					props: {
						// Current location
						location: location.toString(),
						url: target.href,
						text: target.innerText,
						// Time since visit page
						timestamp: timestamp,
						timestampSeconds: timestamp / 1000,
					},
				});
				break;
			}
		});
	});

	return (
		<ChakraBaseProvider theme={theme}>
			<Head>
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<script
					async
					src="https://www.googletagmanager.com/gtag/js?id=G-NGGDLX42RQ"
				></script>
				<script
					dangerouslySetInnerHTML={{
						__html: `
						window.dataLayer = window.dataLayer || [];
						function gtag(){dataLayer.push(arguments);}
						gtag('js', new Date());

						gtag('config', 'G-NGGDLX42RQ');
					`
							.replace(/\t/g, '')
							.trim(),
					}}
				/>
			</Head>
			{children}
		</ChakraBaseProvider>
	);
};
