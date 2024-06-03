SHELL=/bin/bash
DOCKER_COMPOSE=docker-compose

build: prepare
	npm run build:all

dev: prepare
	npm run build:dev

prepare:
	npm install

# 
# Main targets
# 
buildAll: buildThirdparty
	mkdir -p ./build
	${DOCKER_COMPOSE} run linguist make buildFirefox buildChromium buildChrome packAll
	
buildThirdparty:
	mkdir -p ./thirdparty/bergamot/build
	${DOCKER_COMPOSE} run bergamot make build

buildFirefox:
	npm run build:firefox
buildChromium:
	npm run build:chromium
buildChrome:
	npm run build:chrome

packAll:
	npm run packAll && npm run test:buildArchives