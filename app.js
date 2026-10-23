const castBtn = document.getElementById("castBtn");
const core = document.getElementById("core");
const statusEl = document.getElementById("status");
const yaoEls = [...document.querySelectorAll(".yao")];
const verdictEl = document.getElementById("verdict");
const verdictLevel = document.getElementById("verdictLevel");
const verdictName = document.getElementById("verdictName");
const verdictText = document.getElementById("verdictText");
const sealText = document.getElementById("sealText");

let casting = false;

/** lines: [初,二,三,四,五,上] → 画面自上而下为 [上…初] */
function linesForDisplay(lines) {
  return [...lines].reverse();
}

function castLines() {
  return Array.from({ length: 6 }, () => (Math.random() < 0.5 ? 0 : 1));
}

function lookupHexagram(lines) {
  const key = lines.join("");
  return HEXAGRAM_BY_KEY[key] || HEXAGRAMS[0];
}

function resetYao() {
  yaoEls.forEach((el) => {
    el.className = "yao";
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function setYao(visualIndex, yang) {
  yaoEls[visualIndex].className = `yao is-on ${yang ? "is-yang" : "is-yin"}`;
}

async function cast() {
  if (casting) return;
  casting = true;
  castBtn.disabled = true;

  verdictEl.hidden = true;
  core.classList.remove("is-revealed");
  core.removeAttribute("data-tone");
  core.classList.add("is-casting");
  resetYao();

  const lines = castLines();
  const hexagram = lookupHexagram(lines);
  const display = linesForDisplay(lines);

  const steps = ["焚香静心", "铜钱落掌", "六爻初成", "推演卦辞"];
  for (const step of steps) {
    statusEl.textContent = step;
    await sleep(280 + Math.random() * 160);
  }

  const labels = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"];
  // 自下而上显现：visualIndex 5→0 对应 初→上
  for (let visualIndex = 5; visualIndex >= 0; visualIndex -= 1) {
    const lineOrder = 5 - visualIndex;
    statusEl.textContent = labels[lineOrder];
    setYao(visualIndex, display[visualIndex] === 1);
    await sleep(220 + Math.random() * 100);
  }

  await sleep(280);

  sealText.textContent = hexagram.level;
  verdictLevel.textContent = hexagram.level;
  verdictName.textContent = `第${hexagram.id}卦 · ${hexagram.name} · ${hexagram.alias}`;
  verdictText.textContent = hexagram.text;
  verdictEl.dataset.tone = hexagram.tone;
  verdictEl.hidden = false;

  core.classList.remove("is-casting");
  core.classList.add("is-revealed");
  core.dataset.tone = hexagram.tone;
  statusEl.textContent = "卦成";

  casting = false;
  castBtn.disabled = false;
  castBtn.querySelector(".cast-btn-label").textContent = "再起一卦";
}

castBtn.addEventListener("click", cast);
