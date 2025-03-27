# Dockerfile
FROM node:20-alpine

# 安装pnpm
RUN npm install -g pnpm

WORKDIR /app

# 复制package文件
COPY package.json ./

# 使用pnpm安装依赖，自动解决peer dependencies
RUN pnpm install --prod --no-lockfile

COPY . .

# Create a data directory for persistence
RUN mkdir -p /app/data && \
    chmod 777 /app/data

EXPOSE 7001

# 创建启动脚本，使用pnpm启动应用
RUN echo '#!/bin/sh\nif [ ! -f /app/data/.initialized ] || [ "$FORCE_INIT" = "true" ]; then\n  echo "Running initialization script..."\n  node /app/init.js\n  touch /app/data/.initialized\nfi\npnpm start' > /app/start.sh && \
    chmod +x /app/start.sh

# Use the startup script as CMD
CMD ["/app/start.sh"]
