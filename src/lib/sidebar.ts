export function initSidebar(route: "home" | "research" | "activity" | "projects") {
  document.body.dataset["route"] = route;

  const toggle = document.getElementById("drawer-toggle");
  const closeBtn = document.getElementById("drawer-close");
  const drawer = document.getElementById("drawer");
  const backdrop = document.getElementById("drawer-backdrop");

  if (!toggle || !drawer || !backdrop) return;

  function openDrawer() {
    drawer!.setAttribute("aria-hidden", "false");
    backdrop!.setAttribute("aria-hidden", "false");
    toggle!.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    const first = drawer!.querySelector<HTMLElement>("button, a");
    first?.focus();
  }

  function closeDrawer() {
    drawer!.setAttribute("aria-hidden", "true");
    backdrop!.setAttribute("aria-hidden", "true");
    toggle!.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    toggle!.focus();
  }

  toggle.addEventListener("click", () => {
    drawer!.getAttribute("aria-hidden") === "false" ? closeDrawer() : openDrawer();
  });

  closeBtn?.addEventListener("click", closeDrawer);
  backdrop.addEventListener("click", closeDrawer);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer!.getAttribute("aria-hidden") === "false") {
      closeDrawer();
    }
  });

  drawer.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const focusable = Array.from(
      drawer!.querySelectorAll<HTMLElement>("a, button")
    ).filter((el) => !el.hasAttribute("disabled"));
    if (focusable.length === 0) return;
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}
