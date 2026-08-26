# ---- Base image ----
FROM node:18-slim

# better-sqlite3 perlu build tools untuk native binding
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies dulu (memanfaatkan Docker layer cache)
COPY package*.json ./
RUN npm install --omit=dev

# Copy source code
COPY . .

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "server.js"]
