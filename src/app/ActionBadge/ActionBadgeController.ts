import browser from 'webextension-polyfill';

import { pageTranslatorStateUpdatedHandler } from '../ContentScript/PageTranslator/requests/pageTranslatorStateUpdated';
import { pageTranslatorStatsUpdatedHandler } from '../ContentScript/PageTranslator/requests/pageTranslatorStatsUpdated';

// webextension-polyfill v0.12+ normalises browser.action for both MV2 and MV3,
// but @types/webextension-polyfill@0.9.x does not yet include the `action` namespace.
// Cast through browserAction (identical API shape) to preserve type safety.
const browserAction = (browser as any).action as typeof browser.browserAction;

// Badge visual states — text and background colour pairs.
// Text is limited to 4 characters by the browser; single symbols work best.
const BADGE_TRANSLATING = { text: '...', color: '#f0a500' }; // yellow — in progress
const BADGE_DONE        = { text: '✓',   color: '#3a8f3a' }; // green  — all segments translated
const BADGE_PARTIAL     = { text: '~',   color: '#e06000' }; // orange — some segments failed
const BADGE_ERROR       = { text: '!',   color: '#cc0000' }; // red    — all segments failed

/**
 * Shows a per-tab badge on the toolbar icon to reflect page translation state.
 *
 * Badge lifecycle:
 *   1. Translation starts   → '...' (yellow)
 *   2. All segments done    → '✓'   (green)  — persists until user stops or navigates
 *      Some segments failed → '~'   (orange) — persists until user stops or navigates
 *      All segments failed  → '!'   (red)    — persists until user stops or navigates
 *   3. User stops translate → badge cleared
 *   4. Tab navigates away   → badge cleared
 *
 * Design notes:
 * - Badge state is driven primarily from pageTranslatorStatsUpdated (segment counters)
 *   rather than pageTranslatorStateUpdated (on/off). This avoids a race condition where
 *   stats messages arrive at the service worker before the state message, because
 *   PageTranslatorController fires the effector store update (which synchronously starts
 *   translation and emits the first stats) before calling notifyState().
 * - enable() must be called synchronously during service worker startup, before any
 *   awaited operations, so that the runtime.onMessage listener is registered before
 *   the first message arrives on wake-up.
 */
export class ActionBadgeController {
	// Tracks any pending timers per tab. Currently unused for auto-clear (all badges
	// persist until explicitly cleared), but kept for safety so cancelClearTimer()
	// can always be called unconditionally before any badge update.
	private readonly clearTimers = new Map<number, ReturnType<typeof setTimeout>>();

	private isEnabled = false;
	private cleanupCallback: null | (() => void) = null;

	public enable() {
		if (this.isEnabled) return;
		this.isEnabled = true;

		// Listen for translation on/off events from the content script.
		// Used to clear the badge when the user manually stops translation.
		// The '...' badge is NOT set here — see stats handler below.
		const unwatchState = pageTranslatorStateUpdatedHandler((state, tabId) => {
			if (tabId === undefined) return;

			if (!state.isTranslated) {
				// User stopped translation — clear badge
				this.cancelClearTimer(tabId);
				this.clearBadge(tabId);
			}
		});

		// Listen for segment counter updates from the content script.
		// This is the primary driver for all badge states, including '...'.
		// Fired at most every 100ms (throttled in PageTranslator).
		const unwatchStats = pageTranslatorStatsUpdatedHandler((stats, tabId) => {
			if (tabId === undefined) return;

			const { resolved, rejected, pending } = stats;

			// PageTranslator.stop() resets counters to zero and flushes one last stats
			// message before sending the state-updated message. Ignore it here — the
			// state handler above will clear the badge when isTranslated goes false.
			if (pending === 0 && resolved === 0 && rejected === 0) return;

			if (pending > 0) {
				// Segments still in flight — show progress badge.
				// Driving '...' from stats (rather than from the state event) ensures
				// it appears even if the state message arrives out of order.
				this.cancelClearTimer(tabId);
				this.setBadge(tabId, BADGE_TRANSLATING);
				return;
			}

			// All segments have settled — show final result badge.
			if (resolved > 0 && rejected === 0) {
				// Every segment translated successfully
				this.cancelClearTimer(tabId);
				this.setBadge(tabId, BADGE_DONE);
			} else if (resolved > 0 && rejected > 0) {
				// Mixed result — page is partially translated
				this.cancelClearTimer(tabId);
				this.setBadge(tabId, BADGE_PARTIAL);
			} else {
				// resolved === 0, rejected > 0 — translation failed entirely
				this.cancelClearTimer(tabId);
				this.setBadge(tabId, BADGE_ERROR);
			}
		});

		// Clear badge when the user navigates to a different URL in the tab.
		// changeInfo.url is only present on actual navigations, not on tab focus changes.
		const onTabUpdated = (
			tabId: number,
			changeInfo: browser.Tabs.OnUpdatedChangeInfoType,
		) => {
			if (changeInfo.url !== undefined) {
				this.cancelClearTimer(tabId);
				this.clearBadge(tabId);
			}
		};

		// Clean up timer state when a tab is closed (badge is destroyed with the tab anyway).
		const onTabRemoved = (tabId: number) => {
			this.cancelClearTimer(tabId);
		};

		browser.tabs.onUpdated.addListener(onTabUpdated);
		browser.tabs.onRemoved.addListener(onTabRemoved);

		// Store cleanup callbacks so disable() can remove all listeners cleanly.
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
