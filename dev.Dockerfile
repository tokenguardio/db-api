FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm install -g ts-node-dev

COPY ./ ./
RUN npm run build
RUN chmod +x entrypoint.sh

EXPOSE 8082
ENTRYPOINT ["./entrypoint.sh"]
