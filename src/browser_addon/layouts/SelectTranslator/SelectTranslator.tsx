import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import root from 'react-shadow';
import { browser } from 'webextension-polyfill-ts';
import { cn } from '@bem-react/classname';
import { isKeyCode, Keys } from 'react-elegant-ui/esm/lib/keyboard';

import LogoElement from '../../res/logo-icon.svg';

import { theme } from '../../themes/presets/default/desktop';
import { Popup } from '../../components/Popup/Popup';

import './SelectTranslator.css';
import {
	SelectTranslatorComponentProps,
	SelectTranslatorComponent,
} from './SelectTranslatorComponent';
import { fixPosToPreventOverflow } from './SelectTranslator.utils/fixPosToPreventOverflow';

export const cnSelectTranslator = cn('SelectTranslator');

export interface SelectTranslatorProps
	extends Omit<SelectTranslatorComponentProps, 'updatePopup'> {
	x: number;
	y: number;
	timeoutForHideButton?: number;
	zIndex?: number;
	quickTranslate?: boolean;
	focusOnTranslateButton?: boolean;

	closeHandler: () => void;
}

const themeClassname = cn('Theme')(theme);

// TODO: split styles
export const SelectTranslator: FC<SelectTranslatorProps> = ({
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

	const modifiers = useMemo(() => [{ name: 'hide', enabled: false }], []);

	const rootRef = useRef<any>(null);
	const styles = ['common.css', 'contentscript.css'];

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

	// Shadow root component load async, then useEffect is not work
	// To fix it we just force update manually
	const [isShadowRootLoaded, setIsShadowRootLoaded] = useState(false);

	// Focus by load of shadow root and by change state
	useEffect(() => {
		if (translating) {
			focusRootContainer();
		} else if (focusOnTranslateButton) {
			// Focus on button right after selection
			focusTranslateButton();
		}
	}, [
		isShadowRootLoaded,
		translating,
		focusOnTranslateButton,
		focusRootContainer,
		focusTranslateButton,
	]);

	// Render div on the coordinates as cursor and attach popup to it
	// We use real component instead virtual cuz need behavior of absolute position instead fixed
	// and implement this logic for virtual component is harder than use real component
	return (
		<root.div
			style={{ all: 'unset' }}
			ref={rootRef}
			onLoad={() => setIsShadowRootLoaded(true)}
			mode="closed"
		>
			{/* Include styles and scripts */}
			{styles.map((path, index) => (
				<link rel="stylesheet" href={browser.runtime.getURL(path)} key={index} />
			))}

			{/* Render cursor */}
			<div style={cursorStyle} ref={cursorRef} />

			{/* Render popup which attached to cursor */}
			<Popup
				target="anchor"
				anchor={cursorRef}
				visible={true}
				zIndex={zIndex}
				modifiers={modifiers}
				onClose={closeHandler}
				className={themeClassname}
				view={translating ? 'default' : undefined}
				UNSTABLE_updatePosition={updateRef}
			>
				<div tabIndex={0} ref={containerRef}>
					{translating ? (
						<SelectTranslatorComponent {...props} updatePopup={updateHook} />
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
							<LogoElement
								className={cnSelectTranslator('TranslateButton')}
							/>
						</div>
					)}
				</div>
			</Popup>
		</root.div>
	);
};
