// Простая карусель для галереи скриншотов на странице проекта.
// Разметка: .carousel > .carousel-track > img.active + img ...,
// кнопки .carousel-btn.prev / .next, точки .carousel-dots > button.

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".carousel").forEach(initCarousel);
});

function initCarousel(root) {
  const images = Array.from(root.querySelectorAll(".carousel-track img"));
  const prevBtn = root.querySelector(".carousel-btn.prev");
  const nextBtn = root.querySelector(".carousel-btn.next");
  const dots = Array.from(root.querySelectorAll(".carousel-dots button"));

  if (images.length <= 1) {
    if (prevBtn) prevBtn.style.display = "none";
    if (nextBtn) nextBtn.style.display = "none";
    return;
  }

  let index = Math.max(images.findIndex((img) => img.classList.contains("active")), 0);

  function show(i) {
    index = (i + images.length) % images.length;
    images.forEach((img, j) => img.classList.toggle("active", j === index));
    dots.forEach((dot, j) => dot.classList.toggle("active", j === index));
  }

  prevBtn?.addEventListener("click", () => show(index - 1));
  nextBtn?.addEventListener("click", () => show(index + 1));
  dots.forEach((dot, j) => dot.addEventListener("click", () => show(j)));

  show(index);
}
