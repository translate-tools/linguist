import React, { FC } from 'react';
import { cn } from '@bem-react/classname';

import { PublicMessage } from './useToastMessages';

import './ToastMessages.css';

const cnToastMessages = cn('ToastMessages');

export interface ToastMessagesProps {
	messages: PublicMessage[];
	haltMessages: (state: boolean) => void;
	deleteMessage: (id: symbol) => void;
}

export const ToastMessages: FC<ToastMessagesProps> = ({
	messages,
	haltMessages,
	deleteMessage,
}) => {
	return (
		<div>
			{messages.length === 0 ? undefined : (
				<div
					className={cnToastMessages()}
					onMouseOver={() => haltMessages(true)}
					onMouseLeave={() => haltMessages(false)}
				>
					{messages.map(({ text, type, id }, index) => {
						return (
							<div
								key={index}
								className={cnToastMessages('Message', { type })}
								onClick={() => deleteMessage(id)}
							>
								{text}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};
