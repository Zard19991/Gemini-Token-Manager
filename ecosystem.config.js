// ecosystem.config.js
module.exports = {
    apps: [
        {
            name: "gemini-token-manager",
            script: "node_modules/egg-scripts/bin/egg-scripts.js",
            args: "start --title=gemini-token-manager",
            instances: process.env.INSTANCES || "max", // 使用环境变量控制实例数，默认使用所有可用核心
            exec_mode: "cluster", // 使用cluster模式实现负载均衡
            max_memory_restart: process.env.MAX_MEMORY || "300M", // 使用环境变量控制内存限制
            env: {
                NODE_ENV: "production",
            },
            // Docker环境中使用的配置
            env_docker: {
                NODE_ENV: "production",
                INSTANCES: "2", // Docker中默认启动2个实例
                MAX_MEMORY: "150M", // Docker中内存限制较低
            },
            // 日志配置
            log_date_format: "YYYY-MM-DD HH:mm:ss",
            error_file:
                process.env.NODE_ENV === "production"
                    ? "/app/logs/app-err.log"
                    : "./logs/app-err.log",
            out_file:
                process.env.NODE_ENV === "production"
                    ? "/app/logs/app-out.log"
                    : "./logs/app-out.log",
            merge_logs: true,
        },
    ],
};
