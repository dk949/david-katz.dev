import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig({
    plugins: [tailwindcss()],
    build: {
        rollupOptions: {
            input: {
                home: resolve(__dirname, "index.html"),
                research: resolve(__dirname, "research.html"),
                activity: resolve(__dirname, "activity.html"),
            },
        },
    },
});
