# Dockerfile
FROM node:20-alpine

WORKDIR /app

# 分开复制以处理package-lock.json可能不存在的情况
COPY package.json ./
# 如果有package-lock.json则复制，没有则忽略
COPY package-lock.json* ./

RUN npm install --production

COPY . .

# Create a data directory for persistence
RUN mkdir -p /app/data && \
    chmod 777 /app/data

EXPOSE 7001

# Create a startup script that runs initialization before starting the app
RUN echo '#!/bin/sh\nif [ ! -f /app/data/.initialized ] || [ "$FORCE_INIT" = "true" ]; then\n  echo "Running initialization script..."\n  node /app/init.js\n  touch /app/data/.initialized\nfi\nnpm start' > /app/start.sh && \
    chmod +x /app/start.sh

# Use the startup script as CMD
CMD ["/app/start.sh"]
