import { withClassnameHOC } from 'react-elegant-ui/esm/lib/compose';

import { cnNotification, INotificationProps } from '../Notification';

import './Notification_type_default.css';

export interface NotificationTypeDefault {
	type?: 'default';
}

export const withModNotificationTypeDefault = withClassnameHOC<
	NotificationTypeDefault,
	INotificationProps
>(cnNotification(), { type: 'default' });
