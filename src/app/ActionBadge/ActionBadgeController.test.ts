import { ActionBadgeController } from './ActionBadgeController';
import type { PageTranslatorStats } from '../ContentScript/PageTranslator/PageTranslator.tsx';
import type { PageTranslatorState } from '../ContentScript/PageTranslator/PageTranslatorController';

// jest-webextension-mock sets up chrome.browserAction; webextension.js shims chrome.action to it.
// @types/chrome is not installed so we access the mock via globalThis.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const chromeAction = (globalThis as any).chrome.action as {
	setBadgeText: ReturnType<typeof vi.fn>;
	setBadgeBackgroundColor: ReturnType<typeof vi.fn>;
};

const TAB_ID = 1;

beforeEach(() => {
	vi.clearAllMocks();
});

function makeSubscriber<T>() {
	let latestCb: ((data: T, tabId?: number) => void) | null = null;
	const unsubscribe = vi.fn();
	const subscribe = vi.fn((cb: (data: T, tabId?: number) => void) => {
		latestCb = cb;
		return unsubscribe;
	});
	return {
		subscribe,
		unsubscribe,
		emit: (data: T, tabId?: number) => {
			if (!latestCb) throw new Error('subscribe not yet called');
			latestCb(data, tabId);
		},
	};
}

const STOPPED_STATE: PageTranslatorState = {
	isTranslated: false,
	counters: { pending: 0, resolved: 0, rejected: 0 },
	translateDirection: null,
};

test('shows translating badge while segments are pending', () => {
	const state = makeSubscriber<PageTranslatorState>();
	const stats = makeSubscriber<PageTranslatorStats>();
	const controller = new ActionBadgeController(state.subscribe, stats.subscribe);
	onTestFinished(() => controller.disable());
	controller.enable();

	stats.emit({ pending: 5, resolved: 0, rejected: 0 }, TAB_ID);

	expect(chromeAction.setBadgeText).toHaveBeenLastCalledWith({
		text: '...',
		tabId: TAB_ID,
	});
	expect(chromeAction.setBadgeBackgroundColor).toHaveBeenLastCalledWith({
		color: '#f0a500',
		tabId: TAB_ID,
	});
});

test('shows done badge when all segments resolved', () => {
	const state = makeSubscriber<PageTranslatorState>();
	const stats = makeSubscriber<PageTranslatorStats>();
	const controller = new ActionBadgeController(state.subscribe, stats.subscribe);
	onTestFinished(() => controller.disable());
	controller.enable();

	stats.emit({ pending: 0, resolved: 10, rejected: 0 }, TAB_ID);

	expect(chromeAction.setBadgeText).toHaveBeenLastCalledWith({
		text: '✓',
		tabId: TAB_ID,
	});
	expect(chromeAction.setBadgeBackgroundColor).toHaveBeenLastCalledWith({
		color: '#3a8f3a',
		tabId: TAB_ID,
	});
});

test('shows partial badge when some segments failed', () => {
	const state = makeSubscriber<PageTranslatorState>();
	const stats = makeSubscriber<PageTranslatorStats>();
	const controller = new ActionBadgeController(state.subscribe, stats.subscribe);
	onTestFinished(() => controller.disable());
	controller.enable();

	stats.emit({ pending: 0, resolved: 7, rejected: 3 }, TAB_ID);

	expect(chromeAction.setBadgeText).toHaveBeenLastCalledWith({
		text: '~',
		tabId: TAB_ID,
	});
	expect(chromeAction.setBadgeBackgroundColor).toHaveBeenLastCalledWith({
		color: '#e06000',
		tabId: TAB_ID,
	});
});

test('shows error badge when all segments failed', () => {
	const state = makeSubscriber<PageTranslatorState>();
	const stats = makeSubscriber<PageTranslatorStats>();
	const controller = new ActionBadgeController(state.subscribe, stats.subscribe);
	onTestFinished(() => controller.disable());
	controller.enable();

	stats.emit({ pending: 0, resolved: 0, rejected: 5 }, TAB_ID);

	expect(chromeAction.setBadgeText).toHaveBeenLastCalledWith({
		text: '!',
		tabId: TAB_ID,
	});
	expect(chromeAction.setBadgeBackgroundColor).toHaveBeenLastCalledWith({
		color: '#cc0000',
		tabId: TAB_ID,
	});
});

