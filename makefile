SHELL=/bin/bash

build: prepare
	npm run build:all

dev: prepare
	npm run build:dev

prepare:
	npm install

# 
# Main targets
# 
buildAll:
	make dockerBuildContainer
	make dockerRunContainer

# 
# Docker
# 
dockerBuildContainer:
	docker build . -t v/linguist

dockerRunContainer:
	npm run clean
	# set current user id, to allow access to shared files
	# use `--cap-add=SYS_ADMIN` to allow run puppeteer
	docker run -v `pwd`:/out --user node --cap-add=SYS_ADMIN v/linguist make dockerBuild

dockerBuild:
	make build
	sudo cp -R ./build /out/build