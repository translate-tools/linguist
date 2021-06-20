import React, {
	ComponentType,
	createContext,
	FC,
	ReactNode,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { cn } from '@bem-react/classname';
import {
	PaneItem,
	TabsPanes,
} from 'react-elegant-ui/esm/components/TabsPanes/TabsPanes.bundle/desktop';

import { getMessage } from '../../../lib/language';
import { XResizeObserver } from '../../../lib/XResizeObserver';
import { TabsMenu } from '../../../components/TabsMenu/TabsMenu.bundle/desktop';
import { Icon } from '../../../components/Icon/Icon.bundle/desktop';

import { Loader } from '../../../components/Loader/Loader';
import { AppConfigType } from '../../../types/runtime';

import LogoElement from '../../../res/logo-base.svg';
import { Button } from '../../../components/Button/Button.bundle/desktop';

import './PopupWindow.css';

export const cnPopupWindow = cn('PopupWindow');

export type TranslatorFeatures = {
	supportedLanguages: string[];
	isSupportAutodetect: boolean;
};

export interface TabData {
	config: AppConfigType;
	translatorFeatures: TranslatorFeatures;
}

export type TabComponent<T = any> = ComponentType<
	TabData & {
		id: string;
		initData?: T;
	}
> & {
	/**
	 * Hook which set init data for component
	 */
	init?: () => Promise<T>;
};

export interface IPopupWindowTab {
	id: string;
	component: TabComponent;
}

export interface PopupWindowProps {
	/**
	 * Root element for detect decreasing size
	 */
	rootElement: HTMLElement;

	/**
	 * Error message which show instead tabs
	 */
	error?: ReactNode;

	/**
	 * Tabs list
	 */
	tabs?: IPopupWindowTab[];

	// Knobs to control it outside and be able keep and restore last state
	activeTab?: string;
	setActiveTab?: (id: string) => void;

	/**
	 * Set min width of window
	 */
	minWidth?: number;

	// NOTE: it not used here, only forward, maybe should move it to components init hook
	config?: AppConfigType;
	translatorFeatures?: TranslatorFeatures;
}

const SettingsIcon = (className: string) => (
	<Icon
		glyph="settings"
		scalable={false}
		className={cnPopupWindow('HeaderIcon', [className])}
	/>
);

const DictionaryIcon = (className: string) => (
	<Icon
		glyph="dictionary"
		scalable={false}
		style={{ transform: 'scale(1.5)' }}
		className={cnPopupWindow('HeaderIcon', [className])}
	/>
);

export type PopupWindowContextProps = { activeTab?: string };
export const PopupWindowContext = createContext<PopupWindowContextProps>({});

/**
 * Component which represent popup window.
 *
 * It's contain tabs with some content and API for async preload tabs data
 * While tabs load data, component will render spinner
 */
export const PopupWindow: FC<PopupWindowProps> = ({
	config,
	translatorFeatures,
	error,
	tabs,
	activeTab: activeTabId,
	setActiveTab,
	rootElement,
	minWidth = 450,
}) => {
	// Resize window
	const resizeObserver = useRef<XResizeObserver>();
	useEffect(() => {
		resizeObserver.current = new XResizeObserver({
			sizeGetter: (node: Element) => ({
				height: node.scrollHeight,
				width: node.scrollWidth,
			}),
		});

		const doc = document.body;
		const wrap = rootElement;

		// Hack which implement resize body in firefox
		// It need when popup wrap have overflow items (like language selector)
		// Standart ResizeObserver can't track this even with option `box: 'border-box'`
		const isFirefox = /firefox/i.test(navigator.userAgent);
		if (isFirefox) {
			// TODO: fix size decreasing
			// Size decreasing is not work now. Block is hungry. Else it work, but layout always small
			// Max size remember module below is not affect on this problem

			resizeObserver.current.addHandler(wrap, () => {
				let wCounter = 0;
				while (wCounter < 2) {
					if (doc.scrollWidth > doc.clientWidth) {
						doc.style.width = doc.scrollWidth + 'px';
						break;
					} else if (wCounter < 2) {
						// Reset size for handle in next tick
						doc.style.width = '';
					}

					wCounter++;
				}

				let hCounter = 0;
				while (hCounter < 2) {
					if (doc.scrollHeight > doc.clientHeight) {
						doc.style.height = doc.scrollHeight + 'px';
						break;
					} else if (hCounter < 2) {
						// Reset size for handle in next tick
						doc.style.height = '';
					}

					hCounter++;
				}
			});
		}

		// Remember max width to prevent resize while switch between tabs
		let lastMaxWidth = 0;
		resizeObserver.current.addHandler(wrap, () => {
			const currentWidth = wrap.scrollWidth;

			doc.style.width = '';
			const resetWidth = wrap.scrollWidth;

			lastMaxWidth = Math.max(lastMaxWidth, currentWidth, resetWidth);
			doc.style.width = lastMaxWidth + 'px';
		});

		return () => {
			if (resizeObserver.current !== undefined) {
				resizeObserver.current.purgeHandlers(rootElement);
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Render panes

	const [panes, setPanes] = useState<PaneItem[] | null>(null);
	const panesRenderContext = useRef({});

	useEffect(() => {
		// Update context
		const renderContext = {};
		panesRenderContext.current = renderContext;

		// Prevent render without data
		if (
			tabs === undefined ||
			translatorFeatures === undefined ||
			config === undefined
		) {
			return;
		}

		// Async bootstrap wrapper
		(async () => {
			const panes = await Promise.all(
				tabs.map(async ({ id, component: Pane }) => {
					// Call and await init function
					const initFn = Pane.init;
					const initData = initFn !== undefined ? await initFn() : undefined;

					return {
						id,
						content: (
							<Pane {...{ translatorFeatures, config, id, initData }} />
						),
					};
				}),
			);

			// Check context before set data
			if (panesRenderContext.current === renderContext) {
				setPanes(panes);
			}
		})();
	}, [config, tabs, translatorFeatures]);

	// Render content

	let content: ReactNode;
	if (error !== undefined) {
		content = (
			<div className={cnPopupWindow('ErrorMessage', { plainText: true })}>
				{error}
			</div>
		);
	} else if (tabs !== undefined && activeTabId !== undefined && panes !== null) {
		content = (
			<>
				<div className={cnPopupWindow('Tabs')}>
					<TabsMenu
						className={cnPopupWindow('TabsMenu')}
						layout="horizontal"
						size="m"
						view="motion"
						tabs={tabs.map(({ id }) => ({
							id,
							content: getMessage(`popup_tab_${id}`),
						}))}
						activeTab={activeTabId}
						setActiveTab={setActiveTab}
					/>
				</div>

				<div className={cnPopupWindow('Content')}>
					<PopupWindowContext.Provider value={{ activeTab: activeTabId }}>
						<TabsPanes panes={panes} activePane={activeTabId} renderAll />
					</PopupWindowContext.Provider>
				</div>
			</>
		);
	} else {
		content = <Loader className={cnPopupWindow('Loader')} />;
	}

	const contentStyle = useMemo(
		() => ({ minWidth: minWidth !== undefined ? minWidth + 'px' : undefined }),
		[minWidth],
	);

	return (
		<div className={cnPopupWindow()}>
			<div className={cnPopupWindow('Header')}>
				<div className={cnPopupWindow('Logo')}>
					<LogoElement />
				</div>
				<div className={cnPopupWindow('HeaderMenu')}>
					<Button
						as="a"
						type="link"
						url="/pages/dictionary/dictionary.html"
						target="__blank"
						title={getMessage('dictionary_pageTitle')}
						iconRight={DictionaryIcon}
						view="clear"
					/>
					<Button
						as="a"
						type="link"
						url="/pages/options/options.html"
						target="__blank"
						title={getMessage('settings_pageTitle')}
						iconRight={SettingsIcon}
						view="clear"
					/>
				</div>
			</div>
			<div style={contentStyle}>{content}</div>
		</div>
	);
};
