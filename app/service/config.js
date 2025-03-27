// app/service/config.js
class ConfigService {
    constructor(ctx) {
        this.ctx = ctx;
        this.storage = ctx.service.storage;
        this.configFile = "config.json";
        this.config = null;
        this.defaultConfig = {
            api_key: "default-api-key",
            admin_username: "default-admin-username",
            admin_password: "default-admin-password",
            page_size: 12,
            access_control: "open",
            guest_password: "guest_password",
        };
    }

    async loadConfig() {
        if (this.config === null) {
            const data = await this.storage.readFile(this.configFile);
            this.config = data || { ...this.defaultConfig };
        }
        return this.config;
    }

    async saveConfig() {
        await this.storage.writeFile(this.configFile, this.config);
    }

    async getConfig() {
        await this.loadConfig();
        return this.config;
    }

    async getValue(key, defaultValue) {
        await this.loadConfig();
        return this.config[key] !== undefined ? this.config[key] : defaultValue;
    }

    async updateConfig(newConfig) {
        await this.loadConfig();
        this.config = { ...this.config, ...newConfig };
        await this.saveConfig();
        return this.config;
    }
}

module.exports = ConfigService;
