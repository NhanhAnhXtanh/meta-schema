import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    "process.env": {},
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/custom-schema-element.tsx"),
      name: "CustomSchema",
      fileName: () => "meta-schema.js",
      formats: ["es"],
    },
    rollupOptions: {
      external: [],
    },
  },
})
