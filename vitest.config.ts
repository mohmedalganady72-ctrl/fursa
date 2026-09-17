import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node", // اختبارات منطق الأعمال البحت (matching, cv-parsing) لا تحتاج DOM
    include: ["tests/unit/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@/app": path.resolve(__dirname, "./app"),
      "@/components": path.resolve(__dirname, "./components"),
      "@/features": path.resolve(__dirname, "./features"),
      "@/lib": path.resolve(__dirname, "./lib"),
      "@/hooks": path.resolve(__dirname, "./hooks"),
      "@/styles": path.resolve(__dirname, "./styles"),
      "@/types": path.resolve(__dirname, "./types"),
    },
  },
});
