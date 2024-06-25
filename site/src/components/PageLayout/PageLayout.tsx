import '../i18n';

import React, { FC, PropsWithChildren } from 'react';
import { ChakraBaseProvider } from '@chakra-ui/react';
import Head from '@docusaurus/Head';

import theme from '../theme';

export const PageLayout: FC<PropsWithChildren> = ({ children }) => {
	return (
		<ChakraBaseProvider theme={theme}>
			<Head>
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			</Head>

			{children}
		</ChakraBaseProvider>
	);
};
