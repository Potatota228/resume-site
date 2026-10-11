document.addEventListener("DOMContentLoaded", () => {
  const bird = document.getElementById("easterBird");
  const bubble = document.getElementById("easterBubble");
  const yesBtn = document.getElementById("easterYes");
  const noBtn = document.getElementById("easterNo");
  if (!bird || !bubble) return;

  let hideTimer;

  function show() {
    clearTimeout(hideTimer);
    bubble.classList.add("visible");
  }

  function scheduleHide() {
    hideTimer = setTimeout(() => {
      bubble.classList.remove("visible");
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
