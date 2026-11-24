import { initSidebar } from "../lib/sidebar";

initSidebar("notfound");

/* Vercel serves 404.html in place of the missing URL, so the path is the one
   that was asked for. textContent, not innerHTML: it is visitor-controlled. */
const missing = document.getElementById("missing-path");
if (missing) {
    let path = location.pathname;
    try {
        path = decodeURIComponent(path);
    } catch {
        /* malformed escape (e.g. a lone %): show it as typed */
    }
    missing.textContent = path;
}
