import { hydrateRoot } from "react-dom/client";
import PublicPages, { pages, type PageId } from "../app/public-pages.tsx";
import type { SiteContent } from "../lib/content.ts";
import "../app/public-pages.css";
import "../app/party-theme.css";

const saved = document.getElementById("public-state")?.textContent;
const root = document.getElementById("root");
if (!saved || !root) throw new Error("Missing public page content.");
const state = JSON.parse(saved) as { content: SiteContent; page: PageId };
if (!pages.some(p => p.id === state.page)) throw new Error("Unknown public page.");
hydrateRoot(root, <PublicPages content={state.content} page={state.page} />);

