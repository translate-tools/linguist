import { EventManager } from './EventManager';

type UpdateStateHandler<T> = (state: T, prevState: T) => void;

export class ObservableRecord<T extends Record<any, any>> {
	private readonly eventDispatcher = new EventManager<{
		update: UpdateStateHandler<T>;
	}>();

	public updateState = (state: T, prevState: T) => {
		this.eventDispatcher.emit('update', [state, prevState]);
	};

	public onUpdate(handler: (state: T, prevState: T) => void): () => void;
	public onUpdate<D extends keyof T>(
		handler: (state: T, prevState: Pick<T, D>) => void,
		deps: D[],
	): () => void;
	public onUpdate<D extends keyof T>(
		handler: (state: T, prevState: Pick<T, D>) => void,
		deps?: D[],
	) {
		const innerHandler: UpdateStateHandler<T> = (state, prevState) => {
			// Skip if dependencies is specified but not match nothing
			if (deps && !deps.some((key) => key in state)) return;

			handler(state, prevState);
		};

		this.eventDispatcher.subscribe('update', innerHandler);
		return () => {
			this.eventDispatcher.unsubscribe('update', innerHandler);
		};
	}
}
