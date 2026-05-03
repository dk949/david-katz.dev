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
const SITE_FILE = resolve(ROOT, "data/site.yml");

interface RepoResponse {
    name: string;
    full_name: string;
    description: string | null;
    language: string | null;
    stargazers_count: number;
    html_url: string;
    size: number;
}

interface SearchIssuesResponse {
    total_count: number;
    incomplete_results: boolean;
    items: { repository_url: string }[];
}

interface SiteConfig {
    ignore?: {
        repos?: string[];
        owners?: string[];
        languages?: string[];
    };
    contributions?: {
        pinned?: string[];
        limit?: number | null;
    };
    languages?: {
        limit?: number | null;
    };
    projects?: Project[];
    publications?: Publication[];
}

interface Project {
    name: string;
    url: string;
    description: string;
    tags?: string[];
}

interface Publication {
    title: string;
    authors: string[];
    venue: string;
    year: number;
    type: "paper" | "preprint" | "talk" | "poster" | "thesis";
    doi?: string;
    url?: string;
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
        prCount: number;
    }[];
    languages: {
        name: string;
        percent: number;
        color: string;
    }[];
    projects: Project[];
    publications: Publication[];
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
const DEFAULT_TOP_LANGS = 8;
const SEARCH_PAGE_SIZE = 100;

const headers: Record<string, string> = {
    "Accept":                "application/vnd.github+json",
    "X-GitHub-Api-Version":  "2022-11-28",
    "User-Agent":            "david-katz-dev-build",
};

if (process.env["GITHUB_TOKEN"]) {
    headers["Authorization"] = `Bearer ${process.env["GITHUB_TOKEN"]}`;
}

async function ghFetch(path: string): Promise<unknown> {
    const res = await fetch(`${GH_API}${path}`, { headers });
    if (!res.ok) throw new Error(`GitHub API ${path} -> ${res.status} ${res.statusText}`);
    return res.json();
}

function prSearchUrl(slug: string): string {
    return `https://github.com/${slug}/pulls?q=is%3Apr+author%3A${GH_USER}`;
}

async function fetchAuthoredPrCounts(): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    let page = 1;
    while (true) {
        const q = encodeURIComponent(`is:pr author:${GH_USER} is:merged`);
        const data = await ghFetch(
            `/search/issues?q=${q}&per_page=${SEARCH_PAGE_SIZE}&page=${page}`
        ) as SearchIssuesResponse;

        for (const item of data.items) {
            // repository_url shape: https://api.github.com/repos/{owner}/{repo}
            const slug = item.repository_url.replace(`${GH_API}/repos/`, "");
            counts.set(slug, (counts.get(slug) ?? 0) + 1);
        }

        if (data.items.length < SEARCH_PAGE_SIZE) break;
        if (page * SEARCH_PAGE_SIZE >= data.total_count) break;
        page += 1;
    }
    return counts;
}

async function fetchContributions(
    slugs: string[],
    counts: Map<string, number>,
): Promise<GithubJson["contributions"]> {
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
                url:         prSearchUrl(slug),
                prCount:     counts.get(slug) ?? 0,
            };
        })
    );

    const fulfilled = results.flatMap((r) => {
        if (r.status === "fulfilled") return [r.value];
        console.warn("  skipped contribution:", (r.reason as Error).message);
        return [];
    });

    fulfilled.sort((a, b) => {
        if (b.prCount !== a.prCount) return b.prCount - a.prCount;
        return b.stars - a.stars;
    });
    return fulfilled;
}

async function fetchLanguages(
    ignored: Set<string>,
    topN: number,
): Promise<GithubJson["languages"]> {
    const repos = await ghFetch(
        `/users/${GH_USER}/repos?per_page=100&type=owner&sort=updated`
    ) as RepoResponse[];

    const totals: Map<string, number> = new Map();
    for (const repo of repos) {
        if (!repo.language) continue;
        if (ignored.has(repo.language)) continue;
        totals.set(repo.language, (totals.get(repo.language) ?? 0) + repo.size);
    }

    const sorted = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, topN);
    const rest = sorted.slice(topN);

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

function buildContributionSlugs(
    discovered: string[],
    pinned: string[],
    ignoredRepos: Set<string>,
    ignoredOwners: Set<string>,
): string[] {
    const all = new Set<string>([...discovered, ...pinned]);
    return Array.from(all).filter((slug) => {
        if (ignoredRepos.has(slug)) return false;
        const [owner] = slug.split("/") as [string, string];
        if (ignoredOwners.has(owner)) return false;
        return true;
    });
}

async function main() {
    console.log("fetch-github: fetching GitHub data...");

    const siteRaw = readFileSync(SITE_FILE, "utf8");
    const site = (yaml.load(siteRaw) ?? {}) as SiteConfig;

    const pinned = site.contributions?.pinned ?? [];
    const contribLimit = site.contributions?.limit ?? null;
    const langLimit = site.languages?.limit ?? DEFAULT_TOP_LANGS;
    const ignoredRepos = new Set(site.ignore?.repos ?? []);
    const ignoredOwners = new Set(site.ignore?.owners ?? []);
    const ignoredLangs = new Set(site.ignore?.languages ?? []);
    const projects = site.projects ?? [];
    const publications = site.publications ?? [];

    try {
        const counts = await fetchAuthoredPrCounts();
        const discovered = Array.from(counts.keys());
        const slugs = buildContributionSlugs(discovered, pinned, ignoredRepos, ignoredOwners);

        if (slugs.length === 0) {
            console.warn("fetch-github: no contributions resolved (empty after filtering)");
        }

        const [allContributions, languages] = await Promise.all([
            fetchContributions(slugs, counts),
            fetchLanguages(ignoredLangs, langLimit),
        ]);

        const contributions = contribLimit != null
            ? allContributions.slice(0, contribLimit)
            : allContributions;

        const output: GithubJson = {
            generatedAt: new Date().toISOString(),
            contributions,
            languages,
            projects,
            publications,
        };

        mkdirSync(dirname(OUTPUT), { recursive: true });
        writeFileSync(OUTPUT, JSON.stringify(output, null, 4));
        console.log(`fetch-github: wrote ${OUTPUT}`);
        console.log(`  contributions: ${contributions.length}/${allContributions.length} (discovered ${discovered.length}, pinned ${pinned.length}, limit ${contribLimit ?? "none"})`);
        console.log(`  languages:     ${languages.length} (limit ${langLimit} + Other)`);
        console.log(`  projects:      ${projects.length}`);
        console.log(`  publications:  ${publications.length}`);
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
