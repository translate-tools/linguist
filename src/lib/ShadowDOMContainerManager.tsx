import React from 'react';
import ReactDOM from 'react-dom';
import root from 'react-shadow';
import browser from 'webextension-polyfill';

// Set position explicitly
const rootContainerStyles = {
	all: 'unset',
	position: 'absolute',
	top: 0,
	left: 0,
} satisfies React.CSSProperties;

/**
 * Shadow DOM container manager
 */
export class ShadowDOMContainerManager {
	private root: HTMLElement | null = null;

	private readonly styles: string[];

	constructor(options?: { styles?: string[] }) {
		const { styles } = options ?? {};
		this.styles = styles ?? [];
	}

	public createRootNode() {
		// Skip
		if (this.root !== null) return this.root;

		// Create and insert root node
		this.root = document.createElement('div');
		document.body.appendChild(this.root);

		// Reset all styles
		for (const style of Object.entries(rootContainerStyles)) {
			const [name, value] = style;
			this.root.style.setProperty(name, String(value));
		}

		return this.root;
	}

	public removeRootNode() {
		// Skip
		if (this.root === null) return;

		this.root.remove();
		this.root = null;
	}

	public getRootNode() {
		return this.root;
	}

	public mountComponent = (child?: React.ReactNode) => {
		// Skip when root node is not exist
		if (this.root === null) return;

		// #123 attach root node again on the page, for cases when whole DOM been replaced
		if (!document.body.contains(this.root)) {
			document.body.appendChild(this.root);
		}

		ReactDOM.render(
			<root.div style={{ ...rootContainerStyles }} mode="closed">
				{/* Include styles and scripts */}
				{this.styles.map((path, index) => (
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

	public unmountComponent = () => {
		if (this.root !== null) {
			ReactDOM.unmountComponentAtNode(this.root);
		}
	};
}
