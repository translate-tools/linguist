# Custom module API

Linguist can be extended via custom modules provided by the user.

You can integrate any services in Linguist via custom modules.


## The format

The custom module is plain JavaScript code that implements some API.

The last [expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Expressions_and_operators) in that code must return the implemented API.

For example, if you implement a custom translator, it must be a constructor that implements the `Translator` interface.

```js
// You can describe the class anywhere you want
class MyTranslator {
	// ...
}

// some other code may come after the declaration
console.log('Hello world');

// last expression in the code must return the translator constructor
MyTranslator;
```

## The security

Custom modules are run in a sandboxed environment.

Technically it runs in an iframe with an isolated origin, so the browser extension API is unavailable to custom modules.

The environment provides a patched `fetch` object so the custom module can access any origin with no CSP concerns. So you can freely access any remote API.

Technically, `fetch` is proxied by a background script through the [`postMessage` API](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage).

Custom modules are isolated so they are generally secure enough, but as a user you must not run any random code as a Linguist custom module.

## Usage

When you want to use a custom module, you simply paste the code in Linguist preferences. See the [custom translator guide](../CustomTranslator.md) as an example.
