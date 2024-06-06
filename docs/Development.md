The build scripts are designed to run on unix platform (linux, mac, bsd, etc), if you on windows, try to install [cygwin](https://www.cygwin.com/).

# Build from sources

Prerequisites:
- UNIX-like OS
- Installed make
- Installed docker

Instructions:
- Create `.env` file. You may copy file `.env.config` and configure it with your options
- To build all code, create packages, and check it with linter just run `make build`
	- If you build from a platform other than amd64, you may have problems with build a third party code. To resolve a problem, you have to build code in environment that are compatible with amd64. You may [enable emulation](https://stackoverflow.com/questions/65612411/forcing-docker-to-use-linux-amd64-platform-by-default-on-macos), if you use docker - set variable `export DOCKER_DEFAULT_PLATFORM=linux/amd64` or provide option `platform: linux/amd64` to a `docker-compose.yml` file
- To make build only for specific platform, you may run `make` with specific target like `buildFirefox`, `buildChromium`, etc (see `makefile` for details)
	- You must build a third party code with `make buildThirdparty` before run specific target. Example: `make prepare buildThirdparty buildFirefox`
- Artifacts is placed in `build` directory

Available platforms:
- firefox
- chrome
- chromium: special build with auto updates not from google store

# Development

You may run development mode with `make dev`.

If you change a theme tokens, you also have to compile a theme files: `npm run build:tokens`

To debug on android, [see instructions](./AndroidDebug.md).

To make a custom translator, see [translator API](./CustomTranslator.md).

# Tests

When you change code that touch any user data and interact with browser storages (`localStorage`, `indexedDB`, `browser.storage`, etc) or some external API, you must to add or update tests for it.

The common rule is any code that just transform data should be tested.

You may a not add tests for UI, but should add tests for data.

# Migrations

Migrations must have app version.
