FROM node:26
WORKDIR /mnt/builder

RUN apt-get update

# Sys utils
RUN apt-get install -y zip gzip tar cmake

# Setup sudo
RUN apt-get install -y sudo && echo '%sudo ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers
RUN usermod -aG sudo node

COPY . .
RUN mkdir -p thirdparty/bergamot/build
RUN chown -R node:node .

USER node

# Prepare container
RUN npm install