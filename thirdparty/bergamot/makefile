SHELL=/bin/bash

# include docs https://www.gnu.org/software/make/manual/html_node/Include.html
include .env

build: buildWorker buildWasm exportWasm

buildWorker:
	npm install
	npm run worker:build

exportWasm:
	mkdir -p build
	cp bergamot-translator/build-wasm/bergamot-translator-worker.{js,wasm} build/

buildWasm: prepareWasm
	cd bergamot-translator && mkdir -p build-wasm
	source bergamot-translator/emsdk/emsdk_env.sh && cd bergamot-translator/build-wasm && emcmake cmake -DCOMPILE_WASM=on -DWORMHOLE=off ../ && emmake make -j2 && bash ../wasm/patch-artifacts-import-gemm-module.sh

prepareWasm:
	- git clone https://github.com/browsermt/bergamot-translator.git
	cd bergamot-translator && git checkout "${BERGAMOT_REVISION}"
	- cd bergamot-translator && git clone https://github.com/emscripten-core/emsdk.git
	cd bergamot-translator/emsdk && ./emsdk install 3.1.8 && ./emsdk activate 3.1.8

clean:
	rm -rf ./build
