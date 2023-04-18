// Scroll fix for https://bugzilla.mozilla.org/show_bug.cgi?id=1474932
import { XMutationObserver } from '../../lib/XMutationObserver';
import { XResizeObserver } from '../../lib/XResizeObserver';

import './scrollfix.css';

// TODO: rewrite this. It not clearly
/**
 * Add inner indent in blocks with scroll to fix scroll overlapping in firefox
 */
function observeScrollfix() {
	const classNamePrefix = '';
	const className = classNamePrefix + 'scrollFix';
	const indentR = `${className}__indent-right`;
	const indentL = `${className}__indent-left`;
	const indentB = `${className}__indent-bottom`;

	// Run only in firefox
	if (navigator.userAgent.indexOf('Firefox') === -1) return;

	// Dependencies
	const store = new Set<Element>();
	const resizeObserver = new XResizeObserver({
		sizeGetter: (node: Element) => ({
			height: node.scrollHeight,
			width: node.scrollWidth,
		}),
	});
	const mutationObserver = new XMutationObserver();

	// Calculate scroll size
	const elm = document.createElement('div');
	elm.style.all = 'reset';
	elm.style.position = 'fixed';
	elm.style.width = '100px';
	elm.style.height = '100px';
	elm.style.overflow = 'scroll';
	document.body.append(elm);
	const scrollWidth = elm.offsetWidth - elm.clientWidth;
	const scrollHeight = elm.offsetHeight - elm.clientHeight;
	elm.remove();

	// Set custom css properties
	document.documentElement.style.setProperty(
		`--${className}-scrollX`,
		scrollWidth + 'px',
	);
	document.documentElement.style.setProperty(
		`--${className}-scrollY`,
		scrollHeight + 'px',
	);

	// Handlers
	function resizeHandler(node: Element) {
		const isRtl = getComputedStyle(node).direction == 'rtl';
		const scrollX = node.scrollWidth - node.clientWidth > 0;
		const scrollY = node.scrollHeight - node.clientHeight > 0;

		node.classList.toggle(indentR, scrollY && !isRtl);
		node.classList.toggle(indentL, scrollY && isRtl);
		node.classList.toggle(indentB, scrollX);
	}

	function addHandler(node: Element) {
		if (store.has(node)) return;

		store.add(node);
		resizeObserver.addHandler(node, resizeHandler);
	}

	function rmHandler(node: Element) {
		if (!store.has(node)) return;
		store.delete(node);
		resizeObserver.deleteHandler(node, resizeHandler);
	}

	// Detect & apply
	document.documentElement.querySelectorAll('.' + className).forEach(addHandler);

	// For dynamic actions
	mutationObserver.addHandler('elementAdded', (evt) => {
		const elm = evt.target;
		if (elm instanceof Element) {
			if (!elm.classList || !elm.classList.contains(className)) return;
			addHandler(elm);
		}
	});
	mutationObserver.addHandler('elementRemoved', (evt) => {
		const elm = evt.target;
		if (elm instanceof Element) {
			if (!elm.classList || !elm.classList.contains(className)) return;
			rmHandler(elm);
		}
	});
	mutationObserver.addHandler('changeAttribute', (evt) => {
		const elm = evt.target;
		if (elm instanceof Element) {
			if (!store.has(elm)) return;
			if (!elm.classList || !elm.classList.contains(className)) rmHandler(elm);
		}
	});
	mutationObserver.observe(document.body);
}

const isNeedFix = /firefox/i.test(navigator.userAgent);
let isRun = false;

if (isNeedFix && !isRun) {
	isRun = true;
	if (document.readyState == 'loading') {
		document.addEventListener('DOMContentLoaded', observeScrollfix);
	} else {
		observeScrollfix();
	}
}
