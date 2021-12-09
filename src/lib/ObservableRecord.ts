import { isEqual } from 'lodash';
import { EventManager } from './EventManager';

type UpdateStateHandler<T> = (state: T, prevState: T) => void;

export class ObservableRecord<T extends Record<any, any>> {
	private readonly eventDispatcher = new EventManager<{
		update: UpdateStateHandler<T>;
	}>();

	public updateState = (state: T, prevState: T) => {
		this.eventDispatcher.emit('update', [state, prevState]);
	};

	private _onUpdate(handler: (state: T, prevState: T) => void): () => void;
	private _onUpdate<D extends keyof T>(
		handler: (state: T, prevState: Pick<T, D>) => void,
		deps: D[],
		deepEqual?: boolean,
	): () => void;
	private _onUpdate<D extends keyof T>(
		handler: (state: T, prevState: Pick<T, D>) => void,
		deps?: D[],
		deepEqual = false,
	) {
		const innerHandler: UpdateStateHandler<T> = (state, prevState) => {
			// Skip if dependencies is specified but not match nothing
			if (deps) {
				const hasChangedDeps = deps.some((key) => {
					const actualValue = state[key];
					const prevValue = prevState[key];

					return !deepEqual
						? actualValue !== prevValue
						: !isEqual(actualValue, prevValue);
				});

				if (!hasChangedDeps) return;
			}

			handler(state, prevState);
		};

		this.eventDispatcher.subscribe('update', innerHandler);
		return () => {
			this.eventDispatcher.unsubscribe('update', innerHandler);
		};
	}

	public onUpdate = this._onUpdate.bind(this);
}
