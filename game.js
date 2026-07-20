// ZigZag -- 3-lane endless dodge. Survive as long as you can; speed climbs with score.

const LANES = 3;
const CANVAS_W = 360;
const CANVAS_H = 640;
const LANE_W = CANVAS_W / LANES;
const PLAYER_Y = CANVAS_H - 80;
const PLAYER_SIZE = 36;
const OBSTACLE_H = 30;
const BASE_SPEED = 140; // px/sec
const BASE_SPAWN_MS = 950;

let state;

function freshState() {
  return {
    playerLane: 1,
    obstacles: [], // {lane, y}
    score: 0,
    speed: BASE_SPEED,
    elapsed: 0,
    sinceSpawn: 0,
    over: false,
    best: state ? state.best : Number(localStorage.getItem("zigzag.best") || 0),
  };
}

function newGame() {
  state = freshState();
  render();
}

function moveTo(lane) {
  state.playerLane = Math.max(0, Math.min(LANES - 1, lane));
}

function spawnInterval() {
  return Math.max(380, BASE_SPAWN_MS - state.elapsed / 40);
}

function tick(dtMs) {
  if (state.over) return;
  const dt = dtMs / 1000;
  state.elapsed += dtMs;
  state.speed = BASE_SPEED + state.elapsed / 60;
  state.score = Math.floor(state.elapsed / 100);

  state.sinceSpawn += dtMs;
  if (state.sinceSpawn >= spawnInterval()) {
    state.sinceSpawn = 0;
    state.obstacles.push({ lane: Math.floor(Math.random() * LANES), y: -OBSTACLE_H });
  }

  for (const o of state.obstacles) o.y += state.speed * dt;

  for (const o of state.obstacles) {
    const hitY = o.y + OBSTACLE_H >= PLAYER_Y && o.y <= PLAYER_Y + PLAYER_SIZE;
    if (hitY && o.lane === state.playerLane) {
      state.over = true;
      if (state.score > state.best) {
        state.best = state.score;
        localStorage.setItem("zigzag.best", String(state.best));
      }
    }
  }

  state.obstacles = state.obstacles.filter(o => o.y < CANVAS_H + OBSTACLE_H);
}

function draw() {
  const canvas = document.getElementById("game");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0d0e13";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.strokeStyle = "#22242e";
  ctx.lineWidth = 2;
  for (let i = 1; i < LANES; i++) {
    ctx.beginPath();
    ctx.moveTo(i * LANE_W, 0);
    ctx.lineTo(i * LANE_W, CANVAS_H);
    ctx.stroke();
  }

  ctx.fillStyle = "#d8556a";
  for (const o of state.obstacles) {
    ctx.fillRect(o.lane * LANE_W + 10, o.y, LANE_W - 20, OBSTACLE_H);
  }

  ctx.fillStyle = state.over ? "#8b8794" : "#5bc0a8";
  ctx.fillRect(state.playerLane * LANE_W + (LANE_W - PLAYER_SIZE) / 2, PLAYER_Y, PLAYER_SIZE, PLAYER_SIZE);

  ctx.fillStyle = "#ece7e1";
  ctx.font = "bold 22px -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Score " + state.score, 16, 34);
  ctx.textAlign = "right";
  ctx.fillText("Best " + state.best, CANVAS_W - 16, 34);

  if (state.over) {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = "#ece7e1";
    ctx.textAlign = "center";
    ctx.font = "bold 30px -apple-system, sans-serif";
    ctx.fillText("Game Over", CANVAS_W / 2, CANVAS_H / 2 - 10);
    ctx.font = "18px -apple-system, sans-serif";
    ctx.fillText("Score " + state.score + "  ·  Tap to retry", CANVAS_W / 2, CANVAS_H / 2 + 26);
  }
}

function render() {
  draw();
}

let rafId = null;
let lastT = null;
function loop(t) {
  if (lastT == null) lastT = t;
  const dt = t - lastT;
  lastT = t;
  tick(dt);
  draw();
  rafId = requestAnimationFrame(loop);
}

function startLoop() {
  if (rafId != null) cancelAnimationFrame(rafId);
  lastT = null;
  rafId = requestAnimationFrame(loop);
}

window.LANES = LANES;
window.CANVAS_W = CANVAS_W;
window.CANVAS_H = CANVAS_H;
window.PLAYER_Y = PLAYER_Y;
window.OBSTACLE_H = OBSTACLE_H;
window.newGame = newGame;
window.moveTo = moveTo;
window.tick = tick;
window.draw = draw;
window.getState = () => state;

newGame();
startLoop();

document.addEventListener("keydown", (e) => {
  if (state.over) { if (e.key === " " || e.key === "Enter") newGame(); return; }
  if (e.key === "ArrowLeft") moveTo(state.playerLane - 1);
  if (e.key === "ArrowRight") moveTo(state.playerLane + 1);
});
document.addEventListener("click", (e) => {
  if (state.over) { newGame(); return; }
  const canvas = document.getElementById("game");
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (CANVAS_W / rect.width);
  moveTo(Math.floor(x / LANE_W));
});
