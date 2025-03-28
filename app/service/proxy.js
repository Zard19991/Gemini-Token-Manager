// app/service/proxy.js
const { URL } = require("url");
const fetch = require("node-fetch");
const HttpsProxyAgent = require("https-proxy-agent");
const { OpenAI } = require("openai");

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

            return {
                status: response.status,
                headers: response.headers.raw(),
                body: responseBuffer,
            };
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

    async proxyRequest2(path, headers, body, method) {
        // 获取所有有效的API密钥进行负载均衡
        const keys = await this.ctx.service.key.getAllKeys();
        const validKeys = keys.filter(k => parseFloat(k.balance) > 0);

        if (validKeys.length === 0) {
            return {
                status: 503,
                body: JSON.stringify({
                    error: { message: "没有可用的API密钥" },
                }),
            };
        }

        // 负载均衡 - 随机选择一个密钥
        const randomIndex = Math.floor(Math.random() * validKeys.length);
        const selectedKey = validKeys[randomIndex].key;
        this.ctx.logger.info(`使用API密钥: ${selectedKey.substring(0, 5)}...`);
        this.ctx.logger.info(`接收到的请求: ${path}`);

        try {
            // 获取HTTP代理配置
            const config = await this.ctx.service.config.get();

            // 创建代理配置
            let httpAgent = null;
            if (config.httpProxy) {
                this.ctx.logger.info(`使用HTTP代理: ${config.httpProxy}`);
                httpAgent = new HttpsProxyAgent(config.httpProxy);
            }

            // 解析请求体
            let requestBody = body;
            if (typeof body === "string") {
                try {
                    requestBody = JSON.parse(body);
                    this.ctx.logger.info("已将字符串请求体解析为JSON对象");
                } catch (e) {
                    this.ctx.logger.error(`无法解析请求体为JSON: ${e.message}`);
                    // 保持字符串格式
                }
            }

            // 检查是否为流式请求
            const isStreamRequest = requestBody && requestBody.stream === true;
            this.ctx.logger.info(`是否为流式请求: ${isStreamRequest}`);

            // 创建OpenAI客户端
            const openai = new OpenAI({
                apiKey: selectedKey,
                baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
                httpAgent: httpAgent,
            });

            this.ctx.logger.info(`OpenAI客户端创建成功, baseURL: ${openai.baseURL}`);

            // 确定API调用路径和方法
            let apiPath = path;
            if (path.startsWith("/v1/")) {
                // 移除前缀 /v1/ 以适配 OpenAI 客户端
                apiPath = path.substring(4);
            }

            this.ctx.logger.info(`API调用路径: ${apiPath}, 方法: ${method}`);

            // 对于聊天完成请求，特殊处理流式请求
            if (apiPath.includes("chat/completions") && isStreamRequest) {
                this.ctx.logger.info("处理流式聊天完成请求，使用OpenAI客户端");
                
                try {
                    // 使用OpenAI客户端的流式API
                    const stream = await openai.chat.completions.create({
                        ...requestBody,
                        stream: true
                    });
                    
                    this.ctx.logger.info("流式请求已初始化，开始处理流");
                    
                    // 创建一个PassThrough流
                    const { PassThrough } = require('stream');
                    const passThrough = new PassThrough();
                    
                    // 启动一个异步处理过程来处理流
                    (async () => {
                        const logger = this.ctx.logger;
                        try {
                            // 跟踪一下已经处理的token数量，用于日志
                            let tokenCount = 0;
                            
                            // 迭代流中的每个块
                            for await (const chunk of stream) {
                                tokenCount++;
                                
                                // 确保即时发送每个token
                                // 使用即时刷新的方式发送数据
                                const text = `data: ${JSON.stringify(chunk)}\n\n`;
                                passThrough.write(text);
                                
                                // 每5个token记录一次日志，避免日志过多
                                if (tokenCount % 5 === 0) {
                                    logger.info(`已发送 ${tokenCount} 个流块`);
                                }
                                
                                // 添加一个小延迟确保流块被分开发送
                                // 这会减慢响应速度，但可以确保更小的块
                                // 如果不需要，可以移除此行
                                // await new Promise(resolve => setTimeout(resolve, 5));
                            }
                            
                            // 发送结束标记
                            passThrough.write('data: [DONE]\n\n');
                            logger.info(`流处理完成，共发送 ${tokenCount} 个流块`);
                            
                            // 结束流
                            passThrough.end();
                        } catch (error) {
                            logger.error(`流处理错误: ${error.message}`);
                            // 尝试发送错误信息到客户端
                            try {
                                const errorMsg = `data: {"error": {"message": "${error.message}"}}\n\n`;
                                passThrough.write(errorMsg);
                            } catch (e) {
                                // 忽略写入错误
                            }
                            passThrough.end();
                        }
                    })().catch(error => {
                        this.ctx.logger.error(`流处理异步函数出错: ${error.message}`);
                        passThrough.end();
                    });
                    
                    // 返回流响应
                    return {
                        status: 200,
                        headers: {
                            "content-type": ["text/event-stream"],
                            "cache-control": ["no-cache"],
                            "connection": ["keep-alive"],
                            // 显式禁用压缩
                            "content-encoding": ["identity"]
                        },
                        body: passThrough
                    };
                } catch (streamError) {
                    this.ctx.logger.error(`流式初始化错误: ${streamError.message}`);
                    // 如果流式请求失败，则返回错误响应
                    return {
                        status: 500,
                        body: JSON.stringify({
                            error: {
                                message: `流式请求失败: ${streamError.message}`,
                                code: streamError.code || "STREAM_ERROR"
                            }
                        })
                    };
                }
            }

            // 非流式请求处理
            let response;

            if (apiPath.includes("chat/completions")) {
                this.ctx.logger.info(`执行聊天完成请求: ${JSON.stringify(requestBody.messages?.[0] || {})}`);
                response = await openai.chat.completions.create(requestBody);
            } else if (apiPath.includes("completions") && !apiPath.includes("chat")) {
                this.ctx.logger.info(`执行文本完成请求`);
                response = await openai.completions.create(requestBody);
            } else if (apiPath.includes("embeddings")) {
                this.ctx.logger.info(`执行嵌入请求`);
                response = await openai.embeddings.create(requestBody);
            } else if (apiPath.includes("models")) {
                this.ctx.logger.info(`执行模型列表请求`);
                response = await openai.models.list();
            } else {
                // 对于不支持的API，使用通用HTTP请求方法
                this.ctx.logger.warn(`未明确支持的API路径: ${apiPath}，使用通用HTTP方法处理`);

                // 创建目标URL
                const targetUrl = `https://generativelanguage.googleapis.com/v1beta/openai${apiPath}?key=${selectedKey}`;

                // 处理请求头
                const processedHeaders = { ...headers };
                delete processedHeaders.host;
                delete processedHeaders.authorization;

                if (typeof requestBody !== "string" && requestBody) {
                    processedHeaders["content-type"] = "application/json";
                }

                // 创建请求配置
                const fetchOptions = {
                    method: method || "GET",
                    headers: processedHeaders,
                    agent: httpAgent,
                };

                if (requestBody) {
                    fetchOptions.body =
                        typeof requestBody === "string" ? requestBody : JSON.stringify(requestBody);
                }

                // 发送请求
                const fetchResponse = await fetch(targetUrl, fetchOptions);
                const buffer = await fetchResponse.buffer();

                return {
                    status: fetchResponse.status,
                    headers: fetchResponse.headers.raw(),
                    body: buffer,
                };
            }

            this.ctx.logger.info(`API调用成功，响应类型: ${typeof response}`);

            // 将响应转换为Buffer
            const responseBuffer = Buffer.from(JSON.stringify(response), "utf-8");

            return {
                status: 200,
                headers: {
                    "content-type": ["application/json"],
                },
                body: responseBuffer,
            };
        } catch (error) {
            // 增强错误日志
            this.ctx.logger.error("OpenAI代理请求错误详情:");
            this.ctx.logger.error(`- 错误名称: ${error.name}`);
            this.ctx.logger.error(`- 错误消息: ${error.message}`);
            this.ctx.logger.error(`- 错误堆栈: ${error.stack}`);

            if (error.code) {
                this.ctx.logger.error(`- 错误代码: ${error.code}`);
            }

            if (error.cause) {
                this.ctx.logger.error(`- 错误原因: ${JSON.stringify(error.cause)}`);
            }

            // 解析错误状态码
            let statusCode = 500;
            let errorBody = {
                error: {
                    message: `代理请求失败: ${error.message}`,
                    code: error.code || "UNKNOWN_ERROR",
                    name: error.name,
                },
            };

            // 检查是否为OpenAI错误
            if (error.status) {
                statusCode = error.status;
            }

            if (error.response) {
                try {
                    const errorData = error.response.data;
                    if (errorData) {
                        errorBody = errorData;
                    }
                } catch (e) {
                    this.ctx.logger.error(`无法解析错误响应: ${e.message}`);
                }
            }

            return {
                status: statusCode,
                body: JSON.stringify(errorBody),
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
