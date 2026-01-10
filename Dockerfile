FROM node:20-alpine

WORKDIR /app

COPY server/package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000
CMD ["node", "server/server.js"]
