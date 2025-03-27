// ecosystem.config.js
module.exports = {
    apps: [
        {
            name: "gemini-token-manager",
            // 关键修改：调整脚本路径和启动命令方式
            script: "./node_modules/.bin/egg-scripts",
            args: "start --title=gemini-token-manager",
            instances: process.env.INSTANCES || "1", // 默认只启动一个实例
            exec_mode: "cluster",
            max_memory_restart: process.env.MAX_MEMORY || "300M",
            env: {
                NODE_ENV: "production",
            },
            env_docker: {
                NODE_ENV: "production",
                INSTANCES: "1", // 只启动一个实例避免资源消耗
                MAX_MEMORY: "150M",
            },
            log_date_format: "YYYY-MM-DD HH:mm:ss",
            error_file: "./logs/app-err.log",
            out_file: "./logs/app-out.log",
            merge_logs: true,
        },
    ],
};
