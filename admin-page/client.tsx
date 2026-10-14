import { createRoot } from "react-dom/client";
import AdminPanel from "../app/admin/panel.tsx";
import "../app/globals.css";
import "../app/celebration.css";
import "../app/stage-two.css";
createRoot(document.getElementById("root")!).render(<AdminPanel />);
