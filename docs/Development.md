The build scripts are designed to run on unix platform (linux, mac, bsd, etc), if you on windows, try to install [cygwin](https://www.cygwin.com/).

# Build from sources

## Prerequisites

- AMD64 platform. Currently ARM platform is not tested, so build may fail there
- UNIX-like OS
- Installed make
- Installed docker

If you have ARM CPU and want to build the code, you can emulate AMD64 and run build there. You may also try to [enable emulation](https://stackoverflow.com/questions/65612411/forcing-docker-to-use-linux-amd64-platform-by-default-on-macos) on docker level. If you use docker - set variable `export DOCKER_DEFAULT_PLATFORM=linux/amd64` or provide option `platform: linux/amd64` to a `docker-compose.yml` file.

## Build

- Create `.env` file. You may copy file `.env.config` and configure it with your options
- Run `make build` to build whole project, pack it, and check it with linter
- Artifacts will be placed in `build` directory


## Partial build

To build extension only for specific browsers, you may run `make` with specific target like `buildFirefox`, `buildChromium`, etc (see `makefile` for details). Some of targets:
- firefox
- chrome
- chromium: special build with auto updates not from google store

You must install dependencies and build a third party code with `make prepare buildThirdparty` before run specific target.

Example command to build only firefox version: `make prepare buildThirdparty buildFirefox`.


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
