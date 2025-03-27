// app/service/proxy.js
const { URL } = require("url");
const fetch = require("node-fetch");

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

        // Create target URL
        const targetUrl = `${this.base_url}${path}?key=${selectedKey}`;

        try {
            // Forward the request
            const response = await fetch(targetUrl, {
                method: method || "GET",
                headers: headers,
                body: body ? JSON.stringify(body) : undefined,
                redirect: "follow",
            });

            // Read response as buffer to handle any content type
            const responseBuffer = await response.buffer();

            return {
                status: response.status,
                headers: response.headers.raw(),
                body: responseBuffer,
            };
        } catch (error) {
            this.ctx.logger.error("Proxy request error:", error);
            return {
                status: 500,
                body: JSON.stringify({
                    error: { message: `代理请求失败: ${error.message}` },
                }),
            };
        }
    }

    async checkKeyValidity(key) {
        try {
            // Query supported models list
            const response = await fetch(`${this.base_url}/v1/models?key=${key}`, {
                method: "GET",
            });

            if (!response.ok) {
                let errorMessage = "余额模型列表失败";
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.error && errorData.error.message) {
                        errorMessage = errorData.error.message;
                    }
                } catch (e) {
                    // Ignore JSON parsing errors
                }

                return {
                    isValid: false,
                    balance: -1,
                    message: errorMessage,
                };
            }

            const data = await response.json();
            const balance = data.models.length || 0;

            return {
                isValid: true,
                balance: balance,
                message: "验证成功",
            };
        } catch (error) {
            this.ctx.logger.error("Check key validity error:", error);
            return {
                isValid: false,
                balance: -1,
                message: `网络错误: ${error.message || "未知错误"}`,
            };
        }
    }
}

module.exports = ProxyService;
