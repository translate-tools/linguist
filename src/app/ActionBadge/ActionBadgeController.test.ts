import { ActionBadgeController } from './ActionBadgeController';
import type { PageTranslatorStats } from '../ContentScript/PageTranslator/PageTranslator';
import type { PageTranslatorState } from '../ContentScript/PageTranslator/PageTranslatorController';

vi.mock('../ContentScript/PageTranslator/requests/pageTranslatorStateUpdated', () => ({
	pageTranslatorStateUpdatedHandler: vi.fn(() => vi.fn()),
}));
vi.mock('../ContentScript/PageTranslator/requests/pageTranslatorStatsUpdated', () => ({
	pageTranslatorStatsUpdatedHandler: vi.fn(() => vi.fn()),
}));

import { pageTranslatorStateUpdatedHandler } from '../ContentScript/PageTranslator/requests/pageTranslatorStateUpdated';
import { pageTranslatorStatsUpdatedHandler } from '../ContentScript/PageTranslator/requests/pageTranslatorStatsUpdated';

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

function captureStatsCallback() {
	let captured!: (stats: PageTranslatorStats, tabId?: number) => void;
	vi.mocked(pageTranslatorStatsUpdatedHandler).mockImplementationOnce((cb) => {
		captured = cb;
		return vi.fn();
	});
	return () => captured;
}

function captureStateCallback() {
	let captured!: (state: PageTranslatorState, tabId?: number) => void;
	vi.mocked(pageTranslatorStateUpdatedHandler).mockImplementationOnce((cb) => {
		captured = cb;
		return vi.fn();
	});
	return () => captured;
}

test('shows translating badge while segments are pending', () => {
	const getStats = captureStatsCallback();
	const controller = new ActionBadgeController();
	onTestFinished(() => controller.disable());
	controller.enable();

	getStats()({ pending: 5, resolved: 0, rejected: 0 }, TAB_ID);

	expect(chromeAction.setBadgeText).toHaveBeenCalledWith({
		text: '...',
		tabId: TAB_ID,
	});
	expect(chromeAction.setBadgeBackgroundColor).toHaveBeenCalledWith({
		color: '#f0a500',
		tabId: TAB_ID,
	});
});

test('shows done badge when all segments resolved', () => {
	const getStats = captureStatsCallback();
	const controller = new ActionBadgeController();
	onTestFinished(() => controller.disable());
	controller.enable();

	getStats()({ pending: 0, resolved: 10, rejected: 0 }, TAB_ID);

	expect(chromeAction.setBadgeText).toHaveBeenCalledWith({ text: '✓', tabId: TAB_ID });
	expect(chromeAction.setBadgeBackgroundColor).toHaveBeenCalledWith({
		color: '#3a8f3a',
		tabId: TAB_ID,
	});
});

test('shows partial badge when some segments failed', () => {
	const getStats = captureStatsCallback();
	const controller = new ActionBadgeController();
	onTestFinished(() => controller.disable());
	controller.enable();

	getStats()({ pending: 0, resolved: 7, rejected: 3 }, TAB_ID);

	expect(chromeAction.setBadgeText).toHaveBeenCalledWith({ text: '~', tabId: TAB_ID });
	expect(chromeAction.setBadgeBackgroundColor).toHaveBeenCalledWith({
		color: '#e06000',
		tabId: TAB_ID,
	});
});

test('shows error badge when all segments failed', () => {
	const getStats = captureStatsCallback();
	const controller = new ActionBadgeController();
	onTestFinished(() => controller.disable());
	controller.enable();

	getStats()({ pending: 0, resolved: 0, rejected: 5 }, TAB_ID);

	expect(chromeAction.setBadgeText).toHaveBeenCalledWith({ text: '!', tabId: TAB_ID });
	expect(chromeAction.setBadgeBackgroundColor).toHaveBeenCalledWith({
		color: '#cc0000',
		tabId: TAB_ID,
	});
});

test('clears badge when translation is stopped', () => {
	const getState = captureStateCallback();
	const controller = new ActionBadgeController();
	onTestFinished(() => controller.disable());
	controller.enable();

	getState()(
		{
			isTranslated: false,
			counters: { pending: 0, resolved: 0, rejected: 0 },
			translateDirection: null,
		},
		TAB_ID,
	);

	expect(chromeAction.setBadgeText).toHaveBeenCalledWith({ text: '', tabId: TAB_ID });
});

test('ignores zero-counter flush from PageTranslator.stop()', () => {
	const getStats = captureStatsCallback();
	const controller = new ActionBadgeController();
	onTestFinished(() => controller.disable());
	controller.enable();

	getStats()({ pending: 0, resolved: 0, rejected: 0 }, TAB_ID);

	expect(chromeAction.setBadgeText).not.toHaveBeenCalled();
});

test('clears badge on tab navigation', () => {
	const controller = new ActionBadgeController();
	onTestFinished(() => controller.disable());
	controller.enable();

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const onTabUpdated = vi.mocked((globalThis as any).chrome.tabs.onUpdated.addListener)
		.mock.calls[0]?.[0] as (...args: unknown[]) => void;
	onTabUpdated(TAB_ID, { url: 'https://example.com' }, {});

	expect(chromeAction.setBadgeText).toHaveBeenCalledWith({ text: '', tabId: TAB_ID });
});

test('disable() stops responding to events', () => {
	const getStats = captureStatsCallback();
	const controller = new ActionBadgeController();
	controller.enable();
	controller.disable();

	vi.clearAllMocks();
	getStats()({ pending: 3, resolved: 0, rejected: 0 }, TAB_ID);

	expect(chromeAction.setBadgeText).not.toHaveBeenCalled();
});

test('disable() clears the badge and toggle cycle produces correct state', () => {
	const controller = new ActionBadgeController();

	// Cycle 1: translating → disable clears
	const getStats1 = captureStatsCallback();
	controller.enable();
	getStats1()({ pending: 3, resolved: 0, rejected: 0 }, TAB_ID);
	expect(chromeAction.setBadgeText).toHaveBeenCalledWith({
		text: '...',
		tabId: TAB_ID,
	});

	controller.disable();
	expect(chromeAction.setBadgeText).toHaveBeenLastCalledWith({
		text: '',
		tabId: TAB_ID,
	});

	vi.clearAllMocks();

	// Cycle 2: partial → disable clears
	const getStats2 = captureStatsCallback();
	controller.enable();
	getStats2()({ pending: 0, resolved: 5, rejected: 2 }, TAB_ID);
	expect(chromeAction.setBadgeText).toHaveBeenCalledWith({ text: '~', tabId: TAB_ID });
	expect(chromeAction.setBadgeBackgroundColor).toHaveBeenCalledWith({
		color: '#e06000',
		tabId: TAB_ID,
	});

	controller.disable();
	expect(chromeAction.setBadgeText).toHaveBeenLastCalledWith({
		text: '',
		tabId: TAB_ID,
	});

	vi.clearAllMocks();

	// Cycle 3: all-error → disable clears
	const getStats3 = captureStatsCallback();
	controller.enable();
	getStats3()({ pending: 0, resolved: 0, rejected: 10 }, TAB_ID);
	expect(chromeAction.setBadgeText).toHaveBeenCalledWith({ text: '!', tabId: TAB_ID });

	controller.disable();
	expect(chromeAction.setBadgeText).toHaveBeenLastCalledWith({
		text: '',
		tabId: TAB_ID,
	});
});
