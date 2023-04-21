FROM node:14


# Install system deps
RUN apt-get update
RUN apt install -y cmake

WORKDIR /usr/src/app

COPY . .
RUN chown -R node:node .

USER node

# Prepare container
RUN npm install
RUN make prepareWasm