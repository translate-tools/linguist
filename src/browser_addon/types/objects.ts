import { ITranslator } from '../../core/types/Translator';

import { ClassObject } from './utils';

// TODO: set static members from abstract class or from special interface who define it
export type TranslatorClass = ClassObject<ITranslator>;
