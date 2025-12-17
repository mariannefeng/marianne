import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE_DESCRIPTION, SITE_TITLE } from "../consts";
import { sortPortfolioByDate } from "../portfolio";

export async function GET(context: any) {
  const posts = (await getCollection("portfolio")).sort(sortPortfolioByDate);

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/portfolio/${post.id}/`,
    })),
  });
}
