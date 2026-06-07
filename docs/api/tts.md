# Text to speech

A text to speech module (TTS) is used to speak any text.

## TTS API

The module must be implemented in the [custom module format](./custom-module.md).

The class must implement a `TTS` interface:

```ts
/**
 * Object with audio data
 */
type TTSAudioBuffer = {
	/**
	 * Audio MIME type
	 */
	type: string;

	/**
	 * Buffer contains audio bytes
	 */
	buffer: ArrayBuffer;
};

class TTS {
	/**
	 * Method that returns a buffer with audio to speak the text
	*/
	public getAudioBuffer(text: string, language: string) => Promise<TTSAudioBuffer>;

	/**
	 * Returns an array of supported languages as ISO 639-1 codes
	*/
	static getSupportedLanguages(): langCode[];

}
```

## Example

Example of a dummy TTS module. In your code, feel free to use HTTP requests to any URLs.

```js
class FakeTTS {
	getAudioBuffer = async (text, language) => {
		const dummyAudioUrl = 'https://github.com/translate-tools/linguist/blob/d447cceee59894303742449bbf24caf7c3668e99/src/app/Background/TTS/TTSManager/__tests__/sample.mp3?raw=true';

		const buffer = await fetch(dummyAudioUrl).then(r => r.arrayBuffer());
		return {
			type: 'audio/mpeg',
			buffer,
		};
	}

	static getSupportedLanguages() {
		return ['en', 'de', 'ja'];
	}
}

FakeTTS;
```