// 使用ES Module语法
import fetch from "node-fetch";
import HttpsProxyAgent from "https-proxy-agent";

// 创建主函数
async function main() {
    try {
        console.log("创建代理...");
        const proxyUrl = "xxxxxx";
        const proxyAgent = new HttpsProxyAgent(proxyUrl);

        console.log(`使用代理: ${proxyUrl}`);

        console.log("测试代理连接...");
        console.log("连接到 https://api.ipify.org?format=json");

        const response = await fetch("https://api.ipify.org?format=json", {
            agent: proxyAgent,
        });

        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("代理连接测试成功!");
        console.log(`当前IP地址: ${data.ip}`);

        // 测试Google API连接
        console.log("\n测试Google API连接...");
        console.log("连接到 https://generativelanguage.googleapis.com/v1/models");

        const googleResponse = await fetch("https://generativelanguage.googleapis.com/v1/models", {
            agent: proxyAgent,
        });

        console.log(`Google API状态码: ${googleResponse.status}`);

        if (googleResponse.ok) {
            console.log("Google API连接测试成功!");
        } else {
            console.log("Google API连接返回非200状态码 (这是正常的，因为我们没有提供API密钥)");
            const errorText = await googleResponse.text();
            console.log(`响应内容: ${errorText.substring(0, 200)}...`);
        }
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
main().catch((err) => {
    console.error("未捕获的错误:", err);
    process.exit(1);
});
