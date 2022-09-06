# Offline translation

You can use offline translation with [custom translators](../CustomTranslator.md) start of Linguist version 4.0.

To do it, you should deploy locally any service for translate text and implement JS binding for Linguist.

## LibreTranslate

You may use [LibreTranslate project](https://github.com/LibreTranslate/LibreTranslate) to deploy machine translation service locally or on your own server.

After deploy or found trusted server, add custom translator with code below (replace `apiPath` value to actual URL of LibreTranslate instance).

```js
class LibreTranslator {
    // URL of your instance of LibreTranslate
    // for local instance use URL "http://localhost/translate"
    apiPath = "https://translate.terraprint.co/translate";

    translate = (text, from, to) => {
        return fetch(this.apiPath, {
            credentials: "omit",
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:99.0) Gecko/20100101 Firefox/99.0",
                Accept: "*/*",
                "Accept-Language": "en-US,en;q=0.5",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-origin",
                "Content-Type": "application/json"
            },
            method: "POST",
            mode: "cors",
            body: JSON.stringify({
                q: text,
                source: from,
                target: to,
                format: "text"
            }),
        })
            .then((r) => r.json())
            .then(({ translatedText }) => translatedText);
    };

    translateBatch = (texts, from, to) =>
        Promise.all(texts.map((text) => this.translate(text, from, to)));

    getLengthLimit = () => 4000;
    getRequestsTimeout = () => 300;
    checkLimitExceeding = (text) => {
        const textLength = !Array.isArray(text) ? text.length : text.reduce((len, text) => len + text.length, 0);

        return textLength - this.getLengthLimit();
    }

    static isSupportedAutoFrom = () => true;
    static getSupportedLanguages = () => [
        "en", "ar", "az", "zh", "cs",
        "nl", "eo", "fi", "fr", "de",
        "el", "hi", "hu", "id", "ga",
        "it", "ja", "ko", "fa", "pl",
        "pt", "ru", "sk", "es", "sv",
        "tr", "uk", "vi"
    ];
}

LibreTranslator;
```