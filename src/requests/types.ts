import { Store } from 'effector';
import { TranslatorClass } from '@translate-tools/core/types/Translator';

// NOTE: probably should make factory builder which control update props and rebuild factories which require changed props

import { Background } from '../modules/Background';
import { ObservableAsyncStorage } from '../modules/ConfigStorage/ConfigStorage';

import { AppConfigType } from '../types/runtime';

import { PageTranslationContext } from '../modules/ContentScript/PageTranslationContext';

export type RequestHandlerFactoryProps = {
	config: ObservableAsyncStorage<AppConfigType>;
	bg: Background;
	translatorModules: Record<string, TranslatorClass>;
};

export type RequestHandlerFactory = (props: RequestHandlerFactoryProps) => () => void;

export type ClientRequestHandlerFactoryProps = {
	$config: Store<AppConfigType>;
	pageTranslationContext: PageTranslationContext;
};

export type ClientRequestHandlerFactory = (
	props: ClientRequestHandlerFactoryProps,
) => () => void;
