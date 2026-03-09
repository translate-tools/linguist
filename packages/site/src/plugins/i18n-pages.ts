import Mustache from 'mustache';
import { Plugin } from '@docusaurus/types';

import { LocalesController } from '../i18n/LocalesController';

const getPageUrl = (template: string, locale?: string) => {
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
	) =>
	(): Plugin => {
		return {
			name: 'i18n-pages',

			getPathsToWatch() {
				return routes.map((route) => `${route.i18n.localesDir}/**/*.json`);
			},

			async contentLoaded({ actions }) {
				const { addRoute, createData } = actions;

				for (const { url, pageComponent, i18n } of routes) {
					const locales = new LocalesController(i18n.localesDir);

					// Create pages
					for (const locale of locales.getSupportedLanguages()) {
						const isDefaultLocale = locale === i18n.defaultLocale;

						const localeData = locales.getI18nContext({
							language: locale,
							namespaces: i18n.namespaces,
							getAltPath(language) {
								return getPageUrl(
									url,
									isDefaultLocale ? language : undefined,
								);
							},
						});
						const i18nContentPath = await createData(
							`i18n/${locale}/${i18n.namespaces.join('-')}.json`,
							localeData,
						);

						addRoute({
							path: getPageUrl(url, locale),
							component: pageComponent,
							modules: {
								i18n: i18nContentPath,
							},
						});

						if (isDefaultLocale) {
							addRoute({
								path: getPageUrl(url),
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
