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

        try {
            const proxyResult = await ctx.service.proxy.proxyRequest2(path, headers, body, method);

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
            ctx.set(
                "Access-Control-Allow-Headers",
                "Content-Type, Authorization, X-Requested-With"
            );
            ctx.set("Access-Control-Allow-Credentials", "true");
            ctx.set("Access-Control-Max-Age", "86400");

            // 检查是否为流式响应 (通过content-type头部判断)
            const isStreamResponse = proxyResult.headers && 
                proxyResult.headers['content-type'] && 
                proxyResult.headers['content-type'][0].includes('text/event-stream');
            
            if (isStreamResponse) {
                // 流式响应特殊处理
                ctx.logger.info("检测到流式响应，设置相应头部");
                ctx.set("Cache-Control", "no-cache");
                ctx.set("Connection", "keep-alive");
                ctx.set("Transfer-Encoding", "chunked");
                
                // 直接将响应体设置为流，不进行额外处理
                ctx.body = proxyResult.body;
                ctx.logger.info("流式响应已设置");
                
                // 重要：提前返回，不进行后续处理
                return;
            }
            
            // 非流式响应的缓存控制
            ctx.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
            ctx.set("Pragma", "no-cache");
            ctx.set("Expires", "0");

            // 设置非流式响应体
            ctx.body = proxyResult.body;

            if (proxyResult.status >= 400) {
                // 对于错误响应，记录详细信息
                let errorDetails = "";
                if (proxyResult.body && proxyResult.body.length) {
                    try {
                        // 尝试解析响应体为JSON
                        const responseText = proxyResult.body.toString("utf8");
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
                    code: error.code || "INTERNAL_ERROR",
                    name: error.name,
                },
            };
        }
    }
}

module.exports = ProxyController;
