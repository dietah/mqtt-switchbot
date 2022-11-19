FROM node:15-buster-slim
EXPOSE 3000

WORKDIR /usr/src/app
RUN apt-get update && apt-get -y install g++ make python3 bluetooth bluez libbluetooth-dev libudev-dev

COPY package*.json ./
RUN npm install

COPY . /usr/src/app
ENV NODE_ENV production

CMD [ "npm", "start" ]
