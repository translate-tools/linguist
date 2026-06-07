# Build from sources

The build scripts are designed to run on a Unix platform (Linux, macOS, BSD, etc.). If you are on Windows, try installing [Cygwin](https://www.cygwin.com/).

## Prerequisites

- AMD64 platform. ARM platform is currently not tested, so the build may fail there
- UNIX-like OS
- make installed
- Docker installed

If you have an ARM CPU and want to build the code, you can emulate AMD64 and run the build there. You may also try to [enable emulation](https://stackoverflow.com/questions/65612411/forcing-docker-to-use-linux-amd64-platform-by-default-on-macos) at the Docker level. If you use Docker, set the variable `export DOCKER_DEFAULT_PLATFORM=linux/amd64` or add the option `platform: linux/amd64` to a `docker-compose.yml` file.

## Build

- Create a `.env` file. You may copy the `.env.example` file and configure it with your options
- Run `make build` to build the whole project, package it, and check it with a linter
- Artifacts will be placed in the `build` directory


## Partial build

To build the extension for specific browsers only, you may run `make` with a specific target such as `buildFirefox`, `buildChromium`, etc. (see `makefile` for details). Some targets:
- firefox
- chrome
- chromium: special build with auto updates not from the Google Store

You must install dependencies and build third party code with `make prepare buildThirdparty` before running a specific target.

Example command to build only the Firefox version: `make prepare buildThirdparty buildFirefox`.


# Development

You may run development mode with `make dev`.

If you change theme tokens, you also have to compile the theme files: `npm run build:tokens`

To debug on Android, [see instructions](./AndroidDebug.md).

To make a custom translator, see the [translator API](../CustomTranslator.md).

# Tests

When you change code that touches any user data and interacts with browser storages (`localStorage`, `indexedDB`, `browser.storage`, etc.) or some external API, you must add or update tests for it.

The general rule is that any code which simply transforms data should be tested.

You may not need to add tests for UI, but you should add tests for data.

# Migrations

Migrations must have app version.
