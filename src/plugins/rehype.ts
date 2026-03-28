import type { Element, Root } from "hast";
import { visit } from "unist-util-visit";
import { h } from "hastscript";

export default function rehypeCodeWrapper() {
  return function (tree: Root) {
    visit(tree, "element", function (node, index, parent) {
      if (node.tagName != "pre") {
        return;
      }

      const noMenu = node.properties.noMenu === "true" || false;
      const filename = node.properties.file as string;

      if (noMenu) {
        return;
      }

      const linkUrl = node.properties.link as string | undefined;

      const linksRow = [
        h("span", { class: "copy-link-text" }, ""),
        h("a", { class: "copy-link" }, [h("img", { src: "/copy-icon.svg" })]),
      ];

      if (linkUrl) {
        linksRow.push(
          h(
            "a",
            {
              href: linkUrl,
              target: "_blank",
            },
            [h("img", { src: "/code-light-icon.svg" })],
          ),
        );
      }

      // Replace the original node with our new wrapper
      if (parent && index != null) {
        parent.children[index] = h("div.code-container", [
          node,
          h("div.code-footer", [
            h("div.code-filename", [filename]),
            h("div.code-links", linksRow),
          ]),
        ]);
      }
    });
  };
}
