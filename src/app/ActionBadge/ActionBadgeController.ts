import browser from 'webextension-polyfill';

import type { PageTranslatorStats } from '../ContentScript/PageTranslator/PageTranslator.tsx';
import type { PageTranslatorState } from '../ContentScript/PageTranslator/PageTranslatorController';
import { pageTranslatorStateUpdatedHandler } from '../ContentScript/PageTranslator/requests/pageTranslatorStateUpdated';
import { pageTranslatorStatsUpdatedHandler } from '../ContentScript/PageTranslator/requests/pageTranslatorStatsUpdated';

const browserAction = browser.action;

const BADGE_TRANSLATING = { text: '...', color: '#f0a500' };
const BADGE_DONE = { text: '✓', color: '#3a8f3a' };
const BADGE_PARTIAL = { text: '~', color: '#e06000' };
const BADGE_ERROR = { text: '!', color: '#cc0000' };

type Unsubscribe = () => void;
type StateSubscriber = (
	cb: (state: PageTranslatorState, tabId?: number) => void,
) => Unsubscribe;
type StatsSubscriber = (
	cb: (stats: PageTranslatorStats, tabId?: number) => void,
) => Unsubscribe;

/**
 * Shows a per-tab badge on the toolbar icon reflecting page translation state.
 *
 * Badge is driven from pageTranslatorStatsUpdated (segment counters) rather than
 * pageTranslatorStateUpdated (on/off) to avoid a race where stats messages arrive
 * before the state message at the service worker.
 *
 * enable() must be called synchronously during service worker startup so the
 * runtime.onMessage listener is registered before the first message arrives.
 */
export class ActionBadgeController {
	private isEnabled = false;
	private cleanupCallback: null | (() => void) = null;
	private readonly badgedTabs = new Set<number>();

	constructor(
		private readonly subscribePageTranslationState: StateSubscriber = pageTranslatorStateUpdatedHandler,
		private readonly subscribePageTranslationStats: StatsSubscriber = pageTranslatorStatsUpdatedHandler,
	) {}

	public enable() {
		if (this.isEnabled) return;
		this.isEnabled = true;

		const unwatchState = this.subscribePageTranslationState((state, tabId) => {
			if (tabId === undefined) return;
			if (!state.isTranslated) {
				this.clearBadge(tabId);
			}
		});

		const unwatchStats = this.subscribePageTranslationStats((stats, tabId) => {
			if (!this.isEnabled || tabId === undefined) return;

			const { resolved, rejected, pending } = stats;

			// PageTranslator.stop() emits a zero-counters flush before the state message — ignore it.
			if (pending === 0 && resolved === 0 && rejected === 0) return;

			if (pending > 0) {
				this.setBadge(tabId, BADGE_TRANSLATING);
				return;
			}

			if (resolved > 0 && rejected === 0) {
				this.setBadge(tabId, BADGE_DONE);
			} else if (resolved > 0 && rejected > 0) {
				this.setBadge(tabId, BADGE_PARTIAL);
			} else {
				this.setBadge(tabId, BADGE_ERROR);
			}
		});

		// changeInfo.url is only present on actual navigations, not focus changes.
		const onTabUpdated = (
			tabId: number,
			changeInfo: browser.Tabs.OnUpdatedChangeInfoType,
		) => {
			if (changeInfo.url !== undefined) {
				this.clearBadge(tabId);
			}
		};

		browser.tabs.onUpdated.addListener(onTabUpdated);

		this.cleanupCallback = () => {
			unwatchState();
			unwatchStats();
			browser.tabs.onUpdated.removeListener(onTabUpdated);
			for (const tabId of this.badgedTabs) {
				browserAction.setBadgeText({ text: '', tabId }).catch(() => {});
			}
			this.badgedTabs.clear();
		};
	}

	public disable() {
		if (!this.isEnabled) return;
		this.isEnabled = false;
		this.cleanupCallback?.();
		this.cleanupCallback = null;
	}

	private setBadge(tabId: number, badge: { text: string; color: string }) {
		this.badgedTabs.add(tabId);
		browserAction.setBadgeText({ text: badge.text, tabId }).catch(() => {});
		browserAction
			.setBadgeBackgroundColor({ color: badge.color, tabId })
			.catch(() => {});
	}

	private clearBadge(tabId: number) {
		this.badgedTabs.delete(tabId);
		browserAction.setBadgeText({ text: '', tabId }).catch(() => {});
	}
}
