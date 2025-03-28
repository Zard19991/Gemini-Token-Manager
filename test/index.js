import OpenAI from "openai";
import HttpsProxyAgent from "https-proxy-agent";

// 创建主函数
async function main() {
    try {
        console.log("设置代理...");
        const proxyUrl = 'xxxxxx';
        const proxyAgent = new HttpsProxyAgent(proxyUrl);
        console.log(`使用代理: ${proxyUrl}`);

        console.log("创建OpenAI实例(连接到Gemini)...");
        const openai = new OpenAI({
            apiKey: "xxxxxx",
            baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
            httpAgent: proxyAgent
        });

        console.log("发送请求...");
        const response = await openai.chat.completions.create({
            model: "gemini-1.5-flash",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: "Hello, how are you?" }
            ]
        });

        console.log("响应内容:");
        console.log(response.choices[0].message);
    } catch (error) {
        console.error("错误:");
        console.error(`- 错误名称: ${error.name}`);
        console.error(`- 错误消息: ${error.message}`);
        console.error(`- 错误堆栈: ${error.stack}`);

        if (error.code) {
            console.error(`- 错误代码: ${error.code}`);
        }

        if (error.cause) {
            console.error(`- 错误原因:`, error.cause);
        }
    }
}

// 执行主函数
main().catch(err => {
    console.error("未捕获的错误:", err);
    process.exit(1);
});
