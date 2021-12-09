import { isEqual } from 'lodash';
import { EventManager } from './EventManager';

type Handler<T> = (props: T, prevProps: T) => void;
type EffectCleanup = () => void;
type EffectOptions = {
	deepEqual?: boolean;
};
type Effect = (
	handler: () => void | EffectCleanup,
	deps: any[],
	options?: EffectOptions,
) => void;
type EffectData = { deps: any[]; cleanup: null | EffectCleanup };

export class StateManager<T> {
	private evt = new EventManager<{
		updateState: Handler<T>;
	}>();

	private state: null | {
		current: T;
	} = null;

	private currentHandler: null | Handler<T> = null;
	private effectsData = new Map<Handler<T>, EffectData>();

	public onUpdate = (handler: Handler<T>) => {
		this.evt.subscribe('updateState', handler);
	};

	private forceExecuteLastUpdate = false;
	private updateQueue: T[] = [];

	public update = (state: T, force = false) => {
		this.updateQueue.push(state);

		this.forceExecuteLastUpdate = this.forceExecuteLastUpdate || force;
		this.queueExecutor();
	};

	private isExecutorRun = false;
	private queueExecutor = async () => {
		if (this.isExecutorRun) return;

		this.isExecutorRun = true;

		// Execute updates
		while (this.updateQueue.length > 0) {
			const state = this.updateQueue.shift() as T;

			const prevState = this.state === null ? state : this.state.current;

			// Set state
			this.state = { current: state };

			const handlers = Array.from(this.evt.getEventHandlers('updateState'));
			for (const handler of handlers) {
				this.currentHandler = handler;

				handler(state, prevState);

				this.currentHandler = null;

				// Skip all states except last
				if (this.forceExecuteLastUpdate) {
					this.forceExecuteLastUpdate = true;
					this.updateQueue = this.updateQueue.slice(-1);
					break;
				}
			}
		}

		this.isExecutorRun = false;
	};

	// TODO: implement support many effects
	public deps: Effect = (handler, deps, options) => {
		const currentHandler = this.currentHandler;
		if (!currentHandler) return;

		const { deepEqual = false } = options || {};

		const effectData = this.effectsData.get(currentHandler);
		const newEffectData: Partial<EffectData> = {
			deps,
		};

		// Call handler when deps have been changed
		if (
			effectData === undefined ||
			effectData.deps.length !== deps.length ||
			deps.some((value, idx) => {
				const currentValue = value;
				const prevValue = effectData.deps[idx];

				return deepEqual
					? !isEqual(currentValue, prevValue)
					: currentValue !== prevValue;
			})
		) {
			// Cleanup
			if (effectData !== undefined && effectData.cleanup !== null) {
				effectData.cleanup();
			}

			// Run effect
			const cleanup = handler();

			// Remember effect cleanup
			newEffectData.cleanup = cleanup ?? null;
		}

		// Update deps
		this.effectsData.set(currentHandler, {
			...effectData,
			...newEffectData,
		} as EffectData);
	};
}
