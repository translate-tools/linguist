# Offline translation

Starting from version 5.0, Linguist has an embedded offline translator called "Bergamot". To use it, simply choose this translator on the preferences page.

You can also use offline translation with [custom translators](../CustomTranslator.md) starting from Linguist version 4.0.

To do this, you need to deploy any service locally for translating text and implement a JS binding for Linguist.

## LibreTranslate

You can use the [LibreTranslate project](https://github.com/LibreTranslate/LibreTranslate) to deploy a machine translation service locally or on your own server.

After deployment (or finding a trusted server), add the custom translator [LibreTranslator](https://github.com/translate-tools/linguist-translators/blob/master/translators/LibreTranslator.js) and replace the `apiPath` value with the actual URL of the LibreTranslate instance.