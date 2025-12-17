import type { CollectionEntry } from "astro:content";

/**
 * Sorts portfolio entries by publication date (newest first).
 * Items without a pubDate are treated as having a date of 0
 */
export function sortPortfolioByDate(
  a: CollectionEntry<"portfolio">,
  b: CollectionEntry<"portfolio">
): number {
  return (b.data.pubDate?.valueOf() ?? 0) - (a.data.pubDate?.valueOf() ?? 0);
}
