FROM node:20
WORKDIR /mnt/builder

RUN apt-get update

# Puppeteer deps
RUN apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libnss3 lsb-release xdg-utils wget

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