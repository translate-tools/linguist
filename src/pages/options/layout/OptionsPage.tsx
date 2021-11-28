import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { cn } from '@bem-react/classname';
import { get, isEqual } from 'lodash';

import { AppConfigType } from '../../../types/runtime';

import { getMessage } from '../../../lib/language';
import { openFileDialog, readAsText, saveFile } from '../../../lib/files';

// Requests
import { clearCache as clearCacheReq } from '../../../requests/backend/clearCache';
import { getConfig } from '../../../requests/backend/getConfig';
import { getTranslatorModules } from '../../../requests/backend/getTranslatorModules';
import { ping } from '../../../requests/backend/ping';
import { resetConfig as resetConfigReq } from '../../../requests/backend/resetConfig';
import { setConfig as setConfigReq } from '../../../requests/backend/setConfig';
import { updateConfig as updateConfigReq } from '../../../requests/backend/updateConfig';

import { Button } from '../../../components/Button/Button.bundle/universal';
import { LayoutFlow } from '../../../components/LayoutFlow/LayoutFlow';
import { Page } from '../../../layouts/Page/Page';
import { PageMessages } from '../../../layouts/Page/Messages/PageMessages';

import { generateTree } from './OptionsPage.utils/generateTree';
import { useMessageBroker } from '../../../lib/hooks/useMessageBroker';
import { isMobileBrowser } from '../../../lib/browser';
import { OptionsGroup, OptionsTree } from './OptionsTree/OptionsTree';
import { PageSection } from './PageSection/PageSection';

import './OptionsPage.css';

export const cnOptionsPage = cn('OptionsPage');

type Errors = null | Record<string, string>;

interface OptionsPageProps {
	messageHideDelay?: number;
}

