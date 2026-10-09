import { env } from "cloudflare:workers";
import PublicSite from "./public-site";
import { defaultContent } from "../lib/content.ts";
import { readContent } from "../lib/site-api.ts";
export const dynamic = "force-dynamic";
export default async function Home() {
  const state = env.DB ? await readContent(env.DB) : { content: defaultContent, revision: 0 };
  const content = { ...state.content, packages: state.content.packages.filter(p => p.published), gallery: state.content.gallery.filter(m => m.published) };
  return <PublicSite initialContent={content} />;
}
