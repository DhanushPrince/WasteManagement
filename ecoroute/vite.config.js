import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import vitePluginS3Dataset from "./vite-plugin-s3-dataset.js";
export default defineConfig({
  plugins: [react(), vitePluginS3Dataset()],
  server: {
    port: Number.parseInt(process.env.PORT || "5173", 10),
    strictPort: false,
  },
});
