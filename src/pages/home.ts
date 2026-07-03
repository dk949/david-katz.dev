import { initSidebar } from "../lib/sidebar";

initSidebar("home");

const copyBtn = document.getElementById("copy-email");
const copyStatus = document.getElementById("copy-status");
const EMAIL = "dk949.david@gmail.com";

copyBtn?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(EMAIL);
    copyBtn.classList.add("copied");
    copyBtn.setAttribute("aria-label", "Copied!");
    if (copyStatus) copyStatus.textContent = "Email address copied to clipboard";
    setTimeout(() => {
      copyBtn.classList.remove("copied");
      copyBtn.setAttribute("aria-label", "Copy email address");
      if (copyStatus) copyStatus.textContent = "";
    }, 2000);
  } catch {
    // fallback: open mailto
    window.location.href = `mailto:${EMAIL}`;
  }
});
