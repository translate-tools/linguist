import { getCustomSpeakersFactory } from './getCustomSpeakers';
import { getSpeakersFactory } from './getSpeakers';
import { getTTSFactory } from './getTTS';
import { addCustomSpeakerFactory } from './addCustomSpeaker';
import { deleteCustomSpeakerFactory } from './deleteCustomSpeaker';
import { updateCustomSpeakerFactory } from './updateCustomSpeaker';

export const ttsRequestHandlers = [
	getTTSFactory,
	getSpeakersFactory,
	getCustomSpeakersFactory,
	addCustomSpeakerFactory,
	deleteCustomSpeakerFactory,
	updateCustomSpeakerFactory,
];
