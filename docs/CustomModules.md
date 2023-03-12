Linguist are privacy focused and high customizable, so you can use a custom modules that implement core features related to a translation, like translators and text to speech.

Read more about custom modules you need
- [Translators](./CustomTranslator.md)
- [Text to speech](./CustomTTS.md)

## WARNING

When you use a custom modules, you insert a javascript code that will be evaluated in the browser extension context.

This means you MUST trust this code. **Never add custom translators with code that you don't understand or don't trust**.

If you will insert untrusted module code, hackers may execute any code in your browser, to spy your translated texts, steal your personal data, read your personal messages on sites, steal your money using the site of your bank, etc.

## Improve your privacy

A custom modules are give you control over your data. As a Linguist user, you can create a translator module for any translation service in the world, you can even use a service that deployed on your local machine or a server under your control.

This is an important feature that distinguish a Linguist of another browser extensions to translate web pages.
With a custom modules you have control over all HTTP requests from within the extension.

## For a developers

If you are developer of a translation service, you may create a custom module with bindings to your service and enjoy the Linguist features based on your backend. It's a good way to test your translator performance and translation quality on real use cases.

Do not create your own browser extension for your translation service. Instead, suggest a Linguist to your users as a client with reach features for your service and focus your work on translation quality and API reliability. Present your API with a powerful Linguist integrations to impress your clients.
