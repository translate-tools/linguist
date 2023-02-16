import { SelectTranslatorManager } from './SelectTranslatorManager';

export class SelectTranslatorController {
	private manager: SelectTranslatorManager;
	constructor(manager: SelectTranslatorManager) {
		this.manager = manager;
	}

	public translateSelectedText() {
		const selectTranslator = this.manager.getSelectTranslator();
		if (selectTranslator === null) return;
		if (selectTranslator.isRun()) {
			selectTranslator.translateSelectedText();
		}
	}
}
