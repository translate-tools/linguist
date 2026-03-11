import React, { FC, PropsWithChildren } from 'react';
import { I18nextProvider } from 'react-i18next';
import { i18n } from 'i18next';
import { ChakraBaseProvider } from '@chakra-ui/react';
import Head from '@docusaurus/Head';

import theme from '../theme';

export const PageLayout: FC<
	PropsWithChildren<{
		i18n: i18n;
	}>
> = ({ i18n, children }) => {
	return (
		<I18nextProvider i18n={i18n}>
			<ChakraBaseProvider theme={theme}>
				<Head>
					<meta
						name="viewport"
						content="width=device-width, initial-scale=1.0"
					/>
				</Head>

				{children}
			</ChakraBaseProvider>
		</I18nextProvider>
	);
};
