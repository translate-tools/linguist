import React, { FC, ReactNode } from 'react';
import { cn } from '@bem-react/classname';

import './Notification.css';

export const cnNotification = cn('Notification');

export type INotificationProps = {
	children: ReactNode;
	className?: string;
};

export const Notification: FC<INotificationProps> = ({ children, className }) => {
	return <div className={cnNotification({}, [className])}>{children}</div>;
};
