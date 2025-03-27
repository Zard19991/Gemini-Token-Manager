// Create a script to initialize configuration
// app/init.js
const fs = require("fs").promises;
const path = require("path");

async function initialize() {
    const dataDir = path.join(process.cwd(), "data");
    const configFile = path.join(dataDir, "config.json");
    const keysFile = path.join(dataDir, "keys.json");

    // Ensure data directory exists
    try {
        await fs.mkdir(dataDir, { recursive: true });
        console.log("Data directory created or already exists");
    } catch (err) {
        console.error("Failed to create data directory:", err);
        return;
    }

    // Initialize config file if it doesn't exist or is empty
    try {
        let configExists = false;
        try {
            const stat = await fs.stat(configFile);
            configExists = stat.size > 0;
        } catch (err) {
            // File doesn't exist or can't be accessed
        }

        if (!configExists) {
            const defaultConfig = {
                api_key: "default-api-key",
                admin_username: "default-admin-username",
                admin_password: "default-admin-password",
                page_size: 12,
                access_control: "open",
                guest_password: "guest_password",
                http_proxy: "",
            };

            await fs.writeFile(configFile, JSON.stringify(defaultConfig, null, 2), "utf8");
            console.log("Config file initialized");
        }
    } catch (err) {
        console.error("Failed to initialize config file:", err);
    }

    // Initialize keys file if it doesn't exist or is empty
    try {
        let keysExists = false;
        try {
            const stat = await fs.stat(keysFile);
            keysExists = stat.size > 0;
        } catch (err) {
            // File doesn't exist or can't be accessed
        }

        if (!keysExists) {
            await fs.writeFile(keysFile, JSON.stringify([], null, 2), "utf8");
            console.log("Keys file initialized");
        }
    } catch (err) {
        console.error("Failed to initialize keys file:", err);
    }
}

initialize().catch(console.error);
