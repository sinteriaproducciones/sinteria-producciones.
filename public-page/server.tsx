import { renderToString } from "react-dom/server";
import PublicPages, { pages, SITE_BASE, SITE_ORIGIN, type PageId } from "../app/public-pages.tsx";
import type { SiteContent } from "../lib/content.ts";

export { pages, SITE_BASE, SITE_ORIGIN };
export function renderPublicPage(content: SiteContent, page: PageId) {
  return renderToString(<PublicPages content={content} page={page} />);
}

