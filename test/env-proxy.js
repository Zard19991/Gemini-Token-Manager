// 使用ES Module语法
import { GoogleGenAI } from "@google/genai";

// 设置环境变量
process.env.HTTP_PROXY = 'xxxxxx';
process.env.HTTPS_PROXY = 'xxxxxx';

// 创建主函数
async function main() {
    try {
        console.log("配置环境变量:");
        console.log(`- HTTP_PROXY: ${process.env.HTTP_PROXY}`);
        console.log(`- HTTPS_PROXY: ${process.env.HTTPS_PROXY}`);
        
        console.log("创建GoogleGenAI实例...");
        const genai = new GoogleGenAI({
            apiKey: "xxxx-KPlHX78FgfL8"
        });

        console.log("获取模型...");
        const model = genai.getGenerativeModel({ model: "gemini-pro" });

        console.log("发送请求...");
        const result = await model.generateContent("Hello, how are you?");
        const response = await result.response;
        console.log("响应内容:");
        console.log(response.text());
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