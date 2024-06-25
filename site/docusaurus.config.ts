import type { Config } from '@docusaurus/types';

const config: Config = {
	title: 'Linguist Translate',
	tagline: 'Privacy focused translation',
	favicon: 'favicon.ico',

	// Set the production url of your site here
	url: 'https://linguister.io',
	// Set the /<baseUrl>/ pathname under which your site is served
	// For GitHub pages deployment, it is often '/<projectName>/'
	baseUrl: '/',

	presets: [
		[
			'@docusaurus/preset-classic',
			{
				docs: {
					path: '../docs',
					include: ['{*,**/*}.md', '{*,**/*}.mdx'],
				},
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

	themeConfig: {
		image: '/screenshots/page-translation.png',
		colorMode: {
			defaultMode: 'light',
			disableSwitch: true,
			respectPrefersColorScheme: true,
		},
		navbar: {
			logo: {
				alt: 'Linguist Translate',
				src: '/logo.svg',
				srcDark: 'img/logo_dark.svg',
				href: '/',
				target: '_self',
				width: 100,
			},
			items: [
				{
					to: '/blog',
					label: 'Blog',
					position: 'right',
					target: '_self',
				},
				{
					to: '/docs',
					label: 'Docs',
					position: 'right',
					target: '_self',
				},
				{
					href: 'https://github.com/translate-tools/linguist',
					label: 'GitHub',
					position: 'right',
					target: '_blank',
				},
			],
		},
		footer: {
			copyright: `Copyright © ${new Date().getFullYear()} FluidMinds team. Built with Docusaurus.`,
		},
	},
} satisfies Config;

export default config;
