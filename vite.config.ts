import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/koyomi-api": {
        target: "https://koyomi.zingsystem.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/koyomi-api/, "/api"),
      },
    },
  },
})
