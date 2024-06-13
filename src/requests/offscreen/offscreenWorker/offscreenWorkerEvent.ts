import { serialize, unserialize } from '../../../lib/serializer';
import { buildBackendRequest } from '../../utils/requestBuilder';

export type OffscreenWorkerContext = {
	workerId: string | null;
	onMessage: (name: string, data: any) => void;
};
type OffscreenWorkerEvent = {
	workerId: string;
	name: string;
	data: any;
};

export const [offscreenWorkerEventFactory, offscreenWorkerEvent] = buildBackendRequest<
	OffscreenWorkerEvent,
	void,
	OffscreenWorkerContext
>('offscreenWorker.event', {
	// Skip messages addressed to another instances
	filter:
		(context) =>
			({ workerId }) =>
				context.workerId !== null && context.workerId === workerId,
	factoryHandler:
		(context) =>
			async ({ name, data }) => {
				context.onMessage(name, unserialize(data));
			},
});

export const sendEventToOffscreenWorker = (options: OffscreenWorkerEvent) =>
	offscreenWorkerEvent({ ...options, data: serialize(options.data) });
