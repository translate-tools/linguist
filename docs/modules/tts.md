Text to speech module (TTS) are used by Linguist to speak text that user translate.

## TTS API

Code must have a translator class and this object must be the last object in the code.

```js
class MyTTS {
	// ...
}

// some other code may be after declaration
console.log('Hello world');

// last object in the code must be a translator
MyTTS;
```

### TTS class signature

```ts
/**
 * Object with audio data
 */
type TTSAudioBuffer = {
	/**
	 * Audio mimetype
	 */
	type: string;

	/**
	 * Buffer contains audio bytes
	 */
	buffer: ArrayBuffer;
};

class TTS {
	/**
	 * Method that return buffer with audio to speak text
	*/
	public getAudioBuffer(text: string, language: string) => Promise<TTSAudioBuffer>;

	/**
	 * Return an array of supported languages as ISO 639-1 codes
	*/
	static getSupportedLanguages(): langCode[];

}
```

## Example

Example of a dummy TTS module. In your code, feel free to use HTTP requests to any urls.

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