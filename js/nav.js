// Mobile menu toggle, shared by every page.
const btn = document.querySelector(".menu-btn");
const menu = document.getElementById("menu");

if (btn && menu) {
  btn.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(open));
  });
  menu.addEventListener("click", (e) => {
    if (e.target.closest("a")) {
      menu.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    }
  });
}
