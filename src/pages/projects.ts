import { initSidebar } from "../lib/sidebar";
import { loadGithubData } from "../lib/github";
import type { Project } from "../lib/github";
import { escHtml } from "../lib/escape";

initSidebar("projects");

async function render() {
    const data = await loadGithubData();
    renderProjects(data.projects);
}

function renderProjects(projects: Project[]) {
    const grid = document.getElementById("projects-grid");
    if (!grid) return;
    grid.setAttribute("aria-busy", "false");

    if (projects.length === 0) {
        grid.innerHTML = `<p class="empty-state">No projects listed yet.</p>`;
        return;
    }

    grid.innerHTML = "";
    for (const p of projects) {
        const card = document.createElement("div");
        card.className = "project-card";
        const tags = (p.tags ?? [])
            .map((t) => `<span class="tag">${escHtml(t)}</span>`)
            .join("");
        card.innerHTML = `
            <a href="${escHtml(p.url)}" target="_blank" rel="noopener noreferrer" class="project-card-link">
                <span class="project-card-title">${escHtml(p.name)}</span>
                <span class="project-card-desc">${escHtml(p.description)}</span>
                ${tags ? `<span class="project-card-tags">${tags}</span>` : ""}
            </a>
        `;
        grid.appendChild(card);
    }
}

render().catch(console.error);
