# backend image: express api + static frontend

FROM node:20-alpine

WORKDIR /app/backend

# install deps
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

# app source
COPY backend/ ./

# frontend
COPY frontend/ ../frontend/

EXPOSE 3000

USER node

CMD ["node", "server.js"]
