// @ts-check

import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://mariannefeng.com",
  adapter: vercel(),
  integrations: [react(), mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      theme: "andromeeda",
      wrap: true,
    },
  },
});
