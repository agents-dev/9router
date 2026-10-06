import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

const config = {
  resolve: {
    alias: {
      "@": `${root}src`,
      "open-sse": `${root}open-sse`,
    },
  },
};

export default config;
