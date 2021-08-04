import React from 'react';
import ReactDOM from 'react-dom';
import root from 'react-shadow';
import { browser } from 'webextension-polyfill-ts';

import { translate } from '../requests/backend/translate';
import { SelectTranslator as SelectTranslatorPopup } from '../layouts/SelectTranslator/SelectTranslator';

interface Options {
	/**
	 * Key modifiers to activate translate of selected text
	 */
	modifiers: Array<'ctrlKey' | 'altKey' | 'shiftKey' | 'metaKey'>;

	/**
	 * Skip when pointerdown not on the selected text
	 */
	strictSelection: boolean;

	/**
	 * Don't show translate button and translate at once
	 */
	quickTranslate: boolean;

	/**
	 * Page language for translate direction
	 */
	pageLanguage?: string;

	/**
	 * Detected language is firstly than page language
	 */
	detectedLangFirst: boolean;

	/**
	 * Remember translate direction
	 */
	rememberDirection: boolean;

	/**
	 * CSS property for popup
	 */
	zIndex?: number;

	/**
	 * Hide translate button after delay when specified positive number
	 */
	timeoutForHideButton?: number;

	/**
	 * Useful for keyboard navigation
	 */
	focusOnTranslateButton?: boolean;

	/**
	 * Show translate block once for each text selection
	 */
	showOnceForSelection?: boolean;

	/**
	 * Show block with original text
	 */
	showOriginalText: boolean;
}

/**
 * This wrapper on component need to allow convenient manage state
 */
export class SelectTranslator {
	private options: Options = {
		modifiers: ['ctrlKey'],
		detectedLangFirst: false,
		quickTranslate: false,
		strictSelection: false,
		rememberDirection: false,
		showOnceForSelection: true,
		showOriginalText: true,
	};

	constructor(options?: Partial<Options>) {
		if (options !== undefined) {
			for (const key in options) {
				(this.options as any)[key] = (options as any)[key];
			}
		}
	}

	// Root DOM node contains component
	private root: HTMLElement | null = null;

	// Flag which set while every selection event and reset while button shown
	private unhandledSelection = false;
	private selectionFlagUpdater = () => {
		this.unhandledSelection = true;
	};

	public start() {
		if (this.root !== null) {
			throw new Error('Already started');
		}

		// Create and insert root node
		this.root = document.createElement('div');
		document.body.appendChild(this.root);

		// Reset all styles
		this.root.style.setProperty('all', 'unset');

		// Add event listeners
		document.addEventListener('pointerdown', this.pointerDown);
		document.addEventListener('pointerup', this.pointerUp);
		this.root.addEventListener('keydown', this.keyDown);
		document.addEventListener('selectionchange', this.selectionFlagUpdater);

		this.mountComponent();
	}

	public stop() {
		if (this.root === null) {
			throw new Error('Not started');
		}

		// Remove event listeners
		document.removeEventListener('pointerdown', this.pointerDown);
		document.removeEventListener('pointerup', this.pointerUp);
		this.root.removeEventListener('keydown', this.keyDown);
		document.removeEventListener('selectionchange', this.selectionFlagUpdater);

		// Unmount component and remove root node
		this.unmountComponent();
		this.root.remove();
		this.root = null;
	}

	public isRun() {
		return this.root !== null;
	}

	// Prevent handle keys by page. It important for search language on pages like youtube where F key can open fullscreen mode
	private keyDown = (evt: KeyboardEvent) => {
		evt.stopImmediatePropagation();
	};

	// NOTE: maybe it should be removed after start use popup
	/**
	 * Close popup by click outside the root
	 */
	private pointerDown = (evt: PointerEvent) => {
		if (
			evt.target instanceof Node &&
			this.root !== null &&
			this.root.contains(evt.target)
		)
			return;

		this.hidePopup();
	};

	private context = Symbol('context');

	/**
	 * Open popup by text selection on the page
	 */
	private pointerUp = (evt: PointerEvent) => {
		// Reject if press not left button or not just touch
		// Codes list: https://www.w3.org/TR/pointerevents1/#h5_chorded-button-interactions
		if (evt.button !== 0) return;

		// Check modifier keys
		const requiredModifierKeys = this.options.modifiers;
		if (
			requiredModifierKeys.length > 0 &&
			!requiredModifierKeys.every((value) => evt[value])
		)
			return;

		const target = evt.target;

		// Skip events inside root node
		if (this.root === null || (target instanceof Node && this.root.contains(target)))
			return;

		this.context = Symbol('context');
		const context = this.context;

		const { pageX, pageY } = evt;

		// Get selected text in next frame
		requestAnimationFrame(() => {
			if (context !== this.context) return;
			this.context = Symbol('context');

			const selection = window.getSelection();

			// Skip empty selection
			if (selection === null) return;

			// Skip if selected a text inside root node
			if (
				this.root === null ||
				this.root.contains(selection.anchorNode) ||
				this.root.contains(selection.focusNode)
			)
				return;

			// Skip when pointerdown not on the selected text
			if (this.options.strictSelection && selection.focusNode instanceof Text) {
				const parent = selection.focusNode.parentElement;
				if (parent !== null && parent !== target) return;
			}

			// Skip if it shown not first time
			if (this.options.showOnceForSelection && !this.unhandledSelection) return;

			const selectedText = selection.toString();
			if (selectedText.length > 0) {
				this.showPopup(selectedText, pageX, pageY);
			}
		});
	};

	private showPopup = (text: string, x: number, y: number) => {
		// Update selection value
		this.unhandledSelection = false;

		const {
			pageLanguage,
			quickTranslate,
			detectedLangFirst,
			rememberDirection,
			zIndex,
			timeoutForHideButton,
			focusOnTranslateButton,
			showOriginalText,
		} = this.options;

		this.mountComponent(
			<SelectTranslatorPopup
				closeHandler={() => this.mountComponent()}
				translate={translate}
				{...{
					pageLanguage,
					showOriginalText,
					quickTranslate,
					detectedLangFirst,
					rememberDirection,
					zIndex,
					timeoutForHideButton,
					focusOnTranslateButton,
					x,
					y,
					text,
				}}
			/>,
		);
	};

	private hidePopup = () => {
		this.mountComponent();
	};

	// Render shadow root with preloading resources
	private mountComponent = (child?: React.ReactNode) => {
		// Skip when root node is not exist
		if (this.root === null) return;

		const styles = ['common.css', 'contentscript.css'];

		ReactDOM.render(
			<root.div style={{ all: 'unset' }} mode="closed">
				{/* Include styles and scripts */}
				{styles.map((path, index) => (
					<link
						key={index}
						rel="stylesheet"
						href={browser.runtime.getURL(path)}
					/>
				))}
				{child}
			</root.div>,
			this.root,
		);
	};

	private unmountComponent = () => {
		if (this.root !== null) {
			ReactDOM.unmountComponentAtNode(this.root);
		}
	};
}
