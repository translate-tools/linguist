FROM node:14
WORKDIR /usr/src/app

# Install system deps
RUN apt-get update
RUN apt-get install -y cmake

COPY . .
RUN chown -R node:node .

USER node

# Prepare container
RUN npm install
RUN make prepareWasm