import { ActionBadgeController } from './ActionBadgeController';
import type { PageTranslatorStats } from '../ContentScript/PageTranslator/PageTranslator';
import type { PageTranslatorState } from '../ContentScript/PageTranslator/PageTranslatorController';

vi.mock('webextension-polyfill', () => {
	const setBadgeText = vi.fn().mockResolvedValue(undefined);
	const setBadgeBackgroundColor = vi.fn().mockResolvedValue(undefined);
	const action = { setBadgeText, setBadgeBackgroundColor };
	return {
		default: {
			action,
			browserAction: action,
			tabs: {
				onUpdated: { addListener: vi.fn(), removeListener: vi.fn() },
				onRemoved: { addListener: vi.fn(), removeListener: vi.fn() },
			},
		},
	};
});

vi.mock('../ContentScript/PageTranslator/requests/pageTranslatorStateUpdated', () => ({
	pageTranslatorStateUpdatedHandler: vi.fn(() => vi.fn()),
}));
vi.mock('../ContentScript/PageTranslator/requests/pageTranslatorStatsUpdated', () => ({
	pageTranslatorStatsUpdatedHandler: vi.fn(() => vi.fn()),
}));

import browser from 'webextension-polyfill';
import { pageTranslatorStateUpdatedHandler } from '../ContentScript/PageTranslator/requests/pageTranslatorStateUpdated';
import { pageTranslatorStatsUpdatedHandler } from '../ContentScript/PageTranslator/requests/pageTranslatorStatsUpdated';

const TAB_ID = 1;

beforeEach(() => {
	vi.clearAllMocks();
});

test('shows translating badge while segments are pending', () => {
	let statsCallback!: (stats: PageTranslatorStats, tabId?: number) => void;
	vi.mocked(pageTranslatorStatsUpdatedHandler).mockImplementation((cb) => {
		statsCallback = cb;
		return vi.fn();
	});

	const controller = new ActionBadgeController();
	controller.enable();

	statsCallback({ pending: 5, resolved: 0, rejected: 0 }, TAB_ID);

	expect(browser.browserAction.setBadgeText).toHaveBeenCalledWith({
		text: '...',
		tabId: TAB_ID,
	});
	expect(browser.browserAction.setBadgeBackgroundColor).toHaveBeenCalledWith({
		color: '#f0a500',
		tabId: TAB_ID,
	});

	controller.disable();
});

test('shows done badge when all segments resolved', () => {
	let statsCallback!: (stats: PageTranslatorStats, tabId?: number) => void;
	vi.mocked(pageTranslatorStatsUpdatedHandler).mockImplementation((cb) => {
		statsCallback = cb;
		return vi.fn();
	});

	const controller = new ActionBadgeController();
	controller.enable();

	statsCallback({ pending: 0, resolved: 10, rejected: 0 }, TAB_ID);

	expect(browser.browserAction.setBadgeText).toHaveBeenCalledWith({
		text: '✓',
		tabId: TAB_ID,
	});
	expect(browser.browserAction.setBadgeBackgroundColor).toHaveBeenCalledWith({
		color: '#3a8f3a',
		tabId: TAB_ID,
	});

	controller.disable();
});

test('shows partial badge when some segments failed', () => {
	let statsCallback!: (stats: PageTranslatorStats, tabId?: number) => void;
	vi.mocked(pageTranslatorStatsUpdatedHandler).mockImplementation((cb) => {
		statsCallback = cb;
		return vi.fn();
	});

	const controller = new ActionBadgeController();
	controller.enable();

	statsCallback({ pending: 0, resolved: 7, rejected: 3 }, TAB_ID);

	expect(browser.browserAction.setBadgeText).toHaveBeenCalledWith({
		text: '~',
		tabId: TAB_ID,
	});
	expect(browser.browserAction.setBadgeBackgroundColor).toHaveBeenCalledWith({
		color: '#e06000',
		tabId: TAB_ID,
	});

	controller.disable();
});

test('shows error badge when all segments failed', () => {
	let statsCallback!: (stats: PageTranslatorStats, tabId?: number) => void;
	vi.mocked(pageTranslatorStatsUpdatedHandler).mockImplementation((cb) => {
		statsCallback = cb;
		return vi.fn();
	});

	const controller = new ActionBadgeController();
	controller.enable();

	statsCallback({ pending: 0, resolved: 0, rejected: 5 }, TAB_ID);

	expect(browser.browserAction.setBadgeText).toHaveBeenCalledWith({
		text: '!',
		tabId: TAB_ID,
	});
	expect(browser.browserAction.setBadgeBackgroundColor).toHaveBeenCalledWith({
		color: '#cc0000',
		tabId: TAB_ID,
	});

	controller.disable();
});

test('clears badge when translation is stopped', () => {
	let stateCallback!: (state: PageTranslatorState, tabId?: number) => void;
	vi.mocked(pageTranslatorStateUpdatedHandler).mockImplementation((cb) => {
		stateCallback = cb;
		return vi.fn();
	});

	const controller = new ActionBadgeController();
	controller.enable();

	stateCallback(
		{
			isTranslated: false,
			counters: { pending: 0, resolved: 0, rejected: 0 },
			translateDirection: null,
		},
		TAB_ID,
	);

	expect(browser.browserAction.setBadgeText).toHaveBeenCalledWith({
		text: '',
		tabId: TAB_ID,
	});

	controller.disable();
});

test('ignores zero-counter flush from PageTranslator.stop()', () => {
	let statsCallback!: (stats: PageTranslatorStats, tabId?: number) => void;
	vi.mocked(pageTranslatorStatsUpdatedHandler).mockImplementation((cb) => {
		statsCallback = cb;
		return vi.fn();
	});

	const controller = new ActionBadgeController();
	controller.enable();

	statsCallback({ pending: 0, resolved: 0, rejected: 0 }, TAB_ID);

	expect(browser.browserAction.setBadgeText).not.toHaveBeenCalled();

	controller.disable();
});

test('clears badge on tab navigation', () => {
	const controller = new ActionBadgeController();
	controller.enable();

	const onTabUpdated = vi.mocked(browser.tabs.onUpdated.addListener).mock
		.calls[0]?.[0] as Function;
	onTabUpdated(TAB_ID, { url: 'https://example.com' }, {});

	expect(browser.browserAction.setBadgeText).toHaveBeenCalledWith({
		text: '',
		tabId: TAB_ID,
	});

	controller.disable();
});

test('disable() stops responding to events', () => {
	let statsCallback!: (stats: PageTranslatorStats, tabId?: number) => void;
	vi.mocked(pageTranslatorStatsUpdatedHandler).mockImplementation((cb) => {
		statsCallback = cb;
		return vi.fn();
	});

	const controller = new ActionBadgeController();
	controller.enable();
	controller.disable();

	vi.clearAllMocks();
	statsCallback({ pending: 3, resolved: 0, rejected: 0 }, TAB_ID);

	expect(browser.browserAction.setBadgeText).not.toHaveBeenCalled();
});
