import type { ShikiTransformer } from "shiki";

export default function shikiCodeMetadata(): ShikiTransformer {
  return {
    pre(node) {
      // The metadata string is available in this.options.meta.__raw
      const meta = this.options.meta?.__raw;

      if (meta == undefined) {
        return;
      }

      const attributes = meta.split("|").filter(Boolean);

      for (const attr of attributes) {
        const [key, value] = attr.split("=", 2);

        if (!key) {
          continue;
        }

        node.properties[key] = value;
      }
    },
  };
}
