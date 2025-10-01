const target = "http://gestor-usuarios:8080"; // 👈 nombre del servicio del back

module.exports = {
  // Login: /api/auth/* -> /auth/*
  "/api/auth": {
    target,
    secure: false,
    changeOrigin: true,
    logLevel: "debug",
    pathRewrite: { "^/api/auth": "/auth" },
    onProxyReq: (proxyReq) => {
      // Evitar que pase Authorization (Basic/Bearer) al login
      proxyReq.removeHeader("authorization");
    },
  },

  // Resto: mantener /api/* tal cual (pasa Bearer)
  "/api": {
    target,
    secure: false,
    changeOrigin: true,
    logLevel: "debug",
  },
};