import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
      // `import text from "./file.txt?raw"` gives the file's text (the 2016 example machine).
      "*.txt": {
        condition: { query: "?raw" },
        type: "raw",
      },
    },
  },
};

// Reads src/i18n/request.ts, so every page gets its language and messages.
const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
