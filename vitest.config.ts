import { readFileSync } from 'fs';
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

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
		globals: true,
		environment: 'jsdom',
	},
});
