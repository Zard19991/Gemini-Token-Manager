# Dockerfile
FROM node:20-alpine

WORKDIR /app

# 复制package文件
COPY package.json ./
COPY package-lock.json* ./

# 使用--omit=dev替代--production并添加--legacy-peer-deps解决依赖冲突
RUN npm install --omit=dev --legacy-peer-deps

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
