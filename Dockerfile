FROM node:7
ENV HOME=/home/app
COPY package.json $HOME/nfe-sp-bridge/
WORKDIR $HOME/nfe-sp-bridge
RUN npm install
COPY . $HOME/nfe-sp-bridge
RUN npm install forever -g
CMD ["forever", "server.js"]