import type { Config } from '@docusaurus/types';

const config: Config = {
	title: 'Linguist Translate',
	tagline: 'Privacy focused translation',
	favicon: 'favicon.svg',

	// Set the production url of your site here
	url: 'https://linguister.io',
	// Set the /<baseUrl>/ pathname under which your site is served
	// For GitHub pages deployment, it is often '/<projectName>/'
	baseUrl: '/',

	presets: [
		[
			'@docusaurus/preset-classic',
			{
				docs: false,
				// docs: {
				// 	path: '../docs',
				// 	include: ['*.md', '*.mdx'],
				// },
				blog: {
					blogTitle: 'Linguist Translate blog',
					blogDescription:
						'A blog of Linguist Translate, the privacy focused translation in your browser',
					postsPerPage: 'ALL',
					blogSidebarCount: 0,
				},
			},
		],
	],
} satisfies Config;

export default config;
