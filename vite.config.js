import { defineConfig } from "vite";
//import { viteSingleFile } from "vite-plugin-singlefile";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()/*, viteSingleFile()*/],
  build: {
    chunkSizeWarningLimit: 1000,
    /*
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("framer-motion")) {
              return "vendor-react";
            }
            if (
              id.includes("break_infinity.js") ||
              id.includes("crypto-js") ||
              id.includes("i18next")
            ) {
              return "vendor-utils";
            }
          }
        },
      },
    },*/
  },
});
