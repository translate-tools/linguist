import React, { FC, useEffect, useRef } from 'react';
import { editor, languages } from 'monaco-editor-core/esm/vs/editor/editor.api';

import { isMobileBrowser } from '../../../../../../lib/browser';

import { cnEditor } from '../Editor';
import { language as tslanguage } from './languages/typescript';

// Configure monako
languages.register({
	id: 'javascript',
	extensions: ['.js', '.es6', '.jsx', '.mjs', '.cjs'],
	firstLine: '^#!.*\\bnode',
	filenames: ['jakefile'],
	aliases: ['JavaScript', 'javascript', 'js'],
	mimetypes: ['text/javascript'],
});

languages.setMonarchTokensProvider('javascript', tslanguage);

export type MonacoEditorProps = {
	value: string;
	setValue?: (value: string) => void;
};

/**
 * Rich editor from VSCode
 * See docs: https://microsoft.github.io/monaco-editor/docs.html
 */
export const MonacoEditor: FC<MonacoEditorProps> = ({ value, setValue }) => {
	const setValueRef = useRef(setValue);
	setValueRef.current = setValue;

	// Init
	const editorContainerRef = useRef<HTMLDivElement>(null);
	const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
	useEffect(() => {
		const editorContainer = editorContainerRef.current;
		if (!editorContainer) return;

		const monacoEditor = editor.create(editorContainer, {
			value,
			language: 'javascript',
			automaticLayout: true,
			minimap: isMobileBrowser()
				? {
					enabled: false,
				  }
				: undefined,
		});

		editorRef.current = monacoEditor;

		// Update value
		monacoEditor.onDidChangeModelContent((evt) => {
			if (evt.changes.length === 0) return;
			if (setValueRef.current) {
				setValueRef.current(monacoEditor.getValue());
			}
		});

		// Ignore keys while focus on editor
		const onKeyPress = (evt: KeyboardEvent) => {
			if (monacoEditor.hasWidgetFocus()) {
				evt.stopPropagation();
			}
		};

		editorContainer.addEventListener('keydown', onKeyPress);
		editorContainer.addEventListener('keyup', onKeyPress);

		return () => {
			editorContainer.removeEventListener('keydown', onKeyPress);
			editorContainer.removeEventListener('keyup', onKeyPress);

			monacoEditor.dispose();
		};

		// Hook runs only once to initialize component
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Update value
	useEffect(() => {
		const editor = editorRef.current;
		if (!editor) return;

		if (editor.getValue() !== value) {
			editor.setValue(value);
		}
	});

	return <div className={cnEditor('Code')} ref={editorContainerRef}></div>;
};
