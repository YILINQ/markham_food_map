const STORAGE_KEY = "markham-food-wheel-v2";

const DEFAULT_RESTAURANTS = [
  "西北楼",
  "曲小姐",
  "三喜面馆",
  "东大师傅",
  "板面大王",
  "和顺",
  "皇后名粥",
  "Korean Grill House",
  "鱼你在一起",
  "喜烫",
  "麻布小馆",
  "Hoja",
  "茶记",
  "锦香烧腊",
  "大个子砂锅王",
  "笑江湖",
  "大鸭梨",
  "来一碗盖码饭",
];

const PALETTE = [
  "#2b211b",
  "#3a2a22",
  "#4a3126",
  "#5a3828",
  "#6b4028",
  "#7a4627",
  "#8a4d25",
  "#9a5424",
];

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const spinBtn = document.getElementById("spinBtn");
const resultEl = document.getElementById("result");
const listEl = document.getElementById("restaurantList");
const addForm = document.getElementById("addForm");
const newNameInput = document.getElementById("newName");
const resetBtn = document.getElementById("resetBtn");
const wheelShell = document.querySelector(".wheel-shell");

let restaurants = loadRestaurants();
let rotation = 0;
let spinning = false;
let animFrame = null;

function loadRestaurants() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_RESTAURANTS];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [...DEFAULT_RESTAURANTS];
    }
    return parsed.map(String).filter((name) => name.trim());
  } catch {
    return [...DEFAULT_RESTAURANTS];
  }
}

function saveRestaurants() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(restaurants));
}

function drawWheel() {
  const { width, height } = canvas;
  const cx = width / 2;
  const cy = height / 2;
  const radius = width / 2 - 8;
  const n = Math.max(restaurants.length, 1);
  const arc = (Math.PI * 2) / n;

  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  for (let i = 0; i < n; i += 1) {
    const start = i * arc - Math.PI / 2;
    const end = start + arc;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = PALETTE[i % PALETTE.length];
    ctx.fill();
    ctx.strokeStyle = "rgba(243, 235, 224, 0.18)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.rotate(start + arc / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = i % 2 === 0 ? "#f3ebe0" : "#e8d7b8";
    ctx.font = `${Math.max(14, Math.min(22, 280 / n))}px "Noto Sans SC", sans-serif`;
    const label = restaurants[i] || "空";
    const maxLen = n > 20 ? 8 : 12;
    const text = label.length > maxLen ? `${label.slice(0, maxLen)}…` : label;
    ctx.fillText(text, radius - 18, 6);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(0, 0, 42, 0, Math.PI * 2);
  ctx.fillStyle = "#14110f";
  ctx.fill();
  ctx.strokeStyle = "#c9a15b";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = "#f3ebe0";
  ctx.font = '20px "ZCOOL XiaoWei", serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("吃", 0, 1);

  ctx.restore();
}

function getIndexAtPointer() {
  const n = restaurants.length;
  if (n === 0) return -1;
  const arc = (Math.PI * 2) / n;
  // Pointer is at top (-PI/2). Normalize rotation into [0, 2PI).
  const normalized = ((rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  // With initial labels drawn from -PI/2, index 0 starts at top when rotation=0.
  const index = Math.floor(((Math.PI * 2 - normalized) % (Math.PI * 2)) / arc);
  return index % n;
}

function renderList() {
  listEl.innerHTML = "";
  restaurants.forEach((name, index) => {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = name;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "删除";
    btn.addEventListener("click", () => {
      if (spinning) return;
      restaurants.splice(index, 1);
      if (restaurants.length === 0) {
        restaurants = [...DEFAULT_RESTAURANTS];
      }
      saveRestaurants();
      renderList();
      drawWheel();
      resultEl.textContent = "名单已更新，再转一次吧";
      resultEl.classList.remove("is-revealing");
    });
    li.append(span, btn);
    listEl.appendChild(li);
  });
}

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

function spin() {
  if (spinning || restaurants.length === 0) return;

  spinning = true;
  spinBtn.disabled = true;
  wheelShell.classList.add("is-spinning");
  resultEl.classList.remove("is-revealing");
  resultEl.textContent = "转动中…";

  const start = rotation;
  const extraTurns = 5 + Math.random() * 3;
  const randomOffset = Math.random() * Math.PI * 2;
  const target = start + extraTurns * Math.PI * 2 + randomOffset;
  const duration = 4200 + Math.random() * 800;
  const t0 = performance.now();

  function frame(now) {
    const t = Math.min(1, (now - t0) / duration);
    rotation = start + (target - start) * easeOutCubic(t);
    drawWheel();

    if (t < 1) {
      animFrame = requestAnimationFrame(frame);
      return;
    }

    spinning = false;
    spinBtn.disabled = false;
    wheelShell.classList.remove("is-spinning");
    const winner = restaurants[getIndexAtPointer()];
    resultEl.textContent = winner;
    resultEl.classList.add("is-revealing");
  }

  animFrame = requestAnimationFrame(frame);
}

spinBtn.addEventListener("click", spin);

addForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (spinning) return;
  const name = newNameInput.value.trim();
  if (!name) return;
  if (restaurants.includes(name)) {
    resultEl.textContent = "名单里已经有这家了";
    newNameInput.value = "";
    return;
  }
  restaurants.push(name);
  saveRestaurants();
  newNameInput.value = "";
  renderList();
  drawWheel();
  resultEl.textContent = `已加入：${name}`;
  resultEl.classList.add("is-revealing");
});

resetBtn.addEventListener("click", () => {
  if (spinning) return;
  restaurants = [...DEFAULT_RESTAURANTS];
  saveRestaurants();
  renderList();
  drawWheel();
  resultEl.textContent = "已恢复默认名单";
  resultEl.classList.add("is-revealing");
});

window.addEventListener("beforeunload", () => {
  if (animFrame) cancelAnimationFrame(animFrame);
});

renderList();
drawWheel();
