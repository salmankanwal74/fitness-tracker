# Backend image: docker build -t fitness-backend ./backend
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

# Pehle sirf package files (taake dependencies ki layer cache ho jaye)
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Backup folder (docker-compose isay volume se jorta hai) aur non-root user
RUN mkdir -p /app/backups && chown -R node:node /app/backups
USER node

EXPOSE 5000

# /health database down hone par 503 deta hai, to container "unhealthy" dikhata hai
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-5000}/health" > /dev/null || exit 1

CMD ["node", "server.js"]