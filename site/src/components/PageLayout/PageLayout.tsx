import React, { FC, PropsWithChildren } from 'react';
import { ChakraBaseProvider } from '@chakra-ui/react';
import Head from '@docusaurus/Head';

import theme from '../theme';

export const PageLayout: FC<PropsWithChildren> = ({ children }) => {
	return (
		<ChakraBaseProvider theme={theme}>
			<Head>
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<script
					defer
					data-domain="linguister.io"
					src="https://pulse2.vitonsky.net/js/script.outbound-links.js"
				></script>
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
