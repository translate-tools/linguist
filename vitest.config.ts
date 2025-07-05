import { readFileSync } from 'fs';
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

const testTargets = (process.env.TEST_TARGETS ?? '').split(',');

export default defineConfig({
	plugins: [
		{
			name: 'vite-plugin-string-import',
			enforce: 'pre',
			load(id) {
				const extensions = ['.txt'];
				if (extensions.some((ext) => id.endsWith(ext))) {
					const sqlContent = readFileSync(resolve(id), 'utf-8');
					return `export default ${JSON.stringify(sqlContent)};`;
				}
			},
		},
	],
	test: {
		exclude: testTargets.includes('all')
			? []
			: [
				...(testTargets.includes('integration')
					? []
					: ['**/*.integration.test.ts']),
			  ],
		globals: true,
		environment: 'jsdom',
	},
});
