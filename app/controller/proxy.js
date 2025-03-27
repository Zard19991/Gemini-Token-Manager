"use strict";

const { Controller } = require("egg");

class ProxyController extends Controller {
    async handleProxy() {
        const { ctx } = this;
        // Authentication is handled by middleware
        const path = ctx.path;
        const headers = { ...ctx.headers };
        const body = ctx.request.body;
        const method = ctx.method;

        // Remove host header to avoid conflicts
        delete headers.host;
        
        ctx.logger.info(`收到代理请求: ${method} ${path}`);
        ctx.logger.info(`请求头: ${JSON.stringify(headers)}`);
        
        if (body) {
            ctx.logger.info(`请求体类型: ${typeof body}`);
            if (typeof body === 'object') {
                ctx.logger.info(`请求体摘要: ${JSON.stringify(body).substring(0, 100)}...`);
            }
        }

        try {
            const proxyResult = await ctx.service.proxy.proxyRequest(path, headers, body, method);
            
            // Set response status and headers
            ctx.status = proxyResult.status;
            ctx.logger.info(`代理响应状态码: ${proxyResult.status}`);

            if (proxyResult.headers) {
                // Set relevant headers from the proxied response
                for (const [key, values] of Object.entries(proxyResult.headers)) {
                    if (key.toLowerCase() !== "content-length") {
                        // Skip content-length as it might change
                        ctx.set(key, values[0]);
                    }
                }
            }

            // Set CORS headers
            ctx.set("Access-Control-Allow-Origin", "*");
            ctx.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            ctx.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
            ctx.set("Access-Control-Allow-Credentials", "true");
            ctx.set("Access-Control-Max-Age", "86400");

            // Set cache control headers for streaming support
            ctx.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
            ctx.set("Pragma", "no-cache");
            ctx.set("Expires", "0");

            // Set response body
            ctx.body = proxyResult.body;
            
            if (proxyResult.status >= 400) {
                // 对于错误响应，记录详细信息
                let errorDetails = '';
                if (proxyResult.body && proxyResult.body.length) {
                    try {
                        // 尝试解析响应体为JSON
                        const responseText = proxyResult.body.toString('utf8');
                        ctx.logger.error(`错误响应内容: ${responseText.substring(0, 200)}`);
                        errorDetails = responseText;
                    } catch (e) {
                        ctx.logger.error(`无法解析错误响应: ${e.message}`);
                    }
                }
                ctx.logger.error(`代理请求返回错误: ${proxyResult.status} ${errorDetails}`);
            } else {
                ctx.logger.info(`代理请求成功完成: ${proxyResult.status}`);
            }
            
        } catch (error) {
            ctx.logger.error(`代理请求处理异常:`);
            ctx.logger.error(`- 错误名称: ${error.name}`);
            ctx.logger.error(`- 错误消息: ${error.message}`);
            ctx.logger.error(`- 错误堆栈: ${error.stack}`);
            
            // 设置错误响应
            ctx.status = 500;
            ctx.body = {
                error: {
                    message: `代理请求处理失败: ${error.message}`,
                    code: error.code || 'INTERNAL_ERROR',
                    name: error.name
                }
            };
        }
    }
}

module.exports = ProxyController;
