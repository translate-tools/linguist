import { Store } from 'effector';

// NOTE: probably should make factory builder which control update props and rebuild factories which require changed props

import { Background } from '../modules/Background';
import { ObservableAsyncStorage } from '../modules/ConfigStorage/ConfigStorage';

import { AppConfigType } from '../types/runtime';

import { PageTranslator } from '../modules/PageTranslator/PageTranslator';
import { SelectTranslator } from '../modules/SelectTranslator';
import { TranslatorClass } from '@translate-tools/core/types/Translator';

export type RequestHandlerFactoryProps = {
	config: ObservableAsyncStorage<AppConfigType>;
	bg: Background;
	translatorModules: Record<string, TranslatorClass>;
};

export type RequestHandlerFactory = (props: RequestHandlerFactoryProps) => () => void;

export type ClientRequestHandlerFactoryProps = {
	pageTranslator: PageTranslator;
	selectTranslatorRef: { value: SelectTranslator | null };
	$config: Store<AppConfigType>;
};

export type ClientRequestHandlerFactory = (
	props: ClientRequestHandlerFactoryProps,
) => () => void;
