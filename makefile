SHELL=/bin/bash
DOCKER_COMPOSE=docker-compose

prepare:
	npm install

dev: prepare
	npm run build:dev

# Build section
build: prepare buildThirdparty
	${MAKE} buildAll

buildThirdparty:
	mkdir -p ./thirdparty/bergamot/build
	${DOCKER_COMPOSE} run bergamot make build

buildAll: buildThirdparty
	mkdir -p ./build
	${DOCKER_COMPOSE} run linguist make buildFirefox buildChromium buildChrome packAll

buildFirefox:
	npm run build:firefox
buildChromium:
	npm run build:chromium
buildChrome:
	npm run build:chrome

packAll:
	npm run packAll && npm run test:buildArchives