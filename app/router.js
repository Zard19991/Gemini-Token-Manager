// app/router.js
module.exports = app => {
    const { router, controller } = app;

    // Main interface
    router.get("/", controller.home.index);

    // API routes for main interface
    router.get("/admin/api/pageSize", controller.home.pageSize);
    router.get("/admin/api/keys", controller.home.keys);
    router.get("/admin/api/access-control", controller.home.accessControl);
    router.post("/admin/api/verify-guest", controller.home.verifyGuest);

    // Admin interface
    router.get("/admin", controller.admin.index);
    router.get("/admin/", controller.admin.index);

    // Admin API routes
    router.get("/admin/api/config", controller.admin.getConfig);
    router.post("/admin/api/update-config", controller.admin.updateConfig);
    router.post("/admin/api/add-key", controller.admin.addKey);
    router.post("/admin/api/add-keys-bulk", controller.admin.addKeysBulk);
    router.post("/admin/api/delete-key", controller.admin.deleteKey);
    router.post("/admin/api/update-key-balance", controller.admin.updateKeyBalance);
    router.post("/admin/api/update-keys-balance", controller.admin.updateKeysBalance);
    router.post("/admin/api/batch-update-keys", controller.admin.batchUpdateKeys);
    // API proxy routes
    router.all("/v1/*", controller.proxy.handleProxy);
    router.all("/v1beta/*", controller.proxy.handleProxy);

    // CORS preflight
    router.options("/*", controller.home.handleOptions);
};
