import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Load .env files so OPENAI_API_KEY can be read in this config
  const env = loadEnv(mode, process.cwd(), "");
  if (env.OPENAI_API_KEY) {
    process.env.OPENAI_API_KEY = env.OPENAI_API_KEY;
  }

  return {
    plugins: [react()],
    server: {
      proxy: {
        // Proxy OpenAI API during local development to avoid CORS
        "/api/openai": {
          target: "https://api.openai.com",
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/openai/, "/v1/chat/completions"),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              const key = process.env.OPENAI_API_KEY || "";
              if (key) {
                proxyReq.setHeader("Authorization", `Bearer ${key}`);
              }
              proxyReq.setHeader("Content-Type", "application/json");
            });
          },
        },
      },
    },
  };
});
