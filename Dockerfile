# Dockerfile
FROM node:20-alpine

# 安装pnpm - 确保安装成功
RUN npm install -g pnpm && pnpm -v

WORKDIR /app

# 复制package文件
COPY package.json ./

# 尝试导入现有的package-lock.json（如果存在）
COPY package-lock.json* ./
RUN if [ -f package-lock.json ]; then pnpm import; fi

# 使用pnpm安装依赖
RUN pnpm install --prod

COPY . .

# Create a data directory for persistence
RUN mkdir -p /app/data && \
    chmod 777 /app/data

EXPOSE 7001

# 使用更可靠的方式创建启动脚本
RUN printf '#!/bin/sh\nif [ ! -f /app/data/.initialized ] || [ "$FORCE_INIT" = "true" ]; then\n  echo "Running initialization script..."\n  node /app/init.js\n  touch /app/data/.initialized\nfi\n\n# 使用pnpm启动或fallback到npm\nif command -v pnpm > /dev/null; then\n  pnpm start\nelse\n  npm start\nfi\n' > /app/start.sh && \
    chmod +x /app/start.sh && \
    cat /app/start.sh

# 确保package.json中有start脚本
RUN if ! grep -q "\"start\"" package.json; then \
    echo "ERROR: No start script found in package.json"; \
    exit 1; \
fi

# 使用shell形式的CMD确保正确执行脚本
CMD /bin/sh /app/start.sh
