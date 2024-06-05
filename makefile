include .env
export

prepare:
	npm install

dev: prepare
	npm run build:dev

clean:
	rm -rf ./build

# Build section
build: clean prepare buildThirdparty buildAll packAll lintBuilds

buildThirdparty:
	mkdir -p ./thirdparty/bergamot/build && chmod 777 ./thirdparty/bergamot/build
	${DOCKER_COMPOSE} run bergamot make build

buildAll:
	mkdir -p ./build
	chmod 777 ./build
	${DOCKER_COMPOSE} run linguist make buildFirefox buildChromium buildChrome

buildFirefox:
	NODE_ENV=production EXT_TARGET=firefox npx webpack-cli -c ./webpack.config.js
buildChromium:
	NODE_ENV=production EXT_TARGET=chromium npx webpack-cli -c ./webpack.config.js
buildChrome:
	NODE_ENV=production EXT_TARGET=chrome npx webpack-cli -c ./webpack.config.js

packAll:
	cd build && ../scripts/zipAll.sh

lintBuilds:
	cd build && ../scripts/testBuildArchives.sh