import { addCustomSpeakerFactory } from './addCustomSpeaker';
import { deleteCustomSpeakerFactory } from './deleteCustomSpeaker';
import { getCustomSpeakersFactory } from './getCustomSpeakers';
import { getSpeakersFactory } from './getSpeakers';
import { getTTSFactory } from './getTTS';
import { getTTSLanguagesFactory } from './getTTSLanguages';
import { updateCustomSpeakerFactory } from './updateCustomSpeaker';

export const ttsRequestHandlers = [
	getTTSFactory,
	getTTSLanguagesFactory,
	getSpeakersFactory,
	getCustomSpeakersFactory,
	addCustomSpeakerFactory,
	deleteCustomSpeakerFactory,
	updateCustomSpeakerFactory,
];
