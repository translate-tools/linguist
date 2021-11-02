import React from 'react';
import { AbstractAugment } from '../AbstractAugment';
import { EmbeddedControlPanel as EmbeddedControlPanelComponent } from './EmbeddedControlPanel';

import { ShadowDOMContainerManager } from '../../lib/ShadowDOMContainerManager';

/**
 * Control panel for smartphones
 */
export class EmbeddedControlPanel extends AbstractAugment {
	private shadowRoot = new ShadowDOMContainerManager({
		styles: ['common.css', 'contentscript.css'],
	});

	enable() {
		this.shadowRoot.createRootNode();
		this.shadowRoot.mountComponent(<EmbeddedControlPanelComponent />);
	}

	disable() {
		this.shadowRoot.removeRootNode();
	}
}
