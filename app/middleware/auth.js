// app/middleware/auth.js
module.exports = () => {
    return async function auth(ctx, next) {
        const path = ctx.path;

        // Admin API routes need admin authentication
        if (path.startsWith("/admin/api/")) {
            // Special cases without auth
            if (
                path === "/admin/api/pageSize" ||
                path === "/admin/api/access-control" ||
                path === "/admin/api/verify-guest"
            ) {
                await next();
                return;
            }

            // Keys endpoint might need guest auth
            if (path === "/admin/api/keys") {
                // Try admin auth first
                if (await authenticateAdmin(ctx)) {
                    await next();
                    return;
                }

                // Try guest auth
                if (await authenticateGuest(ctx)) {
                    await next();
                    return;
                }

                // Authentication failed
                ctx.status = 401;
                ctx.body = {
                    success: false,
                    message: "需要认证",
                    requireAuth: true,
                    accessControl: await ctx.service.config.getValue("access_control", "open"),
                };
                return;
            }

            // Admin-only endpoints
            if (!(await authenticateAdmin(ctx))) {
                ctx.status = 401;
                ctx.body = {
                    success: false,
                    message: "管理员认证失败",
                };
                return;
            }
        }

        // Admin interface needs admin authentication
        if (path === "/admin" || path === "/admin/") {
            if (!(await authenticateAdmin(ctx))) {
                ctx.status = 401;
                ctx.set("WWW-Authenticate", 'Basic realm="Admin Interface"');
                ctx.body = "Unauthorized";
                return;
            }
        }

        // API proxy routes need API key
        if (path.startsWith("/v1/") || path.startsWith("/v1beta/")) {
            const authHeader = ctx.get("Authorization");
            if (!authHeader) {
                ctx.status = 401;
                ctx.body = {
                    error: { message: "需要认证" },
                };
                return;
            }

            const providedToken = authHeader.replace("Bearer ", "").trim();
            const apiKey = await ctx.service.config.getValue("api_key", "default-api-key");

            if (providedToken !== apiKey) {
                ctx.status = 401;
                ctx.body = {
                    error: { message: "无效的API密钥" },
                };
                return;
            }
        }

        await next();
    };

    // Helper function to authenticate admin
    async function authenticateAdmin(ctx) {
        const authHeader = ctx.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Basic ")) {
            return false;
        }

        const adminUsername = await ctx.service.config.getValue(
            "admin_username",
            "default-admin-username"
        );
        const adminPassword = await ctx.service.config.getValue(
            "admin_password",
            "default-admin-password"
        );

        const encodedCredentials = authHeader.split(" ")[1];
        const decodedCredentials = Buffer.from(encodedCredentials, "base64").toString();
        const [username, password] = decodedCredentials.split(":");

        return username === adminUsername && password === adminPassword;
    }

    // Helper function to authenticate guest
    async function authenticateGuest(ctx) {
        const accessControl = await ctx.service.config.getValue("access_control", "open");


        // If fully open, allow access
        if (accessControl === "open") {
            return true;
        }

        // If fully private, only admins can access
        if (accessControl === "private") {
            return await authenticateAdmin(ctx);
        }

        // Restricted mode, check guest password
        if (accessControl === "restricted") {
            const authHeader = ctx.get("Authorization");

            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                console.warn("Authorization头格式不正确或不存在");
                return false;
            }

            const guestToken = authHeader.replace("Bearer ", "").trim();
            const guestPassword = await ctx.service.config.getValue(
                "guest_password",
                "guest_password"
            );

            // 不输出实际密码，但输出匹配结果
            const matched = guestToken === guestPassword;

            return matched;
        }

        // Default deny
        console.warn("默认拒绝访问，访问控制模式:", accessControl);
        return false;
    }
};
