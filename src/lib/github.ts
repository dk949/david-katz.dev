export interface Contribution {
  name: string;
  owner: string;
  description: string;
  language: string | null;
  stars: number;
  url: string;
}

export interface Language {
  name: string;
  percent: number;
  color: string;
}

export interface GithubData {
  generatedAt: string;
  contributions: Contribution[];
  languages: Language[];
}

// Future: swap this import for fetch('/api/github') to enable runtime refresh
export async function loadGithubData(): Promise<GithubData> {
  const mod = await import("../generated/github.json");
  return mod.default as GithubData;
}
