import { initSidebar } from "../lib/sidebar";
import { loadGithubData } from "../lib/github";
import type { Publication, PublicationType } from "../lib/github";
import { escHtml } from "../lib/escape";

initSidebar("research");

const TYPE_LABELS: Record<PublicationType, string> = {
    paper:     "Papers",
    preprint:  "Preprints",
    talk:      "Talks",
    poster:    "Posters",
    thesis:    "Theses",
};

const TYPE_ORDER: PublicationType[] = ["paper", "preprint", "thesis", "talk", "poster"];

async function render() {
    const data = await loadGithubData();
    renderPublications(data.publications);
}

function renderPublications(pubs: Publication[]) {
    const list = document.getElementById("publications-list");
    if (!list) return;
    list.setAttribute("aria-busy", "false");

    if (pubs.length === 0) {
        list.innerHTML = `<p class="placeholder-block">No publications yet.</p>`;
        return;
    }

    const grouped = new Map<PublicationType, Publication[]>();
    for (const p of pubs) {
        const arr = grouped.get(p.type) ?? [];
        arr.push(p);
        grouped.set(p.type, arr);
    }
    for (const arr of grouped.values()) {
        arr.sort((a, b) => b.year - a.year);
    }

    const groupCount = grouped.size;
    list.innerHTML = "";

    for (const type of TYPE_ORDER) {
        const arr = grouped.get(type);
        if (!arr || arr.length === 0) continue;

        if (groupCount > 1) {
            const h3 = document.createElement("h3");
            h3.className = "publications-group-title";
            h3.textContent = TYPE_LABELS[type];
            list.appendChild(h3);
        }

        const ol = document.createElement("ol");
        ol.className = "publications-list";
        for (const p of arr) {
            ol.appendChild(renderEntry(p));
        }
        list.appendChild(ol);
    }
}

function renderEntry(p: Publication): HTMLLIElement {
    const li = document.createElement("li");
    li.className = "publication";

    const authors = p.authors.join(", ");
    const link = p.doi
        ? `<a href="https://doi.org/${escHtml(p.doi)}" target="_blank" rel="noopener noreferrer">doi:${escHtml(p.doi)}</a>`
        : p.url
            ? `<a href="${escHtml(p.url)}" target="_blank" rel="noopener noreferrer">link</a>`
            : "";

    li.innerHTML = `
        <span class="publication-authors">${escHtml(authors)}</span>.
        <span class="publication-title">${escHtml(p.title)}</span>.
        <span class="publication-venue"><em>${escHtml(p.venue)}</em>, ${p.year}</span>.${link ? ` ${link}` : ""}
    `;
    return li;
}

render().catch(console.error);
