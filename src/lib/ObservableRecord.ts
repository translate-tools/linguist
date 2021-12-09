import { EventManager } from './EventManager';

type UpdateStateHandler<T> = (state: T, prevState: T) => void;

export class ObservableRecord<T extends Record<any, any>> {
	private readonly eventDispatcher = new EventManager<{
		update: UpdateStateHandler<T>;
	}>();

	public updateState = (state: T, prevState: T) => {
		this.eventDispatcher.emit('update', [state, prevState]);
	};

	public onUpdate = <D extends keyof T>(
		handler: (state: T, prevState: Pick<T, D>) => void,
		deps: D[],
	) => {
		const innerHandler: UpdateStateHandler<T> = (state, prevState) => {
			// Call handler when change at least one dependency
			if (deps.some((key) => key in state)) {
				handler(state, prevState);
			}
		};

		this.eventDispatcher.subscribe('update', innerHandler);
		return () => {
			this.eventDispatcher.unsubscribe('update', innerHandler);
		};
	};
}
