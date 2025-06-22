import { BaseTranslator } from '@translate-tools/core/translators/BaseTranslator';

import { CustomTranslatorInfo } from '../../../offscreen-documents/translator';
import { customTranslatorsApi } from '../../../requests/offscreen/customTranslators';

export class CustomTranslatorController extends BaseTranslator {
	private readonly config;
	constructor(code: string, { info, id }: { info: CustomTranslatorInfo; id?: string }) {
		super();
		this.config = { code, info, id };
	}
	private translatorId: Promise<string> | null = null;
	private init() {
		if (this.translatorId === null) {
			this.translatorId = Promise.resolve().then(async () => {
				const { id } = await customTranslatorsApi.create({
					code: this.config.code,
					uniqueName: this.config.id,
				});
				return id;
			});
		}
		return this.translatorId;
	}
	public translate(...args: any[]): Promise<string> {
		return this.init().then((translatorId) =>
			customTranslatorsApi.call({
				id: translatorId,
				method: 'translate',
				args: args,
			}),
		);
	}
	public translateBatch(...args: any[]): Promise<string[]> {
		return this.init().then((translatorId) =>
			customTranslatorsApi.call({
				id: translatorId,
				method: 'translateBatch',
				args: args,
			}),
		);
	}
	public getLengthLimit(): number {
		return this.config.info.maxTextLength;
	}
	public getRequestsTimeout(): number {
		return this.config.info.timeout;
	}
}
