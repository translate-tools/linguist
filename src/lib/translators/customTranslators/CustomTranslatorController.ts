import { BaseTranslator } from '@translate-tools/core/translators/BaseTranslator';

import { customTranslatorsApi } from '../../../requests/offscreen/customTranslators';

export class CustomTranslatorController extends BaseTranslator {
	private readonly translatorId: Promise<string>;
	constructor(code: string) {
		super();

		// TODO: fix order of code loading to remove timeout
		// TODO: init translator lazy, after first call for translation
		this.translatorId = Promise.resolve().then(async () => {
			await new Promise((res) => setTimeout(res, 1000));

			return customTranslatorsApi.create({ code });
		});
	}

	public translate(...args: any[]): Promise<string> {
		return this.translatorId.then((translatorId) =>
			customTranslatorsApi.call({
				id: translatorId,
				method: 'translate',
				args: args,
			}),
		);
	}

	public translateBatch(...args: any[]): Promise<string[]> {
		return this.translatorId.then((translatorId) =>
			customTranslatorsApi.call({
				id: translatorId,
				method: 'translateBatch',
				args: args,
			}),
		);
	}

	public getLengthLimit(): number {
		return 5000;
	}

	public getRequestsTimeout(): number {
		return 50;
	}

	// TODO: load features info for custom translator before create constructor and then override default parameters
	public static getSupportedLanguages = () => {
		return ['en', 'ru', 'de'];
	};
}
