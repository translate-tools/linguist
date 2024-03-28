The build scripts are designed to run on unix platform (linux, mac, bsd, etc), if you on windows, try to install [cygwin](https://www.cygwin.com/).

# Build from sources

To clear build, install docker and run `make buildAll` in root of repository. This command will install dependencies and compile linguist for all platforms and will pack it to archives.

To build browser extension for one target:

- install dependencies with run `npm install`
- build browser extension for your platform (see scripts in `packages.json`), for example `npm run build:firefox`
- find artifacts in `build` directory

Available platforms:

- firefox
- chrome
- chromium: special build with auto updates not from google store

# Development

To development, you can run `npm run build:dev`.

If you change a theme tokens, you also have to compile a theme files: `npm run build:tokens`

To debug on android, [see instructions](./AndroidDebug.md).

To make a custom translator, see [translator API](./CustomTranslator.md).

# Tests

When you change code that touch any user data and interact with browser storages (`localStorage`, `indexedDB`, `browser.storage`, etc) or some external API, you must to add or update tests for it.

The common rule is any code that just transform data should be tested.

You may a not add tests for UI, but should add tests for data.

# Migrations

Migrations must have app version.
