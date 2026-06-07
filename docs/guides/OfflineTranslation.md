# Offline translation

Starting from version 5.0, Linguist has a built-in offline translator called "Bergamot". To use it, simply choose this translator on the preferences page.

You can also use offline translation with [custom translators](../CustomTranslator.md) starting from Linguist version 4.0.

To do this, deploy any service locally for translating text and implement a JS binding for Linguist.

## LibreTranslate

You can use [LibreTranslate](https://github.com/LibreTranslate/LibreTranslate) to deploy a machine translation service locally or on your own server.

See the [Installation documentation](https://docs.libretranslate.com/guides/installation/#with-docker) to deploy LibreTranslate locally via Docker.

Quick start instructions to deploy LibreTranslate locally:
- Install [Docker](https://www.docker.com/get-started/)
- Install the NVIDIA [Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html) to allow the container to use your GPU
- Create a `compose.yml` file:
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
- Start the container with `docker compose up -d --build`

Once the container is built, LibreTranslate will download the models. This will take some time. You can check http://localhost:5000/ or view the Docker logs with `docker compose logs -f`. Once the models are loaded, you can use the translator.

Once you have finished deployment (or if you find a trusted server), add the custom translator [LibreTranslator](https://github.com/translate-tools/linguist-translators/blob/master/translators/LibreTranslator.js) in Linguist settings. If you use a remote instance, replace the `apiPath` value with the actual URL of the LibreTranslate instance.

Done. You can now translate everything locally.
