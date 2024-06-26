FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm install -g ts-node-dev

COPY ./ ./
RUN npm run build

EXPOSE 8082
ENTRYPOINT ["sh", "entrypoint.sh"]
CMD ["npm", "run", "start:dev"]
