Utils to build a bergamot as WASM module and a bindings to run WASM module in [Worker](https://developer.mozilla.org/en-US/docs/Web/API/Worker).

The [bergamot project](https://github.com/browsermt/bergamot-translator) is a machine translation that support compiling to a WASM.

# Build

To build bergamot run `make build`, this command will build WASM code and compile worker modules.

To build only WASM module run `make buildWasm` and then `make exportWasm` to copy files to a `build` directory.
First build of WASM may take about 20 minutes.

Directory `src` contains a code of worker that must be compiled with webpack from project root directory.

# Usage

To use code, you have to build WASM module and worker, then copy contents of directory `build` to your application build.

Usage in browser
```js
const workerUrl = '/translators/bergamot/translator.worker.js';
const backing = new TranslatorBackingWithCache({ workerUrl });
const translator = new BatchTranslator(backing);

translator.translate({
	from: 'en',
	to: 'ru',
	text: 'Hello world',
	html: false,
	priority: 0,
}).then((response) => {
	console.log('Translated text: ', response.target.text);
});
```
