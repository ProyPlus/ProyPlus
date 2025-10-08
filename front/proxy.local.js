const target = "http://72.60.11.35:8080";

module.exports = {
  // ✅ SOLO login (y register si aplica) se reescriben a /auth/*
  "/api/auth/login": {
    target,
    secure: false,
    changeOrigin: true,
    logLevel: "debug",
    pathRewrite: { "^/api/auth/login": "/auth/login" },
    onProxyReq: (proxyReq) => proxyReq.removeHeader("authorization"),
  },
  // (opcional)
  "/api/auth/register": {
    target,
    secure: false,
    changeOrigin: true,
    logLevel: "debug",
    pathRewrite: { "^/api/auth/register": "/auth/register" },
    onProxyReq: (proxyReq) => proxyReq.removeHeader("authorization"),
  },

  // ✅ TODO lo demás se mantiene igual (incluye /api/auth/forgot-password)
  "/api": {
    target,
    secure: false,
    changeOrigin: true,
    logLevel: "debug",
  },
};
