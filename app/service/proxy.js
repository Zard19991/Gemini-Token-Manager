// app/service/proxy.js
const { URL } = require("url");
const fetch = require("node-fetch");
const HttpsProxyAgent = require("https-proxy-agent");

class ProxyService {
    constructor(ctx) {
        this.ctx = ctx;
        this.base_url = "https://generativelanguage.googleapis.com";
    }

    async proxyRequest(path, headers, body, method) {
        // Get all valid keys for load balancing
        const keys = await this.ctx.service.key.getAllKeys();
        const validKeys = keys.filter(k => parseFloat(k.balance) > 0);

        if (validKeys.length === 0) {
            return {
                status: 503,
                body: {
                    error: { message: "没有可用的API密钥" },
                },
            };
        }

        // Load balancing - randomly select a key
        const randomIndex = Math.floor(Math.random() * validKeys.length);
        const selectedKey = validKeys[randomIndex].key;
        this.ctx.logger.info(`使用API密钥: ${selectedKey.substring(0, 5)}...`);

        // Create target URL
        const targetUrl = `${this.base_url}${path}?key=${selectedKey}`;
        this.ctx.logger.info(`目标URL: ${this.base_url}${path}?key=***`);

        try {
            // 获取HTTP代理配置
            const config = await this.ctx.service.config.get();

            // 处理请求体
            let processedBody = null;
            if (body) {
                // 检查body是否已经是字符串
                if (typeof body === "string") {
                    processedBody = body;
                } else {
                    processedBody = JSON.stringify(body);
                }
                this.ctx.logger.info(
                    `请求体类型: ${typeof body}, 处理后类型: ${typeof processedBody}`
                );
                this.ctx.logger.info(`请求体前20个字符: ${processedBody.substring(0, 20)}...`);
            } else {
                this.ctx.logger.info("请求没有body");
            }

            // 确保headers正确设置
            const processedHeaders = { ...headers };

            // 强制使用identity编码，禁用压缩算法
            processedHeaders["accept-encoding"] = "identity";

            // 删除Authorization头，避免与URL参数认证冲突
            delete processedHeaders["authorization"];

            if (processedBody && !processedHeaders["content-type"]) {
                processedHeaders["content-type"] = "application/json";
            }

            this.ctx.logger.info(`请求方法: ${method || "GET"}`);
            this.ctx.logger.info(`处理后的请求头: ${JSON.stringify(processedHeaders)}`);

            let fetchOptions = {
                method: method || "GET",
                headers: processedHeaders,
                redirect: "follow",
            };

            // 只有当body存在时才添加body选项
            if (processedBody) {
                fetchOptions.body = processedBody;
            }

            // 如果配置了HTTP代理，则使用
            if (config.httpProxy) {
                this.ctx.logger.info(`使用HTTP代理: ${config.httpProxy}`);
                fetchOptions.agent = new HttpsProxyAgent(config.httpProxy);

                // 记录代理配置
                this.ctx.logger.info(
                    `代理配置类型: ${typeof fetchOptions.agent}, 是否为HttpsProxyAgent: ${
                        fetchOptions.agent instanceof HttpsProxyAgent
                    }`
                );
            } else {
                this.ctx.logger.info("未使用HTTP代理");
            }

            // 记录完整请求选项（排除敏感信息）
            const logFetchOptions = { ...fetchOptions };
            if (logFetchOptions.body) {
                logFetchOptions.body = "(body内容已省略)";
            }
            if (logFetchOptions.agent) {
                logFetchOptions.agent = "(agent对象已省略)";
            }
            this.ctx.logger.info(`完整请求选项: ${JSON.stringify(logFetchOptions)}`);

            // Forward the request
            this.ctx.logger.info("开始发送请求...");
            const response = await fetch(targetUrl, fetchOptions);
            this.ctx.logger.info(`请求已完成，状态码: ${response.status}`);

            // Read response as buffer to handle any content type
            this.ctx.logger.info("开始读取响应体...");
            const responseBuffer = await response.buffer();
            this.ctx.logger.info(`响应体读取完成，大小: ${responseBuffer.length} 字节`);
            // 正确设置HTTP响应
            ctx.status = result.status;

            // 处理headers (避免设置可能导致问题的头部)
            for (const [key, values] of Object.entries(result.headers)) {
                if (
                    !["connection", "transfer-encoding", "content-length"].includes(
                        key.toLowerCase()
                    )
                ) {
                    ctx.set(key, Array.isArray(values) ? values.join(", ") : values);
                }
            }
            // 设置响应体
            ctx.body = result.body;
            // return {
            //     status: response.status,
            //     headers: response.headers.raw(),
            //     body: responseBuffer,
            // };
        } catch (error) {
            // 增强错误日志
            this.ctx.logger.error("代理请求错误详情:");
            this.ctx.logger.error(`- 错误名称: ${error.name}`);
            this.ctx.logger.error(`- 错误消息: ${error.message}`);
            this.ctx.logger.error(`- 错误堆栈: ${error.stack}`);

            if (error.code) {
                this.ctx.logger.error(`- 错误代码: ${error.code}`);
            }

            if (error.cause) {
                this.ctx.logger.error(`- 错误原因: ${JSON.stringify(error.cause)}`);
            }

            return {
                status: 500,
                body: JSON.stringify({
                    error: {
                        message: `代理请求失败: ${error.message}`,
                        code: error.code || "UNKNOWN_ERROR",
                        name: error.name,
                    },
                }),
            };
        }
    }

