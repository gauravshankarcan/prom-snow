# Connecting your prometheus based alerts to an API based ITSM tool

## Overview
The article describes a mechanism to proxy non-prometheus /alert manager supported integrations to ITSM tools via the Webhook interface.

In this article today, we are going to go over 

## The Build

 The repo is [provide here for reference](https://github.com/gauravshankarcan/prom-snow) 

 Lets create a docker file / container to act as a proxy . I choose Javascript, however the logic can be applied to any web framework / scripting language 

```
FROM node:16
WORKDIR /usr/src/app
COPY app/package*.json ./
RUN npm install
COPY app/. .
EXPOSE 8080
CMD [ "node", "server.js" ]
```

This is a generic docker file for any nodejs code which coppies the app folder inside the container and runs server.js

