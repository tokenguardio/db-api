FROM node:18-alpine

RUN apk add --no-cache bash
RUN npm install -g ts-node-dev

RUN mkdir -p /usr/src/node-app && chown -R node:node /usr/src/node-app
WORKDIR /usr/src/node-app
USER node

COPY --chown=node:node package*.json ./

RUN npm install
COPY --chown=node:node . .
RUN npm run build

EXPOSE 8082
ENTRYPOINT ["sh", "entrypoint.sh"]
CMD ["npm", "run", "start"]
