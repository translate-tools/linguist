import Mustache from 'mustache';
import { PluginModule } from '@docusaurus/types';

import { LocalesController } from '../i18n/LocalesController';

const compilePagePath = (template: string, locale?: string) => {
	return Mustache.render(template, { locale: locale ?? '' }).replaceAll(/\/{2,}/g, '/');
};

export default (
	routes: {
		url: string;
		pageComponent: string;
		i18n: {
			defaultLocale: string;
			localesDir: string;
			namespaces: string[];
		};
	}[],
): PluginModule => {
	return (context) => {
		return {
			name: 'i18n-pages',

			getPathsToWatch() {
				return [
					__filename,
					...routes.map((route) => `${route.i18n.localesDir}/**/*.json`),
				];
			},

			async contentLoaded({ actions }) {
				const { addRoute, createData } = actions;

				for (const { url: urlTemplate, pageComponent, i18n } of routes) {
					const locales = new LocalesController(i18n.localesDir);

					// Create pages
					for (const locale of locales.getSupportedLanguages()) {
						const isDefaultLocale = locale === i18n.defaultLocale;

						const localeData = locales.getI18nContext({
							language: locale,
							namespaces: i18n.namespaces,
							getAltPath(language) {
								const pagePath = compilePagePath(
									urlTemplate,
									isDefaultLocale ? language : undefined,
								);

								// Build path
								const { url, baseUrl } = context.siteConfig;

								const joinedPath = (baseUrl + pagePath).replaceAll(
									/\/{2,}/g,
									'/',
								);

								// Return
								const isDev = process.env.NODE_ENV === 'development';
								return isDev
									? joinedPath
									: new URL(joinedPath, url).toString();
							},
						});
						const i18nContentPath = await createData(
							`i18n/${locale}/${i18n.namespaces.join('-')}.json`,
							localeData,
						);

						addRoute({
							path: compilePagePath(urlTemplate, locale),
							component: pageComponent,
							modules: {
								i18n: i18nContentPath,
							},
						});

						if (isDefaultLocale) {
							addRoute({
								path: compilePagePath(urlTemplate),
								component: pageComponent,
								modules: {
									i18n: i18nContentPath,
								},
							});
						}
					}
				}
			},
		};
	};
};
