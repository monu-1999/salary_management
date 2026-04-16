FROM node:18-bullseye-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "node scripts/seed.js && npm run start"]
