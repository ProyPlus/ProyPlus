const target = "http://gestor-usuarios:8080";

module.exports = {
  "/api/auth/login": {
    target,
    secure: false,
    changeOrigin: true,
    logLevel: "debug",
    pathRewrite: { "^/api/auth/login": "/auth/login" },
    onProxyReq: (proxyReq) => proxyReq.removeHeader("authorization"),
  },
  "/api/auth/register": {
    target,
    secure: false,
    changeOrigin: true,
    logLevel: "debug",
    pathRewrite: { "^/api/auth/register": "/auth/register" },
    onProxyReq: (proxyReq) => proxyReq.removeHeader("authorization"),
  },
  "/api": {
    target,
    secure: false,
    changeOrigin: true,
    logLevel: "debug",
  },
};
