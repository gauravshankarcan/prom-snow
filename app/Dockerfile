FROM node:16
WORKDIR /usr/src/app
COPY packag*.json ./
RUN npm install
COPY app/. .
EXPOSE 8080
CMD [ "node", "server.js" ]