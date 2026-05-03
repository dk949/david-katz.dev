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

    list.addEventListener("click", onCopyClick);
}

function renderEntry(p: Publication): HTMLLIElement {
    const li = document.createElement("li");
    li.className = "publication";
    li.dataset.bibtex = genBibtex(p);

    const authors = p.authors.join(", ");
    const link = p.doi
        ? `<a href="https://doi.org/${escHtml(p.doi)}" target="_blank" rel="noopener noreferrer">doi:${escHtml(p.doi)}</a>`
        : p.url
            ? `<a href="${escHtml(p.url)}" target="_blank" rel="noopener noreferrer">link</a>`
            : "";

    li.innerHTML = `
        <button class="bibtex-copy" type="button" aria-label="Copy BibTeX citation" title="Copy BibTeX">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                stroke="currentColor" width="13" height="13" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round"
                    d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
            </svg>
        </button>
        <div class="publication-title">${escHtml(p.title)}</div>
        <div class="publication-authors">${escHtml(authors)}</div>
        <div class="publication-meta"><em>${escHtml(p.venue)}</em>. ${p.year}.${link ? ` ${link}` : ""}</div>
    `;
    return li;
}

function genCitationKey(p: Publication): string {
    const firstAuthor = p.authors[0] ?? "anon";
    const lastName = firstAuthor.trim().split(/\s+/).pop()?.toLowerCase() ?? "anon";
    const titleWord = p.title
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, "")
        .split(/\s+/)
        .find(w => w.length > 3) ?? "";
    return `${lastName}${p.year}${titleWord}`.replace(/[^a-z0-9]/g, "");
}

function genBibtex(p: Publication): string {
    const key = genCitationKey(p);
    const author = p.authors.join(" and ");
    const fields: string[] = [
        `    title = {${p.title}}`,
        `    author = {${author}}`,
    ];
    let entryType = "@misc";
    switch (p.type) {
        case "paper":
            entryType = "@article";
            fields.push(`    journal = {${p.venue}}`);
            break;
        case "thesis":
            entryType = "@phdthesis";
            fields.push(`    school = {${p.venue}}`);
            break;
        case "preprint":
            fields.push(`    howpublished = {${p.venue}}`);
            fields.push(`    note = {Preprint}`);
            break;
        case "talk":
            fields.push(`    howpublished = {Talk at ${p.venue}}`);
            break;
        case "poster":
            fields.push(`    howpublished = {Poster at ${p.venue}}`);
            break;
    }
    fields.push(`    year = {${p.year}}`);
    if (p.doi) fields.push(`    doi = {${p.doi}}`);
    if (p.url) fields.push(`    url = {${p.url}}`);
    return `${entryType}{${key},\n${fields.join(",\n")}\n}`;
}

async function onCopyClick(e: Event) {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(".bibtex-copy");
    if (!btn) return;
    const card = btn.closest<HTMLElement>(".publication");
    const bib = card?.dataset.bibtex;
    if (!bib) return;
    try {
        await navigator.clipboard.writeText(bib);
        btn.classList.add("copied");
        btn.setAttribute("aria-label", "Copied!");
        setTimeout(() => {
            btn.classList.remove("copied");
            btn.setAttribute("aria-label", "Copy BibTeX citation");
        }, 2000);
    } catch (err) {
        console.error("Copy failed:", err);
    }
}

render().catch(console.error);
