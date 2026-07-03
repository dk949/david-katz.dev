import { initSidebar } from "../lib/sidebar";
import { loadGithubData } from "../lib/github";
import type { Contribution, Language } from "../lib/github";
import { escHtml } from "../lib/escape";

initSidebar("activity");

async function render() {
  const data = await loadGithubData();
  renderContributions(data.contributions);
  renderLanguages(data.languages);
  renderMeta(data.generatedAt);
}

function renderContributions(contributions: Contribution[]) {
  const grid = document.getElementById("contrib-grid");
  if (!grid) return;
  grid.setAttribute("aria-busy", "false");

  if (contributions.length === 0) {
    grid.innerHTML = `<p class="empty-state">No contributions data yet. Run <code>npm run prebuild</code> with a GitHub token.</p>`;
    return;
  }

  grid.innerHTML = "";
  for (const c of contributions) {
    const card = document.createElement("div");
    card.className = "contrib-card";
    const prLabel = c.prCount === 1 ? "1 PR" : `${c.prCount} PRs`;
    card.innerHTML = `
      <a href="${escHtml(c.url)}" target="_blank" rel="noopener noreferrer" class="contrib-card-link">
        <span class="contrib-card-title">${escHtml(c.name)}</span>
        <span class="contrib-card-owner">${escHtml(c.owner)}/${escHtml(c.name)}</span>
        <span class="contrib-card-desc">${escHtml(c.description || "No description.")}</span>
        <span class="contrib-card-meta">
          <span class="pr-pill" title="${prLabel} merged">${prLabel}<span class="sr-only"> merged</span></span>
          ${c.language ? `<span class="lang-pill">${escHtml(c.language)}</span>` : ""}
          <span class="stars">
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
              <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 11.817l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/>
            </svg>
            ${c.stars}<span class="sr-only"> stars</span>
          </span>
        </span>
      </a>
    `;
    grid.appendChild(card);
  }
}

function renderLanguages(languages: Language[]) {
  const bar = document.getElementById("lang-bar");
  const legend = document.getElementById("lang-legend");
  if (!bar || !legend) return;

  if (languages.length === 0) return;

  bar.innerHTML = "";
  legend.innerHTML = "";

  const summary = languages.map((l) => `${l.name} ${l.percent.toFixed(1)}%`).join(", ");
  bar.setAttribute("aria-label", `Language breakdown: ${summary}`);

  for (const lang of languages) {
    const seg = document.createElement("div");
    seg.className = "lang-bar-segment";
    seg.style.cssText = `flex-basis: ${lang.percent}%; background-color: ${lang.color};`;
    seg.title = `${lang.name} ${lang.percent.toFixed(1)}%`;
    bar.appendChild(seg);

    const item = document.createElement("div");
    item.className = "lang-legend-item";
    item.innerHTML = `
      <span class="lang-legend-dot" style="background-color: ${lang.color};" aria-hidden="true"></span>
      <span>${escHtml(lang.name)}</span>
      <span style="color: var(--color-muted)">${lang.percent.toFixed(1)}%</span>
    `;
    legend.appendChild(item);
  }
}

function renderMeta(generatedAt: string) {
  const el = document.getElementById("activity-meta");
  if (!el) return;
  const date = new Date(generatedAt);
  const formatted = date.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
  el.textContent = `Data last updated: ${formatted}`;
}

render().catch(console.error);
