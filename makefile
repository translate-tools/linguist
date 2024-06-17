include .env
export

prepare:
	npm install

dev: prepare
	npm run build:dev
devFirefox: prepare
	EXT_TARGET=firefox npx webpack-cli -wc ./webpack.config.js
devChromium: prepare
	EXT_TARGET=chromium npx webpack-cli -wc ./webpack.config.js
devChrome: prepare
	EXT_TARGET=chrome npx webpack-cli -wc ./webpack.config.js

devAndroidFirefox:
	cd build/dev/firefox && npx web-ext run -t firefox-android --adb-device "${ADB_DEVICE_TO_DEBUG}" --firefox-apk org.mozilla.fenix

clean:
	rm -rf ./build

# Build section
build: clean prepare buildThirdparty buildAll packAll lintBuilds

buildThirdparty:
	mkdir -p ./thirdparty/bergamot/build && chmod 777 ./thirdparty/bergamot/build
	${DOCKER_COMPOSE} run --rm bergamot make build

buildAll:
	mkdir -p ./build
	chmod 777 ./build
	${DOCKER_COMPOSE} run --rm linguist make buildFirefox buildFirefoxStandalone buildChromium buildChrome

buildFirefox:
	NODE_ENV=production EXT_TARGET=firefox npx webpack-cli -c ./webpack.config.js
buildFirefoxStandalone:
	NODE_ENV=production EXT_TARGET=firefox-standalone npx webpack-cli -c ./webpack.config.js
buildChromium:
	NODE_ENV=production EXT_TARGET=chromium npx webpack-cli -c ./webpack.config.js
buildChrome:
	NODE_ENV=production EXT_TARGET=chrome npx webpack-cli -c ./webpack.config.js

packAll:
	cd build && ../scripts/zipAll.sh

lintBuilds:
	cd build && ../scripts/testBuildArchives.sh