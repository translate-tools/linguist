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
type EffectData = { index: number; deps: any[]; cleanup: null | EffectCleanup };

type ContextData = {
	currentEffect: null | number;
	effects: EffectData[];
};

// TODO: support async effects
// TODO: move to NPM package

/**
 * Util to flexible handle state changes
 */
export class StateManager<T> {
	private evt = new EventManager<{
		updateState: Handler<T>;
	}>();

	private state: null | {
		current: T;
	} = null;

	private currentHandler: null | Handler<T> = null;
	private contextData = new Map<Handler<T>, ContextData>();

	private updateQueue: T[] = [];
	private forceExecuteLastUpdate = false;

	/**
	 * Temporary pool with unsubscribed handlers
	 */
	private unsubscribed: Handler<T>[] = [];

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

				// Create context
				if (!this.contextData.has(handler)) {
					this.contextData.set(handler, { currentEffect: null, effects: [] });
				}

				// Init context
				const context = this.contextData.get(handler) as ContextData;
				context.currentEffect = 0;

				// Run handler
				handler(state, prevState);

				// Check that all effects did called
				if (
					context.effects.length > 0 &&
					context.effects.length !== context.currentEffect
				) {
					throw new Error(
						"Not all effects did called. Please, don't call effects conditionally",
					);
				}

				// Clear context
				context.currentEffect = null;

				this.currentHandler = null;

				// Skip all states except last
				if (this.forceExecuteLastUpdate) {
					this.forceExecuteLastUpdate = true;
					this.updateQueue = this.updateQueue.slice(-1);
					break;
				}
			}

			// Clean contexts for unsubscribed handlers
			this.unsubscribed.forEach((handler) => {
				this.contextData.delete(handler);
			});

			this.unsubscribed = [];
		}

		this.isExecutorRun = false;
	};

	/**
	 * Update state
	 */
	public update = (state: T, force = false) => {
		this.updateQueue.push(state);

		this.forceExecuteLastUpdate = this.forceExecuteLastUpdate || force;
		this.queueExecutor();
	};

	/**
	 * Set handler of state updates
	 */
	public onUpdate = (handler: Handler<T>) => {
		this.evt.subscribe('updateState', handler);

		const cleanup = () => {
			this.evt.unsubscribe('updateState', handler);
			this.unsubscribed.push(handler);
		};
		return cleanup;
	};

	/**
	 * Set handler which will call only by change deps
	 *
	 * This handler must never be called conditionally
	 */
	public useEffect: Effect = (handler, deps, options) => {
		const context = this.currentHandler;
		if (!context) {
			throw new Error('Execute deps outside state change context');
		}

		const { deepEqual = false } = options || {};

		const contextData = this.contextData.get(context);
		if (contextData === undefined) {
			throw new Error('Empty context data');
		}
		if (contextData.currentEffect === null) {
			throw new Error('Invalid context effect index');
		}

		// Write current value and increase for next use
		const effectIndex = contextData.currentEffect++;

		let effectData = contextData.effects[effectIndex];

		// Create new effect
		if (effectData === undefined) {
			// Prevent creating effect with invalid id
			const lastId = contextData.effects.length;
			if (lastId !== effectIndex) {
				throw new Error(
					`Error while creating new effect. New id "${effectIndex}", but last id is ${lastId}`,
				);
			}

			const newEffect: EffectData = {
				index: effectIndex,
				cleanup: null,
				deps: [],
			};

			contextData.effects.push(newEffect);

			// Update local state
			effectData = newEffect;
		}

		// Prevent call a effect by invalid order
		if (effectIndex !== effectData.index) {
			throw new Error(
				`Invalid effect order. Effect #${effectData.index} called as #${effectIndex}`,
			);
		}

		// Call handler when deps have been changed
		if (
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
			if (effectData.cleanup !== null) {
				effectData.cleanup();
				effectData.cleanup = null;
			}

			// Run effect
			const cleanup = handler();

			// Set cleanup
			if (typeof cleanup === 'function') {
				effectData.cleanup = cleanup;
			}
		}

		// Update effect data
		effectData.deps = deps;
	};
}
