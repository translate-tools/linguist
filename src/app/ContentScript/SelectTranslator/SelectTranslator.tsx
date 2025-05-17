import React from 'react';

import { ShadowDOMContainerManager } from '../../../lib/ShadowDOMContainerManager';
import { translate } from '../../../requests/backend/translate';

import { TextTranslatorPopup } from './components/TextTranslatorPopup/TextTranslatorPopup';

export interface Options {
	/** * Key modifiers to activate translate of selected text */
	modifiers: Array<'ctrlKey' | 'altKey' | 'shiftKey' | 'metaKey'>;
	/** * Skip when pointerdown not on the selected text */
	strictSelection: boolean;
	/** * Don't show translate button and translate at once */
	quickTranslate: boolean;
	/** * Page language for translate direction */
	pageLanguage?: string;
	/** * Detected language is firstly than page language */
	detectedLangFirst: boolean;
	/** * Use auto detection for `from` direction */
	isUseAutoForDetectLang: boolean;
	/** * Remember translate direction */
	rememberDirection: boolean;
	/** * CSS property for popup */
	zIndex?: number;
	/** * Hide translate button after delay when specified positive number */
	timeoutForHideButton?: number;
	/** * Useful for keyboard navigation */
	focusOnTranslateButton?: boolean;
	/** * Show translate block once for each text selection */
	showOnceForSelection?: boolean;
	/** * Show block with original text */
	showOriginalText: boolean;
	enableTranslateFromContextMenu?: boolean;
}
export const getSelectedTextOfInput = (elm: HTMLInputElement | HTMLTextAreaElement) => {
	const { selectionStart, selectionEnd } = elm;
	if (selectionStart === null || selectionEnd === null) return '';
	return elm.value.slice(selectionStart, selectionEnd);
};
/** * This wrapper on component need to allow convenient manage state */
export class SelectTranslator {
	private options: Options = {
		modifiers: ['ctrlKey'],
		detectedLangFirst: false,
		quickTranslate: false,
		strictSelection: false,
		rememberDirection: false,
		showOnceForSelection: true,
		showOriginalText: true,
		isUseAutoForDetectLang: true,
		enableTranslateFromContextMenu: false,
	};
	constructor(options?: Partial<Options>) {
		if (options !== undefined) {
			for (const key in options) {
				(this.options as any)[key] = (options as any)[key];
			}
		}
	}
	// Flag which set while every selection event and reset while button shown
	private unhandledSelection = false;
	private selectionTarget: HTMLElement | null = null;
	private selectionFlagUpdater = (evt: Event) => {
		this.unhandledSelection = true;
		this.selectionTarget = evt.target instanceof HTMLElement ? evt.target : null;
	};
	private readonly shadowRoot = new ShadowDOMContainerManager({
		styles: ['contentscript.css'],
	});
	public start() {
		if (this.shadowRoot.getRootNode() !== null) {
			throw new Error('Already started');
		}
		this.shadowRoot.createRootNode();
		const root = this.shadowRoot.getRootNode() as HTMLElement;
		// Add event listeners
		root.addEventListener('keydown', this.keyDown);
		document.addEventListener('selectionchange', this.selectionFlagUpdater);
		document.addEventListener('pointerdown', this.pointerDown);
		document.addEventListener('pointerup', this.pointerUp);
		document.addEventListener('touchstart', this.pointerDown);
		document.addEventListener('touchend', this.pointerUp);
		this.mountEmptyComponent();
	}
	public stop() {
		const root = this.shadowRoot.getRootNode();
		if (root === null) {
			throw new Error('Not started');
		}
		// Remove event listeners
		root.removeEventListener('keydown', this.keyDown);
		document.removeEventListener('selectionchange', this.selectionFlagUpdater);
		document.removeEventListener('pointerdown', this.pointerDown);
		document.removeEventListener('pointerup', this.pointerUp);
		document.removeEventListener('touchstart', this.pointerDown);
		document.removeEventListener('touchend', this.pointerUp);
		// Unmount component and remove root node
		this.shadowRoot.unmountComponent();
		this.shadowRoot.removeRootNode();
	}
	public isRun() {
		return this.shadowRoot.getRootNode() !== null;
	}
	public translateSelectedText = () => {
		this.hidePopup();
		const { x, y } = this.lastPointerPosition || {
			x: window.scrollX,
			y: window.scrollY,
		};
		this.getSelectedText().then((selection) => {
			let text: string | null = null;
			// TODO: #refactor move this logic to one method `getSelectedText(target?: Node)`
			if (selection !== null) {
				text = selection.text;
			} else if (
				this.selectionTarget !== null &&
				(this.selectionTarget instanceof HTMLTextAreaElement ||
					this.selectionTarget instanceof HTMLInputElement)
			) {
				text = getSelectedTextOfInput(this.selectionTarget);
			}
			if (text !== null) {
				this.showPopup(text, x, y);
			}
		});
	};
	private getSelectedText = () =>
		new Promise<{ selection: Selection; text: string } | null>((res) => {
			const root = this.shadowRoot.getRootNode();
			this.context = Symbol('context');
			const context = this.context;
			// Get selected text in next frame
			requestAnimationFrame(() => {
				if (context !== this.context) {
					res(null);
					return;
				}
				this.context = Symbol('context');
				const selection = window.getSelection();
				// Skip empty selection
				if (selection === null) {
					res(null);
					return;
				}
				// Skip if selected a text inside root node
				if (
					root === null ||
					root.contains(selection.anchorNode) ||
					root.contains(selection.focusNode)
				)
					return;
				const selectedText = selection.toString();
				res(selectedText.length > 0 ? { selection, text: selectedText } : null);
			});
		});