    async checkKeyValidity(key) {
        try {
            // 获取HTTP代理配置
            const config = await this.ctx.service.config.get();
            let fetchOptions = {
                method: "GET",
                headers: {
                    "accept-encoding": "identity", // 禁用压缩
                },
            };

            this.ctx.logger.info(`开始验证API密钥: ${key.substring(0, 5)}...`);

            // 如果配置了HTTP代理，则使用
            if (config.httpProxy) {
                this.ctx.logger.info(`使用HTTP代理检查密钥: ${config.httpProxy}`);
                fetchOptions.agent = new HttpsProxyAgent(config.httpProxy);
            }

            const testUrl = `${this.base_url}/v1/models?key=${key}`;
            this.ctx.logger.info(`请求验证URL: ${this.base_url}/v1/models?key=***`);

            // 记录完整请求选项（排除敏感信息）
            const logFetchOptions = { ...fetchOptions };
            if (logFetchOptions.agent) {
                logFetchOptions.agent = "(agent对象已省略)";
            }
            this.ctx.logger.info(`验证请求选项: ${JSON.stringify(logFetchOptions)}`);

            // Query supported models list
            this.ctx.logger.info("开始发送验证请求...");
            const response = await fetch(testUrl, fetchOptions);
            this.ctx.logger.info(`验证请求完成，状态码: ${response.status}`);

            if (!response.ok) {
                let errorMessage = "获取模型列表失败";
                let errorData = null;

                try {
                    errorData = await response.json();
                    this.ctx.logger.error(`API响应错误: ${JSON.stringify(errorData)}`);

                    if (errorData && errorData.error && errorData.error.message) {
                        errorMessage = errorData.error.message;
                    }
                } catch (e) {
                    // JSON解析错误
                    this.ctx.logger.error(`无法解析错误响应为JSON: ${e.message}`);
                    try {
                        // 尝试获取文本内容
                        const textContent = await response.text();
                        this.ctx.logger.error(`错误响应内容: ${textContent.substring(0, 200)}`);
                    } catch (textError) {
                        this.ctx.logger.error(`无法读取错误响应内容: ${textError.message}`);
                    }
                }

                return {
                    isValid: false,
                    balance: -1,
                    message: errorMessage,
                    statusCode: response.status,
                    errorData: errorData,
                };
            }

            this.ctx.logger.info("开始解析响应数据...");
            const data = await response.json();
            const balance = data.models ? data.models.length || 0 : 0;
            this.ctx.logger.info(`解析完成，模型数量: ${balance}`);

            return {
                isValid: true,
                balance: balance,
                message: "验证成功",
            };
        } catch (error) {
            // 增强错误日志
            this.ctx.logger.error("密钥验证错误详情:");
            this.ctx.logger.error(`- 错误名称: ${error.name}`);
            this.ctx.logger.error(`- 错误消息: ${error.message}`);
            this.ctx.logger.error(`- 错误堆栈: ${error.stack}`);

            if (error.code) {
                this.ctx.logger.error(`- 错误代码: ${error.code}`);
            }

            if (error.cause) {
                this.ctx.logger.error(`- 错误原因: ${JSON.stringify(error.cause)}`);
            }

            return {
                isValid: false,
                balance: -1,
                message: `网络错误: ${error.message || "未知错误"}`,
                errorCode: error.code || "UNKNOWN_ERROR",
                errorName: error.name,
            };
        }
    }
}

module.exports = ProxyService;
