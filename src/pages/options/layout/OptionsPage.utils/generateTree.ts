import { langCodes } from '@translate-tools/core/types/Translator';
import { getLanguageNameByCode, getMessage } from '../../../../lib/language';
import { OptionsGroup } from '../OptionsTree/OptionsTree';

type Options = {
	clearCacheProcess: boolean;
	translatorModules: Record<string, string> | undefined;
	clearCache: () => void;
};

// TODO: make helper for build options

// option({
// 	type: 'Checkbox',
// 	path: 'selectTranslator.showOriginalText',
// 	withText: true,
// 	withDescription: true,
// })

// checkbox({
// 	path: 'selectTranslator.showOriginalText',
// 	withText: true,
// 	withDescription: true,
// })

/**
 * Generate config tree for render with `OptionsTree`
 */
export const generateTree = ({
	clearCacheProcess,
	translatorModules,
	clearCache,
}: Options): OptionsGroup[] => {
	return [
		{
			title: getMessage('settings_option_commonSettings'),
			groupContent: [
				{
					title: getMessage('settings_option_userLanguage'),
					description: getMessage('settings_option_userLanguage_desc'),
					path: 'language',
					optionContent: {
						type: 'SelectList',
						options: langCodes
							// Remove repeated langs
							.filter((lang, idx, arr) => arr.indexOf(lang) === idx)
							.map((code) => ({
								id: code,
								content: getLanguageNameByCode(code),
							}))
							.sort(({ content: a }, { content: b }) =>
								a > b ? 1 : a < b ? -1 : 0,
							),
					},
				},
				{
					title: getMessage('settings_option_appIcon'),
					description: getMessage('settings_option_appIcon_desc'),
					path: 'appIcon',
					optionContent: {
						type: 'SelectList',
						options: ['auto', 'dark', 'light', 'color'].map((id) => ({
							id,
							content: getMessage(`settings_option_appIcon_item_${id}`),
						})),
					},
				},
			],
		},
		{
			title: getMessage('settings_option_translatePreferences'),
			groupContent: [
				translatorModules === undefined
					? undefined
					: {
						title: getMessage('settings_option_translatorModule'),
						groupContent: [
							{
								description: getMessage(
									'settings_option_translatorModule_desc',
								),
								path: 'translatorModule',
								optionContent: {
									type: 'SelectList',
									options: Object.keys(translatorModules).map(
										(value) => ({
											id: value,
											content: translatorModules[value],
										}),
									),
								},
							},
						],
					  },
				{
					title: getMessage('settings_option_translateScheduler'),
					groupContent: [
						{
							title: getMessage('settings_option_translateScheduler_delay'),
							description: getMessage(
								'settings_option_translateScheduler_delay_desc',
							),
							path: 'scheduler.translatePoolDelay',
							optionContent: {
								type: 'InputNumber',
							},
						},
						{
							title: getMessage(
								'settings_option_translateScheduler_retryLimit',
							),
							description: getMessage(
								'settings_option_translateScheduler_retryLimit_desc',
							),
							path: 'scheduler.translateRetryAttemptLimit',
							optionContent: {
								type: 'InputNumber',
							},
						},
					],
				},
				{
					title: getMessage('settings_option_cache'),
					groupContent: [
						{
							description: getMessage('settings_option_cache_enable_desc'),
							path: 'scheduler.useCache',
							optionContent: {
								type: 'Checkbox',
								text: getMessage('settings_option_cache_enable'),
							},
						},
						{
							description: getMessage(
								'settings_option_cache_ignoreCase_desc',
							),
							path: 'cache.ignoreCase',
							optionContent: {
								type: 'Checkbox',
								reverse: true,
								text: getMessage('settings_option_cache_ignoreCase'),
							},
						},
						{
							description: getMessage('settings_option_cache_clear_desc'),
							optionContent: {
								type: 'Button',
								text: getMessage('settings_option_cache_clear'),
								disabled: clearCacheProcess,
								action: clearCache,
							},
						},
					],
				},
			],
		},
		{
			title: getMessage('settings_option_pageTranslation'),
			groupContent: [
				{
					title: getMessage('settings_option_mainPreferences'),
					groupContent: [
						{
							description: getMessage(
								'settings_option_pageTranslation_lazyTranslate_desc',
							),
							path: 'pageTranslator.lazyTranslate',
							optionContent: {
								type: 'Checkbox',
								text: getMessage(
									'settings_option_pageTranslation_lazyTranslate',
								),
							},
						},
						{
							description: getMessage(
								'settings_option_pageTranslation_detectLanguageByContent_desc',
							),
							path: 'pageTranslator.detectLanguageByContent',
							optionContent: {
								type: 'Checkbox',
								text: getMessage(
									'settings_option_pageTranslation_detectLanguageByContent',
								),
							},
						},
						{
							path: 'pageTranslator.originalTextPopup',
							optionContent: {
								type: 'Checkbox',
								text: getMessage(
									'settings_option_pageTranslation_originalTextPopup',
								),
							},
						},
					],
				},
				{
					title: getMessage(
						'settings_option_pageTranslation_translatableAttributes',
					),
					groupContent: [
						{
							description: getMessage(
								'settings_option_pageTranslation_translatableAttributes_desc',
							),
							path: 'pageTranslator.translatableAttributes',
							optionContent: {
								type: 'InputMultilineFromArray',
							},
						},
					],
				},
				{
					title: getMessage('settings_option_pageTranslation_ignoredTags'),
					groupContent: [
						{
							description: getMessage(
								'settings_option_pageTranslation_ignoredTags_desc',
							),
							path: 'pageTranslator.ignoredTags',
							optionContent: {
								type: 'InputMultilineFromArray',
							},
						},
					],
				},
			],
		},
		{
			title: getMessage('settings_option_selectTranslation'),
			groupContent: [
				{
					title: getMessage('settings_option_mainPreferences'),
					groupContent: [
						{
							path: 'selectTranslator.enabled',
							optionContent: {
								type: 'Checkbox',
								text: getMessage(
									'settings_option_selectTranslation_enable',
								),
							},
						},
						{
							title: getMessage('settings_option_selectTranslation_mode'),
							path: 'selectTranslator.mode',
							optionContent: {
								type: 'SelectList',
								options: [
									'popupButton',
									'quickTranslate',
									'contextMenu',
								].map((id) => ({
									id,
									content: getMessage(
										`settings_option_selectTranslation_mode_item_${id}`,
									),
								})),
							},
						},
						{
							path: 'selectTranslator.disableWhileTranslatePage',
							optionContent: {
								type: 'Checkbox',
								text: getMessage(
									'settings_option_selectTranslation_disableWhileTranslatePage',
								),
							},
						},
						{
							description: getMessage(
								'settings_option_selectTranslation_showOnceForSelection_desc',
							),
							path: 'selectTranslator.showOnceForSelection',
							optionContent: {
								type: 'Checkbox',
								text: getMessage(
									'settings_option_selectTranslation_showOnceForSelection',
								),
							},
						},
						{
							description: getMessage(
								'settings_option_selectTranslation_strictSelection_desc',
							),
							path: 'selectTranslator.strictSelection',
							optionContent: {
								type: 'Checkbox',
								text: getMessage(
									'settings_option_selectTranslation_strictSelection',
								),
							},
						},
						{
							description: getMessage(
								'settings_option_selectTranslation_focusOnTranslateButton_desc',
							),
							path: 'selectTranslator.focusOnTranslateButton',
							optionContent: {
								type: 'Checkbox',
								text: getMessage(
									'settings_option_selectTranslation_focusOnTranslateButton',
								),
							},
						},
						{
							path: 'selectTranslator.showOriginalText',
							optionContent: {
								type: 'Checkbox',
								text: getMessage(
									'settings_option_selectTranslation_showOriginalText',
								),
							},
						},
					],
				},
				{
					title: getMessage(
						'settings_option_selectTranslation_header_languageChoice',
					),
					groupContent: [
						{
							path: 'selectTranslator.rememberDirection',
							optionContent: {
								type: 'Checkbox',
								text: getMessage(
									'settings_option_selectTranslation_rememberDirection',
								),
							},
						},
						{
							description: getMessage(
								'settings_option_selectTranslation_detectedLangFirst_desc',
							),

							path: 'selectTranslator.detectedLangFirst',
							optionContent: {
								type: 'Checkbox',
								text: getMessage(
									'settings_option_selectTranslation_detectedLangFirst',
								),
							},
						},
						{
							description: getMessage(
								'settings_option_selectTranslation_isUseAutoForDetectLang_desc',
							),
							path: 'selectTranslator.isUseAutoForDetectLang',
							optionContent: {
								type: 'Checkbox',
								text: getMessage(
									'settings_option_selectTranslation_isUseAutoForDetectLang',
								),
							},
						},
					],
				},
				{
					title: getMessage('settings_option_selectTranslation_modifiers'),
					groupContent: [
						{
							description: getMessage(
								'settings_option_selectTranslation_modifiers_desc',
							),
							path: 'selectTranslator.modifiers',
							optionContent: {
								type: 'CheckboxGroup',
								valueMap: ['ctrlKey', 'altKey', 'shiftKey', 'metaKey'],
								options: [
									{
										type: 'Checkbox',
										text: getMessage(
											'settings_option_selectTranslation_modifiers_key_ctrl',
										),
									},
									{
										type: 'Checkbox',
										text: getMessage(
											'settings_option_selectTranslation_modifiers_key_alt',
										),
									},
									{
										type: 'Checkbox',
										text: getMessage(
											'settings_option_selectTranslation_modifiers_key_shift',
										),
									},
									{
										type: 'Checkbox',
										text: getMessage(
											'settings_option_selectTranslation_modifiers_key_meta',
										),
									},
								],
							},
						},
					],
				},
				{
					title: getMessage(
						'settings_option_selectTranslation_timeoutForHideButton',
					),
					groupContent: [
						{
							description: getMessage(
								'settings_option_selectTranslation_timeoutForHideButton_desc',
							),
							path: 'selectTranslator.timeoutForHideButton',
							optionContent: {
								type: 'InputNumber',
							},
						},
					],
				},
				{
					title: getMessage('settings_option_selectTranslation_zIndex'),
					groupContent: [
						{
							description: getMessage(
								'settings_option_selectTranslation_zIndex_desc',
							),
							path: 'selectTranslator.zIndex',
							optionContent: {
								type: 'InputNumber',
							},
						},
					],
				},
			],
		},
		{
			title: getMessage('settings_option_textTranslator'),
			groupContent: [
				{
					title: getMessage('settings_option_mainPreferences'),
					groupContent: [
						{
							description: getMessage(
								'settings_option_textTranslator_rememberText_desc',
							),
							path: 'textTranslator.rememberText',
							optionContent: {
								type: 'Checkbox',
								text: getMessage(
									'settings_option_textTranslator_rememberText',
								),
							},
						},
						{
							path: 'textTranslator.spellCheck',
							optionContent: {
								type: 'Checkbox',
								text: getMessage(
									'settings_option_textTranslator_spellCheck',
								),
							},
						},
						{
							path: 'textTranslator.suggestLanguage',
							optionContent: {
								type: 'Checkbox',
								text: getMessage(
									'settings_option_textTranslator_suggestLanguage',
								),
							},
						},
						{
							description: getMessage(
								'settings_option_textTranslator_suggestLanguageAlways_desc',
							),
							path: 'textTranslator.suggestLanguageAlways',
							optionContent: {
								type: 'Checkbox',
								text: getMessage(
									'settings_option_textTranslator_suggestLanguageAlways',
								),
							},
						},
					],
				},
			],
		},

		{
			title: getMessage('settings_section_popup'),
			groupContent: [
				{
					title: getMessage('settings_option_pageTranslation'),
					groupContent: [
						{
							description: getMessage(
								'settings_option_popupTab_pageTranslator_showCounters_desc',
							),
							path: 'popupTab.pageTranslator.showCounters',
							optionContent: {
								type: 'Checkbox',
								text: getMessage(
									'settings_option_popupTab_pageTranslator_showCounters',
								),
							},
						},
					],
				},
			],
		},
	];
};