	// Prevent handle keys by page. It important for search language on pages like youtube where F key can open fullscreen mode
	private keyDown = (evt: KeyboardEvent) => {
		evt.stopImmediatePropagation();
	};
	// NOTE: maybe it should be removed after start use popup
	/** * Close popup by click outside the root */
	private pointerDown = (evt: PointerEvent | TouchEvent) => {
		const root = this.shadowRoot.getRootNode();
		if (root !== null && evt.target instanceof Node && root.contains(evt.target))
			return;
		this.hidePopup();
	};
	private context = Symbol('context');
	private lastPointerPosition: { x: number; y: number } | null = null;
	/** * Open popup by text selection on the page */
	private pointerUp = async (evt: PointerEvent | TouchEvent) => {
		await new Promise((res) => setTimeout(res, 10));
		const getIsTouchEvt = (evt: Event): evt is TouchEvent =>
			evt.type === 'touchstart' || evt.type === 'touchend';
		const isTouchEvt = getIsTouchEvt(evt);
		// Reject if press not left button or not just touch
		// Codes list: https://www.w3.org/TR/pointerevents1/#h5_chorded-button-interactions
		if (!isTouchEvt && evt.button !== 0) return;
		const { pageX, pageY } = isTouchEvt ? evt.changedTouches[0] : evt;
		this.lastPointerPosition = { x: pageX, y: pageY };
		// Skip when enabled translation with context menu
		if (this.options.enableTranslateFromContextMenu) return;
		// Check modifier keys
		const requiredModifierKeys = this.options.modifiers;
		if (
			requiredModifierKeys.length > 0 &&
			!requiredModifierKeys.every((value) => evt[value])
		)
			return;
		const target = evt.target;
		const root = this.shadowRoot.getRootNode();
		// Skip events inside root node
		if (root === null || (target instanceof Node && root.contains(target))) return;
		this.getSelectedText().then((selectedTextObj) => {
			let text: string | null = null;
			if (selectedTextObj !== null) {
				// Use selected text on page
				text = selectedTextObj.text;
				const { selection } = selectedTextObj;
				// Skip when pointerdown not on the selected text
				if (this.options.strictSelection && selection.focusNode instanceof Text) {
					const parent = selection.focusNode.parentElement;
					if (parent !== null && parent !== target) return;
				}
				// Skip if it shown not first time
				if (this.options.showOnceForSelection && !this.unhandledSelection) return;
			} else if (
				this.selectionTarget !== null &&
				(this.selectionTarget instanceof HTMLTextAreaElement ||
					this.selectionTarget instanceof HTMLInputElement)
			) {
				// Use selected text in input
				text = getSelectedTextOfInput(this.selectionTarget);
			}
			if (text !== null) {
				this.showPopup(text, pageX, pageY);
			}
		});
	};
	private showPopup = (text: string, x: number, y: number) => {
		const trimmedText = text.trim();
		if (trimmedText.length === 0) return;
		// Update selection value
		this.unhandledSelection = false;
		const {
			pageLanguage,
			quickTranslate,
			detectedLangFirst,
			isUseAutoForDetectLang,
			rememberDirection,
			zIndex,
			timeoutForHideButton,
			focusOnTranslateButton,
			showOriginalText,
			enableTranslateFromContextMenu,
		} = this.options;
		const isForceQuickTranslate = enableTranslateFromContextMenu;
		this.shadowRoot.mountComponent(
			<TextTranslatorPopup
				closeHandler={this.hidePopup}
				quickTranslate={isForceQuickTranslate || quickTranslate}
				{...{
					translate,
					pageLanguage,
					showOriginalText,
					detectedLangFirst,
					isUseAutoForDetectLang,
					rememberDirection,
					zIndex,
					timeoutForHideButton,
					focusOnTranslateButton,
					x,
					y,
					text: trimmedText,
				}}
			/>,
		);
	};
	private hidePopup = () => {
		this.mountEmptyComponent();
	};
	private mountEmptyComponent = () => {
		this.shadowRoot.mountComponent();
	};
}
