# Custom module API

Linguist can be extended via custom modules provided by user.

You can integrate any services in Linguist via custom modules.


## The format

The custom module is a plain JavaScript code that implements some API.

The last [expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Expressions_and_operators) in that code must return the implemented API.

For example if you implement the custom translator, it must be a constructor that implements the `Translator` interface.

```js
// You can describe the class anywhere you want
class MyTranslator {
	// ...
}

// some other code may be after declaration
console.log('Hello world');

// last expression in the code must return the translator constructor
MyTranslator;
```

## The security

Custom modules is run in an sandboxed environment.

Technically it runs in iframe with an isolated origin, so the browser extension API is unavailable for the custom modules.

The environment provides a patched `fetch` object so custom module can access any origin with no CSP concerns. So you can freely access any remote API.

Technically, `fetch` proxied by a background script through [`postMessage` API](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage).

The custom modules is isolated so it is generally secure enough, but as user you must not to run any random code as a Linguist custom module.

## Usage

When you want to use a custom module, you just paste the code in Linguist preferences. See [custom translator guide](../CustomTranslator.md) as example.