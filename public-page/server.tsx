import { renderToString } from "react-dom/server";
import PublicSite from "../app/public-site.tsx";
import type { SiteContent } from "../lib/content.ts";

export function renderPublicPage(content: SiteContent) {
  return renderToString(<PublicSite initialContent={content} adminHref={null} liveUpdates={false} logoSrc="./assets/sinteria-logo.png" />);
}
