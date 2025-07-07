Package with scripts to maintain locales.

This package process locale files and translates natural languages via [LLM](https://en.wikipedia.org/wiki/Large_language_model).

To start work, it's necessary to prepare node environment and create `.env` file.
You may copy skeleton content of `.env.example` and fill values.

You may use any enough powerful LLM with OpenAI compatible API.

## Update locales

To sync localizations with source language (English) run `npm run sync`.

This command will find all changes in source locale on current branch, and will copy this changes to all other localization files with translation.


## New locales

To add new language, you can run `npm run sync` and provide target language code with flag `-l`.
You may pass few comma separated codes like that.

Few examples:
- `npm run sync -- -l tg` to add [Tajik language](https://en.wikipedia.org/wiki/Tajik_language)
- `npm run sync -- -l tg,tt` to add Tajik and [Tatar language](https://en.wikipedia.org/wiki/Tatar_language)

## Proofread

If you need to proofread only source language (English), run `npm run proofread`.

If you want to proofread all locales, run `npm run proofread:all`.

You also may exclude some specific languages from proofreading with flag `-e` and comma separated list of languages `npm run proofread:all -- -e ja,zh`

## Prettify locale files

Locale files is automatically prettify and keys sorted by order.

If you need to prettify locales manually, run `npm run prettify`.
