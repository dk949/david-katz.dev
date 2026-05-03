export interface Contribution {
    name: string;
    owner: string;
    description: string;
    language: string | null;
    stars: number;
    url: string;
    prCount: number;
}

export interface Language {
    name: string;
    percent: number;
    color: string;
}

export interface Project {
    name: string;
    url: string;
    description: string;
    tags?: string[];
}

export type PublicationType = "paper" | "preprint" | "talk" | "poster" | "thesis";

export interface Publication {
    title: string;
    authors: string[];
    venue: string;
    year: number;
    type: PublicationType;
    doi?: string;
    url?: string;
}

export interface GithubData {
    generatedAt: string;
    contributions: Contribution[];
    languages: Language[];
    projects: Project[];
    publications: Publication[];
}

// Future: swap this import for fetch('/api/github') to enable runtime refresh
export async function loadGithubData(): Promise<GithubData> {
    const mod = await import("../generated/github.json");
    return mod.default as GithubData;
}
