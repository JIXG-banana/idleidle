import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "framer-motion"],
          "vendor-utils": [
            "break_infinity.js",
            "crypto-js",
            "i18next",
            "react-i18next",
          ],
        },
      },
    },
  },
});
