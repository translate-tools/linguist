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
	${DOCKER_COMPOSE} run linguist make dockerBuild
	
buildThirdparty:
	mkdir -p ./thirdparty/bergamot/build
	${DOCKER_COMPOSE} run bergamot make build

# TODO: replace one target to multiple
dockerBuild:
	npm run build:firefox