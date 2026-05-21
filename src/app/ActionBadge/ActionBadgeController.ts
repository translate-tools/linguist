import browser from 'webextension-polyfill';

import { pageTranslatorStateUpdatedHandler } from '../ContentScript/PageTranslator/requests/pageTranslatorStateUpdated';
import { pageTranslatorStatsUpdatedHandler } from '../ContentScript/PageTranslator/requests/pageTranslatorStatsUpdated';

// webextension-polyfill v0.12+ normalises browser.action for both MV2 and MV3,
// but @types/webextension-polyfill@0.9.x does not yet include the `action` namespace.
const browserAction = (browser as any).action as typeof browser.browserAction;

const BADGE_TRANSLATING = { text: '...', color: '#f0a500' };
const BADGE_DONE = { text: '✓', color: '#3a8f3a' };
const BADGE_PARTIAL = { text: '~', color: '#e06000' };
const BADGE_ERROR = { text: '!', color: '#cc0000' };

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
	private readonly clearTimers = new Map<number, ReturnType<typeof setTimeout>>();
	private isEnabled = false;
	private cleanupCallback: null | (() => void) = null;

	public enable() {
		if (this.isEnabled) return;
		this.isEnabled = true;

		const unwatchState = pageTranslatorStateUpdatedHandler((state, tabId) => {
			if (tabId === undefined) return;
			if (!state.isTranslated) {
				this.cancelClearTimer(tabId);
				this.clearBadge(tabId);
			}
		});

		const unwatchStats = pageTranslatorStatsUpdatedHandler((stats, tabId) => {
			if (tabId === undefined) return;

			const { resolved, rejected, pending } = stats;

			// PageTranslator.stop() emits a zero-counters flush before the state message — ignore it.
			if (pending === 0 && resolved === 0 && rejected === 0) return;

			if (pending > 0) {
				this.cancelClearTimer(tabId);
				this.setBadge(tabId, BADGE_TRANSLATING);
				return;
			}

			this.cancelClearTimer(tabId);
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
				this.cancelClearTimer(tabId);
				this.clearBadge(tabId);
			}
		};

		const onTabRemoved = (tabId: number) => {
			this.cancelClearTimer(tabId);
		};

		browser.tabs.onUpdated.addListener(onTabUpdated);
		browser.tabs.onRemoved.addListener(onTabRemoved);

		this.cleanupCallback = () => {
			unwatchState();
			unwatchStats();
			browser.tabs.onUpdated.removeListener(onTabUpdated);
			browser.tabs.onRemoved.removeListener(onTabRemoved);
		};
	}

	public disable() {
		if (!this.isEnabled) return;
		this.isEnabled = false;

		this.cleanupCallback?.();
		this.cleanupCallback = null;

		for (const tabId of this.clearTimers.keys()) {
			this.cancelClearTimer(tabId);
		}
	}

	private cancelClearTimer(tabId: number) {
		const timer = this.clearTimers.get(tabId);
		if (timer !== undefined) {
			clearTimeout(timer);
			this.clearTimers.delete(tabId);
		}
	}

	private setBadge(tabId: number, badge: { text: string; color: string }) {
		browserAction.setBadgeText({ text: badge.text, tabId });
		browserAction.setBadgeBackgroundColor({ color: badge.color, tabId });
	}

	private clearBadge(tabId: number) {
		browserAction.setBadgeText({ text: '', tabId });
	}
}
