import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "router-vendor": ["react-router-dom"],
          "ui-vendor": ["lucide-react", "framer-motion"],
          "network-vendor": ["axios"],
        },
      },
    },
  },
});

