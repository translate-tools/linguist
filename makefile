include .env
export

prepare:
	npm install

dev: prepare
	npm run build:dev

clean:
	rm -rf ./build

# Build section
build: clean prepare
	${MAKE} buildAll packAll lintBuilds

buildThirdparty:
	mkdir -p ./thirdparty/bergamot/build && chmod 777 ./thirdparty/bergamot/build
	${DOCKER_COMPOSE} run bergamot make build

buildAll: buildThirdparty
	mkdir -p ./build
	chmod 777 ./build
	${DOCKER_COMPOSE} run linguist make buildFirefox buildChromium buildChrome

buildFirefox:
	NODE_ENV=production EXT_TARGET=firefox webpack-cli -c ./webpack.config.js
buildChromium:
	NODE_ENV=production EXT_TARGET=chromium webpack-cli -c ./webpack.config.js
buildChrome:
	NODE_ENV=production EXT_TARGET=chrome webpack-cli -c ./webpack.config.js

packAll:
	cd build && ../scripts/zipAll.sh

lintBuilds:
	cd build && ../scripts/testBuildArchives.sh