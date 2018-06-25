FROM node:7
ENV HOME=/home/app
COPY package.json $HOME/nfse-sp-bridge/
WORKDIR $HOME/nfse-sp-bridge
RUN npm install
COPY . $HOME/nfse-sp-bridge
RUN npm install forever -g
CMD ["forever", "server.js"]