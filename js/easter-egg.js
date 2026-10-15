document.addEventListener("DOMContentLoaded", () => {
  const bird = document.getElementById("easterBird");
  const bubble = document.getElementById("easterBubble");
  const birdImg = document.getElementById("easterBirdImg");
  const yesBtn = document.getElementById("easterYes");
  const noBtn = document.getElementById("easterNo");
  if (!bird || !bubble) return;

  // Пути берём от уже загруженной картинки — так работает и в корне, и в en/.
  const BIRD_IDLE = birdImg ? birdImg.src : "projects/img/kakapo.png";
  const BIRD_CURIOUS = BIRD_IDLE.replace("kakapo.png", "kakapo-curious.png");

  let hideTimer;

  function show() {
    clearTimeout(hideTimer);
    bubble.classList.add("visible");
    if (birdImg) birdImg.src = BIRD_CURIOUS;
  }

  function scheduleHide() {
    hideTimer = setTimeout(() => {
      bubble.classList.remove("visible");
      if (birdImg) birdImg.src = BIRD_IDLE;
    }, 200);
  }

  bird.addEventListener("mouseenter", show);
  bird.addEventListener("focus", show);
  bird.addEventListener("mouseleave", scheduleHide);
  bird.addEventListener("blur", scheduleHide);

  bubble.addEventListener("mouseenter", () => clearTimeout(hideTimer));
  bubble.addEventListener("mouseleave", scheduleHide);

  if (noBtn) {
    noBtn.addEventListener("click", () => {
      bubble.classList.remove("visible");
    });
  }

  if (yesBtn) {
    yesBtn.addEventListener("click", () => {
      window.location.href = "game.html";
    });
  }
});
