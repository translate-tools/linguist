import { getTTSFactory } from './getTTS';
import { getTTSLanguagesFactory } from './getTTSLanguages';
import { getCustomSpeakersFactory } from './getCustomSpeakers';
import { getSpeakersFactory } from './getSpeakers';
import { addCustomSpeakerFactory } from './addCustomSpeaker';
import { deleteCustomSpeakerFactory } from './deleteCustomSpeaker';
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
