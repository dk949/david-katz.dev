import { defineConfig, type Plugin } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { themeFavicon } from "@dk949/site-theme/vite";
import { readFileSync } from "fs";
import { resolve } from "path";

const PARTIALS_DIR = resolve(__dirname, "src/partials");
const INCLUDE_RE = /<!--\s*@include\s+([\w-]+)\s*-->/g;

function htmlPartials(): Plugin {
    return {
        name: "html-partials",
        transformIndexHtml: {
            order: "pre",
            handler(html, ctx) {
                return html.replace(INCLUDE_RE, (_, name) => {
                    const path = resolve(PARTIALS_DIR, `${name}.html`);
                    try {
                        return readFileSync(path, "utf8");
                    } catch {
                        throw new Error(`html-partials: ${ctx.path}: cannot read ${path}`);
                    }
                });
            },
        },
        handleHotUpdate({ file, server }) {
            if (file.startsWith(PARTIALS_DIR)) {
                server.ws.send({ type: "full-reload" });
            }
        },
    };
}

export default defineConfig({
    /* themeFavicon serves and emits the favicon that ships with the theme
       package, so this site and the business card cannot drift apart. */
    plugins: [htmlPartials(), tailwindcss(), themeFavicon()],
    build: {
        rollupOptions: {
            input: {
                home: resolve(__dirname, "index.html"),
                research: resolve(__dirname, "research.html"),
                activity: resolve(__dirname, "activity.html"),
                projects: resolve(__dirname, "projects.html"),
            },
        },
    },
});
