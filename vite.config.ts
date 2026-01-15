import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Two modes:
 * - default (dev/build): demo app (index.html) that renders <react-widget> + mock Jmix panel
 * - lib mode (build:lib): outputs dist/react-widget.js (LitElement webcomponent) for embedding into Jmix
 */
export default defineConfig(({ mode }) => {
  const isLib = mode === "lib";

  if (isLib) {
    return {
      plugins: [react()],
      build: {
        lib: {
          entry: "src/main-lib.ts",
          name: "MetaReactWidget",
          formats: ["es"],
          fileName: () => "react-widget.js",
        },
        // bundle everything for simplest embedding
        rollupOptions: {
          external: [],
          output: {
            format: "es",
          },
        },
      },
      esbuild: {
        jsx: "automatic",
      },
    };
  }

  return {
    plugins: [react()],
  };
});
