import { renderToString } from "react-dom/server";
import PublicPages, { pages, SITE_BASE, SITE_ORIGIN, type PageId } from "../app/public-pages.tsx";
import type { SiteContent } from "../lib/content.ts";

export { pages, SITE_BASE, SITE_ORIGIN };
export {youtubeEmbed} from "../lib/content.ts";
export {pageSEO,structuredData,allPublicVideos,videoDescription,videoHref} from "../lib/site-seo.ts";
export { initialContent } from "../lib/initial-content.ts";
export function renderPublicPage(content: SiteContent, page: PageId, videoId?:string) {
  return renderToString(<PublicPages content={content} page={page} videoId={videoId} />);
}

