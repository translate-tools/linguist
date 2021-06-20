import React, { FC } from 'react';

import { PublicMessage } from '../../../lib/hooks/useMessageBroker';

import { cnPage } from '../Page';

import './PageMessages.css';

export interface IPageMessagesProps {
	messages: PublicMessage[];
	haltMessages: (state: boolean) => void;
	deleteMessage: (id: symbol) => void;
}

export const PageMessages: FC<IPageMessagesProps> = ({
	messages,
	haltMessages,
	deleteMessage,
}) => {
	return (
		<div>
			{messages.length === 0 ? undefined : (
				<div
					className={cnPage('MessagesContainer')}
					onMouseOver={() => haltMessages(true)}
					onMouseLeave={() => haltMessages(false)}
				>
					{messages.map(({ text, type, id }, index) => {
						return (
							<div
								key={index}
								className={cnPage('Message', { type })}
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
