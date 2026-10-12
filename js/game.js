(function () {
  const canvas = document.getElementById("gameCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const W = canvas.width;
  const H = canvas.height;

  const scoreEl = document.getElementById("score");
  const livesEl = document.getElementById("lives");
  const hud = document.getElementById("gameHud");
  const overlay = document.getElementById("gameOverlay");
  const overlayText = document.getElementById("overlayText");
  const overlayBtn = document.getElementById("overlayBtn");

  const WIN_SCORE = 50;
  const MAX_LIVES = 3;

  // ---------- Настройки сложности ----------
  // Скорость падения офферов и частота их появления линейно растут от
  // стартового значения к финальному по мере роста счёта (0 -> WIN_SCORE).
  // Хочешь игру полегче/потяжелее — меняй эти 4 числа:
  //   FALL_SPEED_START / FALL_SPEED_MAX   — скорость падения (px за кадр)
  //   SPAWN_INTERVAL_START / SPAWN_INTERVAL_MIN — пауза между офферами (мс)
  // Чем больше FALL_SPEED_MAX и чем меньше SPAWN_INTERVAL_MIN — тем жёстче
  // игра становится к концу. Чтобы ускорение было плавнее — приближай
  // _START к _MAX/_MIN, чтобы было резче — наоборот.
  const FALL_SPEED_START = 2.2;
  const FALL_SPEED_MAX = 20;
  const SPAWN_INTERVAL_START = 1100;
  const SPAWN_INTERVAL_MIN = 200;

  // Спрайт игрока (Полина с коробкой). Пиксель-арт, поэтому рисуем без
  // сглаживания — ctx.imageSmoothingEnabled выставлен в false ниже.
  const PLAYER_W = 84;
  const PLAYER_H = 172;
  const playerImg = new Image();
  let playerImgReady = false;
  playerImg.onload = () => {
    playerImgReady = true;
  };
  playerImg.src = "projects/img/mini-me.png";

  let player, items, score, lives, running, spawnTimer, lastTime;

  function resetState() {
    player = {
      x: W / 2 - PLAYER_W / 2,
      y: H - PLAYER_H - 8,
      w: PLAYER_W,
      h: PLAYER_H,
      speed: 7
    };
    items = [];
    score = 0;
    lives = MAX_LIVES;
    spawnTimer = 0;
    updateHUD();
  }

  function updateHUD() {
    scoreEl.textContent = score;
    const safeLives = Math.max(lives, 0);
    livesEl.textContent =
      "❤️".repeat(safeLives) + "🖤".repeat(MAX_LIVES - safeLives);
  }

  function currentDifficulty() {
    const t = Math.min(score / WIN_SCORE, 1);
    return {
      fallSpeed: FALL_SPEED_START + t * (FALL_SPEED_MAX - FALL_SPEED_START),
      spawnInterval:
        SPAWN_INTERVAL_START - t * (SPAWN_INTERVAL_START - SPAWN_INTERVAL_MIN)
    };
  }

  function spawnItem() {
    const w = 90;
    items.push({ x: Math.random() * (W - w), y: -40, w, h: 34 });
  }

  function drawPlayer() {
    if (playerImgReady) {
      ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);
    } else {
      // Пока картинка не загрузилась — временная заглушка.
      ctx.fillStyle = "#b5654a";
      ctx.beginPath();
      ctx.roundRect(player.x, player.y, player.w, player.h, 10);
      ctx.fill();
    }
  }

  function drawItem(item) {
    ctx.fillStyle = "#f1ded4";
    ctx.strokeStyle = "#b5654a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(item.x, item.y, item.w, item.h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#6b4a3a";
    ctx.font = "bold 15px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ОФФЕР", item.x + item.w / 2, item.y + item.h / 2 + 5);
  }

  function rectsOverlap(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  // ---------- Звук (Web Audio, без аудиофайлов) ----------
  // Звуки генерируются на лету, файлы не нужны. Если позже захочешь
  // подключить свои аудиофайлы — замени тела playCatchSound/playWinSound/
  // playLoseSound на new Audio("sounds/xxx.mp3").play().
  let audioCtx;
  function getAudioCtx() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function beep(freq, duration, type, startOffset, gainValue) {
    const ac = getAudioCtx();
    if (!ac) return;
    const osc = ac.createOscillator();
    const gainNode = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gainNode).connect(ac.destination);
    const t = ac.currentTime + (startOffset || 0);
    gainNode.gain.setValueAtTime(gainValue, t);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  function playCatchSound() {
    beep(720, 0.09, "sine", 0, 0.12);
  }

  function playMissSound() {
    beep(100, 0.14, "square", 0, 0.09);
  }

  function playWinSound() {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      beep(freq, 0.18, "triangle", i * 0.12, 0.12);
    });
  }

  function playLoseSound() {
    beep(220, 0.25, "sawtooth", 0, 0.12);
    beep(160, 0.3, "sawtooth", 0.15, 0.12);
  }

  function loop(ts) {
    if (!running) return;
    if (!lastTime) lastTime = ts;
    const dt = ts - lastTime;
    lastTime = ts;

    const diff = currentDifficulty();
    spawnTimer += dt;
    if (spawnTimer > diff.spawnInterval) {
      spawnTimer = 0;
      spawnItem();
    }

    ctx.clearRect(0, 0, W, H);

    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      item.y += diff.fallSpeed;

      if (rectsOverlap(item, player)) {
        items.splice(i, 1);
        score++;
        updateHUD();
        playCatchSound();
        if (score >= WIN_SCORE) {
          endGame(true);
          return;
        }
        continue;
      }

      if (item.y > H) {
        items.splice(i, 1);
        lives--;
        updateHUD();
        playMissSound();
        if (lives <= 0) {
          endGame(false);
          return;
        }
        continue;
      }

      drawItem(item);
    }

    drawPlayer();
    requestAnimationFrame(loop);
  }

  function endGame(won) {
    running = false;
    overlay.classList.add("visible");
    overlayText.textContent = won
      ? "Оффер получен!"
      : "Упс, три оффера упущено. Попробовать снова?";
    overlayBtn.textContent = "Играть ещё раз";
    if (won) {
      playWinSound();
    } else {
      playLoseSound();
    }
  }

  function startGame() {
    getAudioCtx(); // разблокируем звук по жесту пользователя
    resetState();
    overlay.classList.remove("visible");
    if (hud) hud.classList.remove("hud-hidden");
    running = true;
    lastTime = 0;
    requestAnimationFrame(loop);
  }

  overlayBtn.addEventListener("click", startGame);

  const keys = {};
  document.addEventListener("keydown", (e) => {
    keys[e.key] = true;
  });
  document.addEventListener("keyup", (e) => {
    keys[e.key] = false;
  });

  function keyboardLoop() {
    if (running) {
      if (keys["ArrowLeft"]) player.x -= player.speed;
      if (keys["ArrowRight"]) player.x += player.speed;
      player.x = Math.max(0, Math.min(W - player.w, player.x));
    }
    requestAnimationFrame(keyboardLoop);
  }
  requestAnimationFrame(keyboardLoop);

  canvas.addEventListener("mousemove", (e) => {
    if (!running) return;
    const rect = canvas.getBoundingClientRect();
    const scale = W / rect.width;
    const x = (e.clientX - rect.left) * scale;
    player.x = Math.max(0, Math.min(W - player.w, x - player.w / 2));
  });

  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!running) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const scale = W / rect.width;
      const touch = e.touches[0];
      const x = (touch.clientX - rect.left) * scale;
      player.x = Math.max(0, Math.min(W - player.w, x - player.w / 2));
    },
    { passive: false }
  );

  resetState();
})();
