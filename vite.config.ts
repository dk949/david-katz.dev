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

const SITE_URL = "https://david-katz.dev";
const OG_IMAGE = {
    path: "/og-image.png", // source: assets/og-image.svg
    width: 1200,
    height: 630,
    alt: "David Katz - PhD researcher in HPC, compilers, and LLVM/MLIR",
};

/* Link-preview tags (Open Graph, Twitter card, canonical), derived from each
   page's own <title> and meta description so those stay the single source. */
function socialMeta(): Plugin {
    const attr = (s: string) => s.replace(/&(?!#?\w+;)/g, "&amp;").replace(/"/g, "&quot;");
    return {
        name: "social-meta",
        transformIndexHtml(html, ctx) {
            const title = /<title>([^<]*)<\/title>/.exec(html)?.[1]?.trim();
            const desc = /<meta\s+name="description"\s+content="([^"]*)"/.exec(html)?.[1]?.trim();
            if (!title || !desc) {
                throw new Error(`social-meta: ${ctx.path}: needs a <title> and a meta description`);
            }
            const page = ctx.path === "/index.html" ? "/" : ctx.path;
            const url = SITE_URL + page;
            const tags = [
                `<link rel="canonical" href="${url}" />`,
                `<meta property="og:type" content="website" />`,
                `<meta property="og:site_name" content="David Katz" />`,
                `<meta property="og:url" content="${url}" />`,
                `<meta property="og:title" content="${attr(title)}" />`,
                `<meta property="og:description" content="${desc}" />`,
                `<meta property="og:image" content="${SITE_URL}${OG_IMAGE.path}" />`,
                `<meta property="og:image:type" content="image/png" />`,
                `<meta property="og:image:width" content="${OG_IMAGE.width}" />`,
                `<meta property="og:image:height" content="${OG_IMAGE.height}" />`,
                `<meta property="og:image:alt" content="${attr(OG_IMAGE.alt)}" />`,
                `<meta name="twitter:card" content="summary_large_image" />`,
            ];
            return html.replace("</head>", `  ${tags.join("\n  ")}\n</head>`);
        },
    };
}

export default defineConfig({
    /* themeFavicon serves and emits the favicon that ships with the theme
       package, so this site and the business card cannot drift apart. */
    plugins: [htmlPartials(), socialMeta(), tailwindcss(), themeFavicon()],
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