test('clears badge when translation is stopped', () => {
	const state = makeSubscriber<PageTranslatorState>();
	const stats = makeSubscriber<PageTranslatorStats>();
	const controller = new ActionBadgeController(state.subscribe, stats.subscribe);
	onTestFinished(() => controller.disable());
	controller.enable();

	state.emit(STOPPED_STATE, TAB_ID);

	expect(chromeAction.setBadgeText).toHaveBeenLastCalledWith({
		text: '',
		tabId: TAB_ID,
	});
});

test('ignores zero-counter flush from PageTranslator.stop()', () => {
	const state = makeSubscriber<PageTranslatorState>();
	const stats = makeSubscriber<PageTranslatorStats>();
	const controller = new ActionBadgeController(state.subscribe, stats.subscribe);
	onTestFinished(() => controller.disable());
	controller.enable();

	stats.emit({ pending: 0, resolved: 0, rejected: 0 }, TAB_ID);

	expect(chromeAction.setBadgeText).not.toHaveBeenCalled();
});

test('clears badge on tab navigation', () => {
	const state = makeSubscriber<PageTranslatorState>();
	const stats = makeSubscriber<PageTranslatorStats>();
	const controller = new ActionBadgeController(state.subscribe, stats.subscribe);
	onTestFinished(() => controller.disable());
	controller.enable();

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const onTabUpdated = vi.mocked((globalThis as any).chrome.tabs.onUpdated.addListener)
		.mock.calls[0]?.[0] as (...args: unknown[]) => void;
	onTabUpdated(TAB_ID, { url: 'https://example.com' }, {});

	expect(chromeAction.setBadgeText).toHaveBeenLastCalledWith({
		text: '',
		tabId: TAB_ID,
	});
});

test('disable() calls unsubscribe and stops responding to events', () => {
	const state = makeSubscriber<PageTranslatorState>();
	const stats = makeSubscriber<PageTranslatorStats>();
	const controller = new ActionBadgeController(state.subscribe, stats.subscribe);

	controller.enable();
	expect(state.subscribe).toHaveBeenCalledTimes(1);
	expect(stats.subscribe).toHaveBeenCalledTimes(1);
	expect(state.unsubscribe).not.toHaveBeenCalled();
	expect(stats.unsubscribe).not.toHaveBeenCalled();

	controller.disable();
	expect(state.unsubscribe).toHaveBeenCalledTimes(1);
	expect(stats.unsubscribe).toHaveBeenCalledTimes(1);

	// Callback fires after disable — badge must not update
	stats.emit({ pending: 3, resolved: 0, rejected: 0 }, TAB_ID);
	expect(chromeAction.setBadgeText).not.toHaveBeenCalled();
});

test('disable() clears badge and toggle cycle produces correct state', () => {
	const state = makeSubscriber<PageTranslatorState>();
	const stats = makeSubscriber<PageTranslatorStats>();
	const controller = new ActionBadgeController(state.subscribe, stats.subscribe);

	// Cycle 1: translating → disable clears
	controller.enable();
	stats.emit({ pending: 3, resolved: 0, rejected: 0 }, TAB_ID);
	expect(chromeAction.setBadgeText).toHaveBeenLastCalledWith({
		text: '...',
		tabId: TAB_ID,
	});
	expect(chromeAction.setBadgeBackgroundColor).toHaveBeenLastCalledWith({
		color: '#f0a500',
		tabId: TAB_ID,
	});

	controller.disable();
	expect(chromeAction.setBadgeText).toHaveBeenLastCalledWith({
		text: '',
		tabId: TAB_ID,
	});

	// Cycle 2: partial → disable clears
	controller.enable();
	stats.emit({ pending: 0, resolved: 5, rejected: 2 }, TAB_ID);
	expect(chromeAction.setBadgeText).toHaveBeenLastCalledWith({
		text: '~',
		tabId: TAB_ID,
	});
	expect(chromeAction.setBadgeBackgroundColor).toHaveBeenLastCalledWith({
		color: '#e06000',
		tabId: TAB_ID,
	});

	controller.disable();
	expect(chromeAction.setBadgeText).toHaveBeenLastCalledWith({
		text: '',
		tabId: TAB_ID,
	});

	// Cycle 3: all-error → disable clears
	controller.enable();
	stats.emit({ pending: 0, resolved: 0, rejected: 10 }, TAB_ID);
	expect(chromeAction.setBadgeText).toHaveBeenLastCalledWith({
		text: '!',
		tabId: TAB_ID,
	});
	expect(chromeAction.setBadgeBackgroundColor).toHaveBeenLastCalledWith({
		color: '#cc0000',
		tabId: TAB_ID,
	});

	controller.disable();
	expect(chromeAction.setBadgeText).toHaveBeenLastCalledWith({
		text: '',
		tabId: TAB_ID,
	});
});
