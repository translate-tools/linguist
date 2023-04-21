SHELL=/bin/bash

build: prepare
	npm run build:all

dev: prepare
	npm run build:dev

prepare:
	npm install

# 
# Docker
# 
dockerBuildContainer:
	docker build . -t v/linguist

dockerMakeBuild:
	# set current user id, to allow access to shared files
	# use `--cap-add=SYS_ADMIN` to allow run puppeteer
	docker run -v `pwd`:/usr/src/app --user `id -u` --cap-add=SYS_ADMIN v/linguist make dockerBuild

dockerBuild:
	echo "User: `whoami`:`id -u`"
	make build