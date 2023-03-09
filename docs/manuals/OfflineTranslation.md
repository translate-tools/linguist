# Offline translation

You can use offline translation with [custom translators](../CustomTranslator.md) start of Linguist version 4.0.

To do it, you should deploy locally any service for translate text and implement JS binding for Linguist.

## LibreTranslate

You may use [LibreTranslate project](https://github.com/LibreTranslate/LibreTranslate) to deploy machine translation service locally or on your own server.

After deploy (or found trusted server), add custom translator [LibreTranslator](../../modules/LibreTranslator.js) and replace `apiPath` value to actual URL of LibreTranslate instance.
