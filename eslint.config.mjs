// eslint.config.js
import { globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import { readFileSync } from 'fs';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import cspellPlugin from '@cspell/eslint-plugin';
import eslint from '@eslint/js';

const readLinesInFile = (file) => readFileSync(file, { encoding: 'utf8' }).split('\n');

export default tseslint.config(
	eslint.configs.recommended,
	tseslint.configs.strict,
	tseslint.configs.strictTypeChecked,
	tseslint.configs.stylistic,
	tseslint.configs.stylisticTypeCheckedOnly,
	tseslint.configs.recommendedTypeChecked,
	globalIgnores([
		'**/*.test.ts',
		// Use ignore rules from `.prettierignore`
		...readLinesInFile('.prettierignore').filter(
			(rule) => rule && !rule.startsWith('#'),
		),
	]),

	// Base rules
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
		plugins: {
			import: importPlugin,
			'unused-imports': unusedImports,
			'simple-import-sort': simpleImportSort,
			'@cspell': cspellPlugin,
		},
		settings: {
			'import/resolver': {
				typescript: {
					alwaysTryTypes: true,
					project: './tsconfig.json',
				},
			},
		},
		rules: {
			// Typos
			'@cspell/spellchecker': [
				'warn',
				{
					cspell: {
						words: readLinesInFile('words.txt').filter(
							(word) => word && !word.startsWith('#'),
						),
					},
				},
			],

			// Imports
			'import/no-useless-path-segments': ['error', { noUselessIndex: true }],
			'import/no-unresolved': ['error', { ignore: ['^vitest/config'] }],
			'import/export': 'off',
			'import/namespace': 'warn',
			'import/no-duplicates': ['error', { 'prefer-inline': true }],
			'import/newline-after-import': ['error', { count: 1 }],

			'unused-imports/no-unused-imports': 'error',
			'simple-import-sort/imports': [
				'error',
				{
					// docs: https://github.com/lydell/eslint-plugin-simple-import-sort#custom-grouping
					groups: [
						// Side effect imports.
						['^\\u0000'],
						// Node.js builtins prefixed with `node:`.
						['^node:'],
						// Packages.
						// Things that start with a letter (or digit or underscore), or `@` followed by a letter.
						['^react', '^\\w', '^@\\w'],
						// Absolute imports and other imports such as Vue-style `@/foo`.
						// Anything not matched in another group.
						['^'],
						// Relative imports.
						['^../../'],
						// Anything that starts with a dot.
						['^../', '^./', '^\\.'],
						// Global CSS files at bottom
						['\\.css$'],
					],
				},
			],

			// Types
			// Disabled, because force programmers to cast anything to `String()` with no profit
			'@typescript-eslint/restrict-template-expressions': 'off',
			// Disabled, since case with `or, if empty` is too frequent
			'@typescript-eslint/prefer-nullish-coalescing': 'off',
			// Disabled, since conflict with many cases where third party property is not in camelCase
			'@typescript-eslint/dot-notation': 'off',
			// Disabled, because replaced `type` to `interface` and it makes type is incompatible with an `Record`/object
			'@typescript-eslint/consistent-type-definitions': 'off',
			'@typescript-eslint/prefer-readonly': 'error',
			'class-methods-use-this': [
				'error',
				{
					exceptMethods: ['getLengthLimit', 'getRequestsTimeout'],
				},
			],
			'@typescript-eslint/no-empty-object-type': [
				'error',
				{
					allowObjectTypes: 'always',
				},
			],
			'@typescript-eslint/no-use-before-define': 'error',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					args: 'all',
					argsIgnorePattern: '^_',
					caughtErrors: 'all',
					caughtErrorsIgnorePattern: '^_',
					destructuredArrayIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					ignoreRestSiblings: true,
				},
			],

			// TODO: remove style comments that may have conflicts with prettier
			// Style
			'function-call-argument-newline': ['error', 'consistent'],
			'no-var': 'error',
			'no-bitwise': 'error',
			'no-multi-spaces': 'error',
			'no-multiple-empty-lines': 'error',
			'space-in-parens': 'error',
			semi: 'error',
			'prefer-const': 'error',
			'no-use-before-define': 'off',
			camelcase: [
				'error',
				{
					allow: ['^UNSAFE_', '^UNSTABLE_'],
				},
			],
			'arrow-parens': ['error', 'always'],
			'operator-linebreak': [
				'error',
				'after',
				{
					overrides: {
						'?': 'before',
						':': 'before',
					},
				},
			],
			'space-before-function-paren': [
				'error',
				{
					asyncArrow: 'always',
					anonymous: 'never',
					named: 'never',
				},
			],
		},
	},

	// Prevent conflicts with perrier
	prettier,

	// Pure JS
	{
		files: ['**/*.js', '*.{js,mjs,cjs}'],
		extends: [tseslint.configs.disableTypeChecked],
		rules: {
			'@typescript-eslint/no-require-imports': 'off',
		},
	},

	// React related
	{
		files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
		extends: [
			react.configs.flat.recommended,
			reactHooks.configs['recommended-latest'],
		],
		languageOptions: {
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
			},
			globals: {
				...globals.browser,
			},
		},
		rules: {
			// ... any rules you want
			'react/jsx-uses-react': 'error',
			'react/jsx-uses-vars': 'error',

			// TODO: find option for specify immutable objects for improve consistency
			// for example in `src/hooks/useLiveRef.ts` required as deps a `forceUpdate`
			// but setter from `useState` is never required
			'react-hooks/exhaustive-deps': [
				'warn',
				{
					// custom hooks with deps
					additionalHooks:
						'(useEqualMemo|useImmutableCallback|useIsomorphicLayoutEffect)',
				},
			],
		},
		// ... others are omitted for brevity
	},
);
