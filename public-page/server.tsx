import { renderToString } from "react-dom/server";
import PublicSite from "../app/public-site.tsx";
import type { SiteContent } from "../lib/content.ts";

export function renderPublicPage(content: SiteContent, dataOrigin: string) {
  return renderToString(<PublicSite initialContent={content} apiOrigin={dataOrigin} adminHref={`${dataOrigin}/admin`} />);
}
