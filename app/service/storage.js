// app/service/storage.js
const fs = require("fs").promises;
const path = require("path");

class StorageService {
    constructor(ctx) {
        this.ctx = ctx;
        this.dataDir = path.join(process.cwd(), "data");
    }

    async ensureDataDir() {
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
        } catch (err) {
            this.ctx.logger.error("Failed to create data directory:", err);
        }
    }
    // app/service/storage.js
    async readFile(filename) {
        const filePath = path.join(this.dataDir, filename);
        try {
            await this.ensureDataDir();
            const exists = await fs
                .access(filePath)
                .then(() => true)
                .catch(() => false);

            if (!exists) {
                // Return default empty data based on filename
                if (filename === "config.json") {
                    return {
                        api_key: "linuxdo",
                        admin_username: "linuxdo",
                        admin_password: "linuxdo",
                        page_size: 12,
                        access_control: "open",
                        guest_password: "linuxdo",
                    };
                }
                return filename === "keys.json" ? [] : null;
            }

            const data = await fs.readFile(filePath, "utf8");
            if (!data || data.trim() === "") {
                // Handle empty file case
                return filename === "config.json" ? {} : [];
            }

            return JSON.parse(data);
        } catch (err) {
            this.ctx.logger.error(`Failed to read file ${filename}:`, err);
            // Return default empty data based on filename
            if (filename === "config.json") {
                return {};
            }
            return [];
        }
    }

    async writeFile(filename, data) {
        await this.ensureDataDir();
        const filePath = path.join(this.dataDir, filename);
        const tempPath = `${filePath}.tmp`;

        // Write to temporary file first to ensure atomic operation
        await fs.writeFile(tempPath, JSON.stringify(data, null, 2), "utf8");
        // Rename it to replace the original file (atomic operation)
        await fs.rename(tempPath, filePath);
    }
}

module.exports = StorageService;
