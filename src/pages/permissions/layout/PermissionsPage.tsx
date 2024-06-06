import React, { FC } from 'react';
import browser from 'webextension-polyfill';

import { LayoutFlow } from '../../../components/layouts/LayoutFlow/LayoutFlow';
import { Page } from '../../../components/layouts/Page/Page';
import { Button } from '../../../components/primitives/Button/Button.bundle/universal';

interface PermissionsPageProps {}

export const PermissionsPage: FC<PermissionsPageProps> = ({}) => {
	return (
		<Page>
			<LayoutFlow direction={'vertical'} indent="l">
				<Button
					view="action"
					onPress={() => {
						browser.permissions.request({ origins: ['<all_urls>'] });
					}}
				>
					Request permissions
				</Button>
			</LayoutFlow>
		</Page>
	);
};
