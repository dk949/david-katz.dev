/**
 * Build-time script: fetches GitHub data and writes src/generated/github.json.
 * Run automatically via `npm run prebuild` before `vite build`.
 * Falls back to the existing JSON if the API is unavailable.
 * Set GITHUB_TOKEN env var for 5000 req/hr (vs 60 unauthenticated).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import yaml from "js-yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUTPUT = resolve(ROOT, "src/generated/github.json");
const CONTRIBUTIONS_FILE = resolve(ROOT, "data/oss-contributions.yml");

interface RepoResponse {
    name: string;
    full_name: string;
    description: string | null;
    language: string | null;
    stargazers_count: number;
    html_url: string;
    size: number;
}

interface GithubJson {
    generatedAt: string;
    contributions: {
        name: string;
        owner: string;
        description: string;
        language: string | null;
        stars: number;
        url: string;
    }[];
    languages: {
        name: string;
        percent: number;
        color: string;
    }[];
}

// From github-linguist (subset relevant to HPC/systems/compilers)
const LANG_COLORS: Record<string, string> = {
    "C++":        "#f34b7d",
    "C":          "#555555",
    "Python":     "#3572A5",
    "Rust":       "#dea584",
    "Go":         "#00ADD8",
    "TypeScript": "#2b7489",
    "JavaScript": "#f1e05a",
    "CMake":      "#DA3434",
    "Shell":      "#89e051",
    "Makefile":   "#427819",
    "Fortran":    "#4d41b1",
    "LLVM":       "#185619",
    "Assembly":   "#6E4C13",
    "Other":      "#8b949e",
};

function langColor(name: string): string {
    return LANG_COLORS[name] ?? LANG_COLORS["Other"]!;
}

const GH_API = "https://api.github.com";
const GH_USER = "dk949";
const TOP_LANGS = 8;

const headers: Record<string, string> = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "david-katz-dev-build",
};

if (process.env["GITHUB_TOKEN"]) {
    headers["Authorization"] = `Bearer ${process.env["GITHUB_TOKEN"]}`;
}

async function ghFetch(path: string): Promise<unknown> {
    const res = await fetch(`${GH_API}${path}`, { headers });
    if (!res.ok) throw new Error(`GitHub API ${path} → ${res.status} ${res.statusText}`);
    return res.json();
}

async function fetchContributions(slugs: string[]): Promise<GithubJson["contributions"]> {
    const results = await Promise.allSettled(
        slugs.map(async (slug) => {
            const repo = await ghFetch(`/repos/${slug}`) as RepoResponse;
            const [owner] = slug.split("/") as [string, string];
            return {
                name:        repo.name,
                owner,
                description: repo.description ?? "",
                language:    repo.language,
                stars:       repo.stargazers_count,
                url:         repo.html_url,
            };
        })
    );

    return results.flatMap((r) => {
        if (r.status === "fulfilled") return [r.value];
        console.warn("  skipped contribution:", (r.reason as Error).message);
        return [];
    });
}

async function fetchLanguages(): Promise<GithubJson["languages"]> {
    const repos = await ghFetch(
        `/users/${GH_USER}/repos?per_page=100&type=owner&sort=updated`
    ) as RepoResponse[];

    const totals: Map<string, number> = new Map();
    for (const repo of repos) {
        if (!repo.language) continue;
        totals.set(repo.language, (totals.get(repo.language) ?? 0) + repo.size);
    }

    const sorted = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, TOP_LANGS);
    const rest = sorted.slice(TOP_LANGS);

    const total = sorted.reduce((s, [, n]) => s + n, 0);
    if (total === 0) return [];

    const result: GithubJson["languages"] = top.map(([name, size]) => ({
        name,
        percent: (size / total) * 100,
        color:   langColor(name),
    }));

    if (rest.length > 0) {
        const otherSize = rest.reduce((s, [, n]) => s + n, 0);
        result.push({
            name:    "Other",
            percent: (otherSize / total) * 100,
            color:   langColor("Other"),
        });
    }

    return result;
}

async function main() {
    console.log("fetch-github: fetching GitHub data…");

    const ossRaw = readFileSync(CONTRIBUTIONS_FILE, "utf8");
    const ossData = yaml.load(ossRaw) as { contributions: string[] };
    const slugs: string[] = ossData.contributions ?? [];

    if (slugs.length === 0) {
        console.warn("fetch-github: no contributions listed in data/oss-contributions.yml");
    }

    try {
        const [contributions, languages] = await Promise.all([
            fetchContributions(slugs),
            fetchLanguages(),
        ]);

        const output: GithubJson = {
            generatedAt: new Date().toISOString(),
            contributions,
            languages,
        };

        mkdirSync(dirname(OUTPUT), { recursive: true });
        writeFileSync(OUTPUT, JSON.stringify(output, null, 4));
        console.log(`fetch-github: wrote ${OUTPUT}`);
        console.log(`  contributions: ${contributions.length}`);
        console.log(`  languages:     ${languages.length}`);
    } catch (err) {
        if (existsSync(OUTPUT)) {
            console.warn("fetch-github: API error, using cached data:", (err as Error).message);
        } else {
            console.error("fetch-github: API error and no cached data:", (err as Error).message);
            process.exit(1);
        }
    }
}

main().catch((err) => {
    console.error("fetch-github:", err);
    process.exit(1);
});
