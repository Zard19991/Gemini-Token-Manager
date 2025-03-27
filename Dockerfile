# Dockerfile - 使用项目中的PM2配置
FROM node:20-alpine

# 设置环境变量
ENV NODE_ENV=production
ENV TZ=Asia/Shanghai

WORKDIR /app

# 安装PM2
RUN npm install -g pm2

# 复制package文件并安装依赖
COPY package.json ./
COPY package-lock.json* ./
RUN npm install --omit=dev --legacy-peer-deps --no-audit --no-fund && \
    npm cache clean --force

# 复制应用代码
COPY . .

# 创建数据和日志目录
RUN mkdir -p /app/data /app/logs && \
    chmod 777 /app/data /app/logs

EXPOSE 7001

# 使用项目中的PM2配置启动应用，指定使用docker环境配置
CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "docker"]