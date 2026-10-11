// Фильтрация карточек проектов по тегам на странице галереи.
// Карточка показывается, если активен тег "Все" или если у карточки
// есть хотя бы один из выбранных тегов (data-tags, через запятую).

document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".filter-btn");
  const cards = document.querySelectorAll("[data-tags]");
  const emptyState = document.querySelector(".empty-state");

  if (!buttons.length || !cards.length) return;

  let active = "all";

  function applyFilter() {
    let visibleCount = 0;

    cards.forEach((card) => {
      const tags = card.dataset.tags.split(",").map((t) => t.trim());
      const show = active === "all" || tags.includes(active);
      card.style.display = show ? "" : "none";
      if (show) visibleCount++;
    });

    if (emptyState) {
      emptyState.style.display = visibleCount === 0 ? "block" : "none";
    }
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      active = btn.dataset.filter;
      applyFilter();
    });
  });

  applyFilter();
});
