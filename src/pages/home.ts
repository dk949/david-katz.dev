import { initSidebar } from "../lib/sidebar";

initSidebar("home");

const copyBtn = document.getElementById("copy-email");
const EMAIL = "dk949.david@gmail.com";

copyBtn?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(EMAIL);
    copyBtn.classList.add("copied");
    copyBtn.setAttribute("aria-label", "Copied!");
    setTimeout(() => {
      copyBtn.classList.remove("copied");
      copyBtn.setAttribute("aria-label", "Copy email address");
    }, 2000);
  } catch {
    // fallback: open mailto
    window.location.href = `mailto:${EMAIL}`;
  }
});
