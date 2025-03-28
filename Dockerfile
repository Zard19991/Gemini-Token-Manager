# 简化版PM2 Dockerfile
FROM node:20-alpine

ENV NODE_ENV=production
ENV TZ=Asia/Shanghai

WORKDIR /app

# 安装PM2
RUN npm install -g pm2

# 复制所有文件（包括ecosystem.config.js）
COPY . .

# 安装依赖
RUN npm install --omit=dev --legacy-peer-deps --no-audit --no-fund && \
    npm cache clean --force

# 创建必要目录
RUN mkdir -p /app/data /app/logs && \
    chmod 777 /app/data /app/logs

EXPOSE 7001

# 修改启动命令，移除init.js的执行
CMD ["pm2-runtime", "ecosystem.config.js", "--env", "docker"]
