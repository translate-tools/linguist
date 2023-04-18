import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isKeyCode, Keys } from 'react-elegant-ui/esm/lib/keyboard';
import { cn } from '@bem-react/classname';

import { Modal } from '../../../../../components/primitives/Modal/Modal.bundle/desktop';
import { Popup } from '../../../../../components/primitives/Popup/Popup';
import { isMobileBrowser } from '../../../../../lib/browser';
import LogoElement from '../../../../../res/logo-icon.svg';
import { theme } from '../../../../../themes/presets/default/desktop';

import {
	TextTranslator,
	TextTranslatorComponentProps,
} from './TextTranslator/TextTranslator';
import { fixPosToPreventOverflow } from './TextTranslatorPopup.utils/fixPosToPreventOverflow';

import './TextTranslatorPopup.css';

export interface TextTranslatorPopupProps
	extends Omit<TextTranslatorComponentProps, 'updatePopup'> {
	x: number;
	y: number;
	timeoutForHideButton?: number;
	zIndex?: number;
	quickTranslate?: boolean;
	focusOnTranslateButton?: boolean;

	closeHandler: () => void;
}

const cnTheme = cn('Theme');
const cnTextTranslatorPopup = cn('TextTranslatorPopup');

// TODO: split styles
export const TextTranslatorPopup: FC<TextTranslatorPopupProps> = ({
	x,
	y,
	zIndex,
	timeoutForHideButton,
	quickTranslate = false,
	focusOnTranslateButton = false,
	...props
}) => {
	const { closeHandler } = props;

	const [translating, setTranslating] = useState(quickTranslate === true);

	const doTranslate = useCallback(() => {
		if (!translating) {
			setTranslating(true);
		}
	}, [translating]);

	const isUnmount = useRef(false);
	const autoCloseTimeout = useRef<number | null>(null);

	const toggleAutoclose = useCallback(
		(enable: boolean) => {
			const isEnabled = autoCloseTimeout.current !== null;

			// Skip if same state
			if (enable === isEnabled) return;

			// Clear timeout
			if (autoCloseTimeout.current !== null) {
				window.clearTimeout(autoCloseTimeout.current);
				autoCloseTimeout.current = null;
			}

			if (enable) {
				if (timeoutForHideButton !== undefined && timeoutForHideButton > 0) {
					autoCloseTimeout.current = window.setTimeout(() => {
						if (!isUnmount.current) {
							closeHandler();
						}
					}, timeoutForHideButton);
				}
			}
		},
		[closeHandler, timeoutForHideButton],
	);

	// Init
	useEffect(() => {
		// Enable hide button by timeout if not already translating
		if (!translating) {
			toggleAutoclose(true);
		}

		return () => {
			isUnmount.current = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (translating === true) {
			toggleAutoclose(false);
		}
	}, [toggleAutoclose, translating]);

	const updateRef = useRef<() => void | null>(null);
	const updateHook = useCallback(() => {
		if (updateRef.current) {
			updateRef.current();
		}
	}, []);

	const cursorRef = useRef<HTMLDivElement>(null);
	const cursorStyle: React.CSSProperties = useMemo(() => {
		const { left, top } = fixPosToPreventOverflow(x, y);

		return {
			position: 'absolute',
			left: left + 'px',
			top: top + 'px',
			width: '0px',
			height: '0px',
			pointerEvents: 'none',
			visibility: 'hidden',
		};
	}, [x, y]);

	const modifiers = useMemo(
		() => [
			{ name: 'hide', enabled: false },
			{
				// Compute as simply as possible, use only top and left
				// Otherwise, with use `inset` may be invalid position
				// Mod docs: https://popper.js.org/docs/v2/modifiers/compute-styles/#adaptive
				name: 'computeStyles',
				options: {
					gpuAcceleration: false,
					adaptive: false,
				},
			},
		],
		[],
	);

	// Focus on translate button or root node by change `translating` state
	const containerRef = useRef<HTMLDivElement>(null);
	const translateButtonRef = useRef<HTMLDivElement>(null);

	const focusTranslateButton = useCallback(() => {
		if (!translateButtonRef.current) return false;

		const btn = translateButtonRef.current;
		btn.focus();

		// Focus again after loading
		const focusAfterLoad = () => {
			btn.focus();
			btn.removeEventListener('load', focusAfterLoad);
		};

		btn.addEventListener('load', focusAfterLoad);

		return true;
	}, []);

	const focusRootContainer = useCallback(() => {
		if (!containerRef.current) return false;

		containerRef.current.focus();

		return true;
	}, []);

	// Components after render will change position and size,
	// we wait it and update state
	const [isComponentLoaded, setIsComponentLoaded] = useState(false);
	useEffect(() => {
		// Wait 1 frame after render
		requestAnimationFrame(() => setIsComponentLoaded(true));
	}, []);

	// Focus by load component and by change state
	useEffect(() => {
		// Skip if component did not load
		if (!isComponentLoaded) return;

		if (translating) {
			focusRootContainer();
		} else if (focusOnTranslateButton) {
			// Focus on button right after selection
			focusTranslateButton();
		}
	}, [
		isComponentLoaded,
		translating,
		focusOnTranslateButton,
		focusRootContainer,
		focusTranslateButton,
	]);

	const isMobile = useMemo(() => isMobileBrowser(), []);

	const content = (
		<div tabIndex={0} ref={containerRef}>
			{translating ? (
				<TextTranslator {...props} updatePopup={updateHook} />
			) : (
				<div
					tabIndex={0}
					ref={translateButtonRef}
					onKeyDown={(evt) => {
						if (isKeyCode(evt.code, [Keys.ENTER, Keys.SPACE])) {
							evt.preventDefault();
							doTranslate();
						}
					}}
					onClick={doTranslate}
					onMouseOver={() => toggleAutoclose(false)}
					onMouseLeave={() => toggleAutoclose(true)}
				>
					<LogoElement className={cnTextTranslatorPopup('TranslateButton')} />
				</div>
			)}
		</div>
	);

	// Mobile view
	if (isMobile && translating) {
		return (
			<div className={cnTextTranslatorPopup({ mobile: true }, [cnTheme(theme)])}>
				<Modal view="default" visible preventBodyScroll zIndex={zIndex}>
					{content}
				</Modal>
			</div>
		);
	}

	// Render div on the coordinates as cursor and attach popup to it
	// We use real component instead virtual because require behavior of `position: absolute` instead `fixed`
	// and implement this logic for virtual component is harder than use real component
	return (
		<>
			{/* Render cursor */}
			<div style={cursorStyle} ref={cursorRef} />

			{/* Render popup attached to cursor */}
			<div className={cnTextTranslatorPopup({}, [cnTheme(theme)])}>
				<Popup
					target="anchor"
					anchor={cursorRef}
					visible={true}
					zIndex={zIndex}
					modifiers={modifiers}
					onClose={closeHandler}
					view={translating ? 'default' : undefined}
					UNSTABLE_updatePosition={updateRef}
				>
					{content}
				</Popup>
			</div>
		</>
	);
};
