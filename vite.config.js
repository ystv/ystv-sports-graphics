import react from '@vitejs/plugin-react'

/**
 * @type {import('vite').UserConfig}
 */
 const config = {
    "root": "./src/client",
    plugins: [react()],
    envPrefix: "PUBLIC_",
    server: {
        proxy: {
            "/api": {
                "target": "http://localhost:8000"
            }
        }
    }
};

export default config;
