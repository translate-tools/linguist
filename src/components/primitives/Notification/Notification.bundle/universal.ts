import { compose, composeU, ExtractProps } from 'react-elegant-ui/lib/compose';

import { withModNotificationTypeDefault } from '../_type/Notification_type_default';
import { Notification as BaseNotification } from '../Notification';

export const Notification = compose(composeU(withModNotificationTypeDefault))(
	BaseNotification,
);

Notification.defaultProps = {
	type: 'default',
};

export type INotificationProps = ExtractProps<typeof Notification>;
