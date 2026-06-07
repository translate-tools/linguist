# Offline translation

Starting from version 5.0, Linguist has an embedded offline translator called "Bergamot". To use it, simply choose this translator on the preferences page.

You can also use offline translation with [custom translators](../CustomTranslator.md) starting from Linguist version 4.0.

To do this, you need to deploy any service locally for translating text and implement a JS binding for Linguist.

## LibreTranslate

You can use the [LibreTranslate](https://github.com/LibreTranslate/LibreTranslate) to deploy a machine translation service locally or on your own server.

Check the [Installation docs](https://docs.libretranslate.com/guides/installation/#with-docker) to deploy LibreTranslate locally via docker.

Quick start instruction to deploy LibreTranslate locally:
- Install [docker](https://www.docker.com/get-started/)
- Install the nvidia [container-toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html) to let container use your GPU
- Create the `compose.yml` file
```yml
services:
libretranslate:
	container_name: libretranslate
	image: libretranslate/libretranslate:latest-cuda
	ports:
	- "5000:5000"
	restart: unless-stopped
	command: --disable-web-ui
	environment:
	- LT_API_KEYS_DB_PATH=/app/db/api_keys.db
	- LT_API_KEYS=True
	- LT_UPDATE_MODELS=True
	- LT_DEBUG=True
	- PUID=root
	volumes:
	- ~/.libretranslate/db:/app/db
	- ~/.libretranslate/data:/root/.local:rw
	deploy:
	resources:
		reservations:
		devices:
			- driver: nvidia
			count: 1
			capabilities: [gpu]
```
- Start container via `docker compose up -d --build`

Once container is built the LibreTranslate will download the models, it will take some time, you can check page http://localhost:5000/ or docker logs `docker compose logs -f`. Once models will be loaded, you can use the translator.

Once you done with deployment (or if you find a trusted server), add the custom translator [LibreTranslator](https://github.com/translate-tools/linguist-translators/blob/master/translators/LibreTranslator.js) in Linguist settings. In case you use remote instance, replace the `apiPath` value with the actual URL of the LibreTranslate instance.

Done. Now you can translate everything locally.
