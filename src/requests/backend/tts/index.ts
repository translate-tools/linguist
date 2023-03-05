import { getSpeakersFactory } from './getSpeakers';
import { getTTSFactory } from './getTTS';

export const ttsRequestHandlers = [getTTSFactory, getSpeakersFactory];
