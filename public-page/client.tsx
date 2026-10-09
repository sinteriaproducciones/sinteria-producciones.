import { createRoot } from "react-dom/client";
import PublicSite from "../app/public-site.tsx";
import type { SiteContent } from "../lib/content.ts";
import "../app/globals.css";
import "../app/celebration.css";
import "../app/stage-two.css";

const saved = document.getElementById("public-state")?.textContent;
const root = document.getElementById("root");
if (!saved || !root) throw new Error("The public page was not built correctly.");
const content: SiteContent = JSON.parse(saved);
createRoot(root).render(<PublicSite initialContent={content} adminHref={null} liveUpdates={false} logoSrc="./assets/sinteria-logo.png" />);
