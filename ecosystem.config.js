// ecosystem.config.js
module.exports = {
    apps: [
        {
            name: "gemini-token-manager",
            script: "./node_modules/.bin/egg-scripts",
            args: "start --title=gemini-token-manager --daemon=false --workers=1", // 修改这里
            instances: 1, // 使用单实例模式更简单
            exec_mode: "fork", // 改为 fork 模式
            max_memory_restart: process.env.MAX_MEMORY || "300M",
            env: {
                NODE_ENV: "production",
            },
            env_docker: {
                NODE_ENV: "production",
                MAX_MEMORY: "150M",
            },
            log_date_format: "YYYY-MM-DD HH:mm:ss",
            error_file: "./logs/app-err.log",
            out_file: "./logs/app-out.log",
            merge_logs: true,
        },
    ],
};
