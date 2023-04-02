build: buildThirdparty
	npm run build:all

dev: buildThirdparty
	npm run build:dev

buildThirdparty:
	cd thirdparty/bergamot && make build

prepare:
	npm install