export const OptionsPage: FC<OptionsPageProps> = ({ messageHideDelay }) => {
	const [loaded, setLoaded] = useState<boolean>(false);

	const [config, setConfig] = useState<AppConfigType | undefined>();
	const [errors, setErrors] = useState<Errors>(null);
	const [modifiedConfig, setModifiedConfig] = useState<null | Record<string, any>>(
		null,
	);
	const [configTree, setConfigTree] = useState<OptionsGroup[] | undefined>();

	const [clearCacheProcess, setClearCacheProcess] = useState<boolean>(false);
	const [translatorModules, setTranslatorModules] = useState<
		Record<string, string> | undefined
	>();

	const updateConfig = useCallback(
		() =>
			getConfig().then(async (config) => {
				const translatorModules = await getTranslatorModules();
				setLoaded(true);
				setConfig(config);
				setTranslatorModules(translatorModules);
			}),
		[],
	);

	//
	// Messages broker
	//

	const { messages, addMessage, deleteMessage, haltMessages } = useMessageBroker({
		hideDelay: messageHideDelay,
	});

	const handleError = useCallback(
		(error: any) => {
			if (typeof error === 'string') {
				addMessage(error, 'error');
			} else if (error instanceof Error) {
				addMessage(error.message, 'error');
			} else {
				const unknownMessage = getMessage('message_unknownError');
				addMessage(unknownMessage, 'error');

				console.error(error);
				console.error('Unknown error object above ^');
			}
		},
		[addMessage],
	);

	//
	// Config control
	//

	const importConfig = useCallback(() => {
		openFileDialog()
			.then((files) => {
				if (files === null) return null;

				return readAsText(files[0]);
			})
			.then((rawData) => {
				if (rawData === null) return;

				try {
					const configData = JSON.parse(rawData);

					setConfigReq(configData)
						.then(updateConfig)
						.then(() =>
							addMessage(
								getMessage('settings_message_importConfig_success'),
								'info',
							),
						)
						.catch(handleError);
				} catch (error) {
					addMessage(
						getMessage('settings_message_importConfig_invalidFile'),
						'error',
					);
				}
			});
	}, [addMessage, handleError, updateConfig]);

	const exportConfig = useCallback(() => {
		const dump = JSON.stringify(config);
		const file = new Blob([dump], { type: 'application/json' });

		saveFile(file, `linguist-config_${new Date().getTime()}.json`);
	}, [config]);

	const resetConfig = useCallback(() => {
		const isConfirmed = confirm(getMessage('settings_message_resetConfig_confirm'));
		if (!isConfirmed) return;

		resetConfigReq()
			.then(updateConfig)
			.then(() =>
				addMessage(getMessage('settings_message_resetConfig_success'), 'info'),
			)
			.catch(handleError);
	}, [addMessage, handleError, updateConfig]);

	//
	// Changes control
	//

	const cancelChanges = useCallback(() => {
		setModifiedConfig(null);
		setErrors(null);
	}, []);

	const saveChanges = useCallback(() => {
		// Skip empty changes
		if (modifiedConfig === null) return;

		updateConfigReq(modifiedConfig)
			.then(async ({ success, errors }) => {
				if (!success) {
					setErrors(errors);
					return;
				}

				const config = await getConfig();

				setConfig(config);
				setModifiedConfig(null);
				setErrors(null);

				addMessage(getMessage('settings_message_saveChanges_success'), 'info');
			})
			.catch(handleError);
	}, [addMessage, handleError, modifiedConfig]);

	//
	// Config actions
	//

	const clearCache = useCallback(() => {
		setClearCacheProcess(true);
		clearCacheReq()
			.then(() =>
				addMessage(getMessage('settings_message_clearCache_success'), 'info'),
			)
			.catch(handleError)
			.finally(() => setClearCacheProcess(false));
	}, [addMessage, handleError]);

	//
	// Utils
	//

	const setOptionValue = useCallback(
		(inputPath: string, value: any) => {
			// Copy current object
			let modifiedConfigLocal: Record<string, any> | null = {};
			for (const path in modifiedConfig) {
				const configItem = get(config, path);

				// Copy only if it different from config value
				if (!isEqual(configItem, modifiedConfig[path])) {
					modifiedConfigLocal[path] = modifiedConfig[path];
				}
			}

			// Set value if not exist equal
			const modConfigItem = get(modifiedConfig, inputPath);
			if (!isEqual(modConfigItem, value)) {
				const configItem = get(config, inputPath);
				if (isEqual(configItem, value)) {
					delete modifiedConfigLocal[inputPath];
				} else {
					modifiedConfigLocal[inputPath] = value;
				}
			}

			if (Object.keys(modifiedConfigLocal).length === 0) {
				modifiedConfigLocal = null;
			}

			setModifiedConfig(modifiedConfigLocal);

			// Remove error for option
			if (errors !== null && inputPath in errors) {
				let errorsLocal: Errors = { ...errors };

				delete errorsLocal[inputPath];
				if (Object.keys(errorsLocal).length === 0) {
					errorsLocal = null;
				}

				setErrors(errorsLocal);
			}
		},
		[config, errors, modifiedConfig],
	);

	// Init
	useEffect(() => {
		ping().then(updateConfig);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Update config tree
	useEffect(() => {
		const configTree = generateTree({
			clearCacheProcess,
			translatorModules,
			clearCache,
		});

		setConfigTree(configTree);
	}, [translatorModules, clearCacheProcess, clearCache]);

	//
	// Render
	//

	const isMobile = useMemo(() => isMobileBrowser(), []);

	if (!loaded || config === undefined || configTree === undefined) {
		return <Page loading />;
	}

	const editMode = modifiedConfig !== null;
	return (
		<Page>
			<div className={cnOptionsPage()}>
				<div className={cnOptionsPage('Page', { editMode })}>
					<PageSection title={getMessage('settings_pageTitle')} level={1}>
						<div
							className={cnOptionsPage('Container', {}, [
								cnOptionsPage('IndentMixin', { horizontal: true }),
							])}
						>
							<LayoutFlow
								direction={isMobile ? 'vertical' : 'horizontal'}
								indent="l"
							>
								<Button
									view="action"
									onPress={importConfig}
									width={isMobile ? 'max' : undefined}
								>
									{getMessage('settings_button_import')}
								</Button>
								{!isMobile && (
									<Button
										view="action"
										onPress={exportConfig}
										width={isMobile ? 'max' : undefined}
									>
										{getMessage('settings_button_export')}
									</Button>
								)}
								<Button
									view="action"
									onPress={resetConfig}
									width={isMobile ? 'max' : undefined}
								>
									{getMessage('settings_button_reset')}
								</Button>
							</LayoutFlow>
						</div>

						<OptionsTree
							tree={configTree}
							errors={errors ?? undefined}
							config={config}
							modifiedConfig={modifiedConfig}
							setOptionValue={setOptionValue}
						/>
					</PageSection>

					<PageMessages
						messages={messages}
						haltMessages={haltMessages}
						deleteMessage={deleteMessage}
					/>
				</div>

				{editMode ? (
					<div
						className={cnOptionsPage('ConfirmMenu', {}, [
							cnOptionsPage('IndentMixin', { horizontal: true }),
						])}
					>
						<Button view="action" onPress={saveChanges}>
							{getMessage('settings_button_saveChanges')}
						</Button>
						<Button view="default" onPress={cancelChanges}>
							{getMessage('settings_button_cancel')}
						</Button>
					</div>
				) : undefined}
			</div>
		</Page>
	);
};
