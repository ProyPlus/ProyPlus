const target = "http://72.60.11.35:8080";

module.exports = {
  // Auth: /api/auth/* -> /auth/*
  "/api/auth": {
    target,
    secure: false,
    changeOrigin: true,
    logLevel: "debug",
    pathRewrite: { "^/api/auth": "/auth" },
    onProxyReq: (proxyReq) => {
      // No mandar Authorization en /auth/*
      proxyReq.removeHeader("authorization");
    },
  },

  // Resto: mantener /api (SIN rewrite)
  "/api": {
    target,
    secure: false,
    changeOrigin: true,
    logLevel: "debug",
  },
};