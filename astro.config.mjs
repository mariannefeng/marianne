// @ts-check

import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import { defineConfig } from "astro/config";
import shikiCodeMetadata from "./src/plugins/shiki";
import rehypeCodeWrapper from "./src/plugins/rehype";

export default defineConfig({
  site: "https://mariannefeng.com",
  adapter: vercel(),
  integrations: [react(), mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      transformers: [shikiCodeMetadata()],
      theme: "andromeeda",
      wrap: true,
    },
    rehypePlugins: [rehypeCodeWrapper],
  },
});
