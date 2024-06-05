FROM node:20
WORKDIR /mnt/bergamot

# Install system deps
RUN apt-get update
RUN apt-get install -y cmake

# Setup sudo
RUN apt-get install -y sudo && echo '%sudo ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers
RUN usermod -aG sudo node

RUN mkdir -p build bergamot-translator

COPY . .
RUN chown -R node:node .

USER node

# Prepare container
RUN npm install