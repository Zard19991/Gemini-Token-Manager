// config/config.default.js
module.exports = appInfo => {
    const config = (exports = {});

    // Use for cookie sign key
    config.keys = appInfo.name + "_your_key";

    // Add middleware
    config.middleware = ["auth"];

    // View configuration
    config.view = {
        defaultViewEngine: "nunjucks",
        mapping: {
            ".html": "nunjucks",
        },
    };

    // Security configuration
    config.security = {
        csrf: {
            enable: false, // Disable CSRF for API
        },
    };

    // Body parser
    config.bodyParser = {
        jsonLimit: "10mb",
        formLimit: "10mb",
    };

    // Static serve
    config.static = {
        prefix: "/",
        dir: require("path").join(appInfo.baseDir, "app/public"),
    };

    return config;
};
