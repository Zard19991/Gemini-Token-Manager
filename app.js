// app.js - Egg.js 应用启动生命周期文件
const fs = require('fs').promises;
const path = require('path');

class AppBootHook {
  constructor(app) {
    this.app = app;
  }

  // 在所有的配置加载完成后，插件启动之前执行
  async configWillLoad() {
    // 此阶段配置文件已经被读取和合并，但是还未生效
  }

  // 所有的配置已经加载完成，可以用来加载应用自定义的文件，启动自定义的服务
  async didLoad() {
    // 初始化配置文件和密钥文件
    await this.initialize();
  }

  // 所有的插件都已启动完毕，但是应用整体还未 ready
  async willReady() {
    // 可以做一些数据初始化等操作
  }

  // 应用已经启动完毕
  async didReady() {
    // 应用已经启动完毕
    this.app.logger.info('应用初始化完成，服务已启动');
  }

  // 应用即将关闭
  async beforeClose() {
    // 应用即将关闭
  }

  // 初始化配置和密钥文件
  async initialize() {
    const dataDir = path.join(this.app.baseDir, 'data');
    const configFile = path.join(dataDir, 'config.json');
    const keysFile = path.join(dataDir, 'keys.json');

    // 确保数据目录存在
    try {
      await fs.mkdir(dataDir, { recursive: true });
      this.app.logger.info('数据目录创建成功或已存在');
    } catch (err) {
      this.app.logger.error('创建数据目录失败:', err);
      return;
    }

    // 初始化配置文件
    try {
      let configExists = false;
      try {
        const stat = await fs.stat(configFile);
        configExists = stat.size > 0;
      } catch (err) {
        // 文件不存在或无法访问
      }

      if (!configExists) {
        const defaultConfig = {
          api_key: 'linuxdo',
          admin_username: 'linuxdo',
          admin_password: 'linuxdo',
          page_size: 12,
          access_control: 'open',
          guest_password: 'linuxdo',
          http_proxy: '',
        };

        await fs.writeFile(configFile, JSON.stringify(defaultConfig, null, 2), 'utf8');
        this.app.logger.info('配置文件初始化成功');
      }
    } catch (err) {
      this.app.logger.error('初始化配置文件失败:', err);
    }

    // 初始化密钥文件
    try {
      let keysExists = false;
      try {
        const stat = await fs.stat(keysFile);
        keysExists = stat.size > 0;
      } catch (err) {
        // 文件不存在或无法访问
      }

      if (!keysExists) {
        await fs.writeFile(keysFile, JSON.stringify([], null, 2), 'utf8');
        this.app.logger.info('密钥文件初始化成功');
      }
    } catch (err) {
      this.app.logger.error('初始化密钥文件失败:', err);
    }
  }
}

module.exports = AppBootHook; 