Linguist is privacy-focused and highly customizable, so you can use custom modules that implement core features related to translation, such as translators and text-to-speech.

Read more about the custom modules you need:
- [Translators](./CustomTranslator.md)
- [Text to Speech](./CustomTTS.md)

## WARNING

When you use custom modules, you insert JavaScript code that will be evaluated in the browser extension context.

This means you MUST trust this code. **Never add custom translators with code that you don't understand or don't trust**.

If you insert untrusted module code, hackers may execute any code in your browser to spy on your translated texts, steal your personal data, read your personal messages on sites, steal your money using the site of your bank, etc.

## Improve your privacy

Custom modules give you control over your data. As a Linguist user, you can create a translator module for any translation service in the world, and you can even use a service deployed on your local machine or a server under your control.

This is an important feature that distinguishes Linguist from other browser extensions to translate web pages. With custom modules, you have control over all HTTP requests from within the extension.

## For developers

If you are a developer of a translation service, you may create a custom module with bindings to your service and enjoy the Linguist features based on your backend. It's a good way to test your translator performance and translation quality on real use cases.

Do not create your browser extension for your translation service. Instead, suggest Linguist to your users as a client with rich features for your service and focus your work on translation quality and API reliability. Present your API with powerful Linguist integrations to impress your clients.