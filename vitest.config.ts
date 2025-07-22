import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const testTargets = (process.env.TEST_TARGETS ?? '').split(',');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
	plugins: [
		{
			name: 'vite-plugin-string-import',
			enforce: 'pre',
			load(id) {
				const extensions = ['.txt'];
				if (extensions.some((ext) => id.endsWith(ext))) {
					const sqlContent = readFileSync(path.resolve(id), 'utf-8');
					return `export default ${JSON.stringify(sqlContent)};`;
				}

				return;
			},
		},
	],
	test: {
		exclude: [
			'**/node_modules/**',

			// Optional targets
			...(testTargets.includes('all')
				? []
				: [
						...(testTargets.includes('integration')
							? []
							: ['**/*.integration.test.ts']),
					]),
		],
		globals: true,
		environment: 'jsdom',
		setupFiles: [
			path.join(__dirname, 'test/setupFiles/jest.js'),
			'jest-localstorage-mock',
			'fake-indexeddb/auto',
			path.join(__dirname, 'test/setupFiles/webextension.js'),
		],
	},
});
