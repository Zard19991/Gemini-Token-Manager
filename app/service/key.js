// app/service/key.js
class KeyService {
    constructor(ctx) {
        this.ctx = ctx;
        this.storage = ctx.service.storage;
        this.keysFile = "keys.json";
        this.keys = null;
    }

    async loadKeys() {
        if (this.keys === null) {
            const data = await this.storage.readFile(this.keysFile);
            this.keys = data || [];
        }
        return this.keys;
    }

    async saveKeys() {
        await this.storage.writeFile(this.keysFile, this.keys);
    }

    async getAllKeys() {
        await this.loadKeys();
        return this.keys;
    }

    async addKey(key, balance = 0) {
        await this.loadKeys();
        const now = new Date().toISOString();

        // Create key object
        const keyObj = {
            key,
            balance,
            added: now,
            lastUpdated: null,
        };

        // Check if key already exists
        const existingIndex = this.keys.findIndex(k => k.key === key);
        if (existingIndex >= 0) {
            this.keys[existingIndex] = { ...this.keys[existingIndex], ...keyObj };
        } else {
            this.keys.push(keyObj);
        }

        await this.saveKeys();
        return keyObj;
    }

    async addKeys(keys, balance = 0) {
        await this.loadKeys();
        const now = new Date().toISOString();
        const addedKeys = [];

        for (const key of keys) {
            if (!key) continue;

            const keyObj = {
                key,
                balance,
                added: now,
                lastUpdated: null,
            };

            // Check if key already exists
            const existingIndex = this.keys.findIndex(k => k.key === key);
            if (existingIndex >= 0) {
                this.keys[existingIndex] = { ...this.keys[existingIndex], ...keyObj };
            } else {
                this.keys.push(keyObj);
            }

            addedKeys.push(key);
        }

        await this.saveKeys();
        return addedKeys;
    }

    async deleteKey(key) {
        await this.loadKeys();
        const initialLength = this.keys.length;
        this.keys = this.keys.filter(k => k.key !== key);

        if (this.keys.length !== initialLength) {
            await this.saveKeys();
            return true;
        }
        return false;
    }

    async updateKeyBalance(key, balance, message = null) {
        await this.loadKeys();
        const keyIndex = this.keys.findIndex(k => k.key === key);

        if (keyIndex === -1) {
            return null;
        }

        this.keys[keyIndex].balance = balance;
        this.keys[keyIndex].lastUpdated = new Date().toISOString();

        if (message) {
            this.keys[keyIndex].lastError = message;
        } else {
            delete this.keys[keyIndex].lastError;
        }

        await this.saveKeys();
        return this.keys[keyIndex];
    }
}

module.exports = KeyService;
