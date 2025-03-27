# Dockerfile - 针对低资源服务器优化
FROM node:20-alpine

# 设置环境变量减少资源消耗
ENV NODE_ENV=production
# 限制npm并发数，减少内存使用
ENV npm_config_jobs=1

WORKDIR /app

# 复制package文件
COPY package.json ./
COPY package-lock.json* ./

# 优化npm安装参数，减少CPU和内存占用
RUN npm install --omit=dev --legacy-peer-deps --no-audit --no-fund && \
    # 清理npm缓存减少镜像大小
    npm cache clean --force

COPY . .

# 创建数据目录
RUN mkdir -p /app/data && \
    chmod 777 /app/data

EXPOSE 7001

# 创建简化的启动脚本
RUN printf '#!/bin/sh\nif [ ! -f /app/data/.initialized ] || [ "$FORCE_INIT" = "true" ]; then\n  echo "Running initialization script..."\n  node /app/init.js\n  touch /app/data/.initialized\nfi\nnpm start\n' > /app/start.sh && \
    chmod +x /app/start.sh

CMD ["/app/start.sh"]
