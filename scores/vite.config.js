import react from "@vitejs/plugin-react";
import * as path from "path";

/**
 * @type {import('vite').UserConfig}
 */
const config = {
  root: "./src/client",
  plugins: [react()],
  envPrefix: "PUBLIC_",
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        ws: true,
      },
    },
  },
  build: {
    outDir: path.join(__dirname, "dist"),
  },
};

export default config;
