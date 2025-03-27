# 贡献指南

感谢您考虑为Gemini Token Manager项目做出贡献！以下是一些指导原则，以帮助您开始。

## 行为准则

本项目采用[贡献者公约](https://www.contributor-covenant.org/version/2/0/code_of_conduct/)行为准则。通过参与，您需要遵守此行为准则。

## 如何贡献

### 报告Bug

如果您发现了一个bug，请使用GitHub Issues创建一个详细的报告。请包含：

- 问题的简明标题
- 重现问题的详细步骤
- 您期望的行为
- 实际发生的行为
- 相关的截图或日志（如有）
- 您的环境信息（操作系统、Docker版本等）

### 建议新功能

对于功能建议，同样使用GitHub Issues提交您的想法。提供：

- 清晰的功能描述
- 此功能将解决的问题或改进
- 您认为实现此功能的可能方法（如果有）

### 提交代码

1. 首先在GitHub上Fork此仓库
2. 克隆您的Fork到本地
   ```bash
   git clone https://github.com/your-username/Gemini-Token-Manager.git
   ```
3. 创建一个新的分支
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. 进行您的更改
5. 确保代码符合项目风格并通过测试
   ```bash
   npm test
   ```
6. 提交您的更改
   ```bash
   git commit -m "描述性的提交信息"
   ```
7. 推送到您的Fork
   ```bash
   git push origin feature/your-feature-name
   ```
8. 在GitHub上创建一个Pull Request

## 代码风格

- 请遵循项目现有的代码风格
- 使用有意义的变量名和函数名
- 添加必要的注释，特别是对于复杂的逻辑
- 保持代码简洁，遵循DRY（不要重复自己）原则

## Pull Request流程

1. 确保您的PR描述了您所做的更改及其目的
2. 如果PR关联到某个issue，请在PR描述中提及（例如"Fixes #123"）
3. 更新相关文档（如README.md）以反映您的更改
4. 项目维护者将审查您的PR，可能会要求进行一些修改
5. 一旦您的PR被批准，它将被合并到主分支

## 开发设置

请参考README.md中的开发指南部分进行环境设置。

---

再次感谢您的贡献！