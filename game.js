const HEADLINES = [
  "LOCAL MAN BUYS ONE MORE UPGRADE, FORGETS WHY",
  "STUDY FINDS BRAIN PREFERS RECTANGLE THAT BOUNCES",
  "BREAKING: NOTHING IS HAPPENING, WATCH ANYWAY",
  "EXPERTS URGE YOU TO CHECK THE OTHER CORNER",
  "NEW APP PROMISES LESS APP",
  "HYDRAULIC PRESS DECLARED EMOTIONAL SUPPORT TOOL",
  "VIEWERS DEMAND MORE, CANNOT NAME WHAT",
  "SHORE STILL EXISTS, SAYS OCEAN"
];

const ACH = [
  { id: "first", name: "First tap", test: s => s.clicks >= 1 },
  { id: "cadet", name: "Click cadet (100)", test: s => s.clicks >= 100 },
  { id: "discs", name: "Badge hoarder (5)", test: s => s.owned.bounce >= 5 },
  { id: "noise", name: "Opened the shop of noise", test: s => Object.values(s.owned).some(n => n > 0) },
  { id: "crush", name: "Crushed something", test: s => s.presses >= 1 },
  { id: "rich", name: "10k overload", test: s => s.total >= 10000 },
  { id: "shore", name: "Walked to the water", test: s => s.won }
];

const U = [
  { id: "bounce", name: "Bouncing OVR", desc: "+1 per wall hit. Buy again for another badge.", base: 5, repeat: true, max: 8, ico: "assets/svg/ovr.svg" },
  { id: "pops", name: "Amount animation", desc: "+1 per click. Numbers float off the button.", base: 10, ico: "assets/svg/glow.svg" },
  { id: "meter", name: "Per-second meter", desc: "See the bleed rate.", base: 25, ico: "assets/svg/glow.svg" },
  { id: "glow", name: "Button glow", desc: "+1 per click. The button gets louder visually.", base: 40, ico: "assets/svg/glow.svg" },
  { id: "ping", name: "Bounce ping", desc: "Wall hits pay +5 instead of +1.", base: 75, ico: "assets/svg/speaker.svg" },
  { id: "rats", name: "Yard Rats", desc: "Original endless-runner sludge in the corner. +3/s.", base: 100, ico: "assets/svg/runner.svg" },
  { id: "news", name: "Breaking news", desc: "Stay informed about nothing. +4/s.", base: 100, ico: "assets/svg/news.svg" },
  { id: "crit", name: "Critical hits", desc: "8% chance a click pays 8\u00d7.", base: 200, ico: "assets/svg/crit.svg" },
  { id: "cups", name: "Trophies", desc: "A list that congratulates you for existing.", base: 400, ico: "assets/svg/trophy.svg" },
  { id: "press", name: "Hydraulic press", desc: "Tap the press for a burst. Cooldown 1.6s.", base: 800, ico: "assets/svg/press.svg" },
  { id: "slime", name: "Slime drip", desc: "The screen sweats. +8/s.", base: 1600, ico: "assets/svg/slime.svg" },
  { id: "shore", name: "Go to the shore", desc: "Turn everything off.", base: 8000, ico: "assets/svg/wave.svg" }
];

const S = {
  n: 0, total: 0, clicks: 0, presses: 0, muted: false, won: false,
  owned: Object.fromEntries(U.map(u => [u.id, 0])),
  ach: {},
  logos: []
};

let audio;
function beep(freq = 420, dur = 0.04, type = "square", gain = 0.03) {
  if (S.muted) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = gain;
    o.connect(g); g.connect(audio.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur);
    o.stop(audio.currentTime + dur);
  } catch {}
}

function fmt(n) {
  n = Math.floor(n);
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e4) return (n / 1e3).toFixed(1) + "k";
  return String(n);
}
function costOf(u) {
  const k = S.owned[u.id] || 0;
  return Math.floor(u.base * Math.pow(u.repeat ? 1.5 : 1, k));
}
function spc() {
  let v = 1;
  if (S.owned.pops) v += 1;
  if (S.owned.glow) v += 1;
  return v;
}
function sps() {
  let v = 0;
  if (S.owned.rats) v += 3;
  if (S.owned.news) v += 4;
  if (S.owned.slime) v += 8;
  return v;
}
function bouncePay() { return S.owned.ping ? 5 : 1; }

function add(amount, x, y, crit) {
  if (amount <= 0) return;
  S.n += amount; S.total += amount;
  if (x != null) float(amount, x, y, crit);
  renderHud();
}
function float(amount, x, y, crit) {
  if (!S.owned.pops && !crit) return;
  const el = document.createElement("div");
  el.className = "floater " + (crit ? "crit" : "norm");
  el.textContent = (crit ? "CRIT +" : "+") + fmt(amount);
  el.style.left = x + "px"; el.style.top = y + "px";
  document.getElementById("stage").appendChild(el);
  setTimeout(() => el.remove(), 700);
}
function toast(t) {
  const box = document.getElementById("toasts");
  const el = document.createElement("div");
  el.className = "toast"; el.textContent = t;
  box.appendChild(el);
  setTimeout(() => el.remove(), 2400);
}
function checkAch() {
  if (!S.owned.cups) return;
  for (const a of ACH) {
    if (!S.ach[a.id] && a.test(S)) {
      S.ach[a.id] = true;
      toast("Trophy: " + a.name);
      beep(880, 0.12, "triangle", 0.04);
    }
  }
  paintAch();
}
function paintAch() {
  const ul = document.getElementById("ach-list");
  ul.innerHTML = ACH.map(a =>
    `<li class="${S.ach[a.id] ? "on" : ""}">${S.ach[a.id] ? "\u2713" : "\u25cb"} ${a.name}</li>`
  ).join("");
}
function applyVisuals() {
  document.getElementById("sps").style.display = S.owned.meter ? "block" : "none";
  document.getElementById("main-btn").classList.toggle("glow", !!S.owned.glow);
  document.getElementById("ticker").style.display = S.owned.news ? "block" : "none";
  document.getElementById("runner").style.display = S.owned.rats ? "block" : "none";
  document.getElementById("press").style.display = S.owned.press ? "block" : "none";
  document.getElementById("slime").style.display = S.owned.slime ? "block" : "none";
  document.getElementById("ach").style.display = S.owned.cups ? "block" : "none";
  if (S.owned.news) {
    document.title = "Overload Clicker";
    document.getElementById("headlines").textContent = HEADLINES.concat(HEADLINES).join("   \u2022   ");
  }
}
function visibleUpgrades() {
  const out = [];
  const bounce = U.find(u => u.id === "bounce");
  if (S.owned.bounce < bounce.max) out.push(bounce);
  if (S.owned.press) out.push(U.find(u => u.id === "press"));
  for (const u of U) {
    if (u.repeat) continue;
    if (S.owned[u.id]) continue;
    out.push(u);
    if (out.filter(x => !x.repeat && x.id !== "press").length >= 4) break;
  }
  const seen = new Set();
  return out.filter(u => (seen.has(u.id) ? false : seen.add(u.id)));
}
function renderShop() {
  const list = document.getElementById("up-list");
  list.innerHTML = visibleUpgrades().map(u => {
    const c = costOf(u);
    const extra = u.repeat ? ` \u00d7${S.owned[u.id]}` : "";
    const can = S.n >= c && (!u.max || S.owned[u.id] < u.max);
    return `<button class="up" data-id="${u.id}" ${can ? "" : "disabled"}>
      <img class="ico" src="${u.ico}" alt="" />
      <div><div class="name">${u.name}${extra}</div><div class="desc">${u.desc}</div></div>
      <div class="cost">${fmt(c)}</div>
    </button>`;
  }).join("") || `<p style="color:#666;font-size:13px">Nothing left but the shore.</p>`;
}
function renderHud() {
  document.getElementById("count").textContent = fmt(S.n) + " overload";
  document.getElementById("sps").textContent = sps().toFixed(1) + " / sec";
}
function buy(id) {
  const u = U.find(x => x.id === id);
  if (!u) return;
  const c = costOf(u);
  if (S.n < c) return;
  if (u.max && S.owned[u.id] >= u.max) return;
  S.n -= c; S.owned[u.id] += 1;
  beep(240, 0.07, "sawtooth", 0.025);
  if (id === "bounce") spawnLogo();
  if (id === "shore") win();
  applyVisuals(); renderHud(); renderShop(); checkAch();
}
function spawnLogo() {
  const img = document.createElement("img");
  img.src = "assets/svg/ovr.svg"; img.className = "logo";
  const w = 108, h = 108;
  const logo = {
    el: img,
    x: 40 + Math.random() * (innerWidth * 0.4),
    y: 80 + Math.random() * (innerHeight * 0.4),
    vx: (Math.random() < 0.5 ? -1 : 1) * (1.6 + Math.random()),
    vy: (Math.random() < 0.5 ? -1 : 1) * (1.3 + Math.random()),
    w, h
  };
  document.getElementById("stage").appendChild(img);
  S.logos.push(logo);
}
function tickLogos() {
  const W = innerWidth, H = innerHeight;
  for (const L of S.logos) {
    L.x += L.vx; L.y += L.vy;
    let hit = false;
    if (L.x <= 0 || L.x + L.w >= W) { L.vx *= -1; L.x = Math.max(0, Math.min(W - L.w, L.x)); hit = true; }
    if (L.y <= 0 || L.y + L.h >= H) { L.vy *= -1; L.y = Math.max(0, Math.min(H - L.h, L.y)); hit = true; }
    L.el.style.transform = `translate(${L.x}px, ${L.y}px)`;
    if (hit) {
      add(bouncePay());
      if (S.owned.ping) beep(660, 0.03, "square", 0.02);
    }
  }
}
function clickMain(ev) {
  if (S.won) return;
  S.clicks += 1;
  let amt = spc(); let crit = false;
  if (S.owned.crit && Math.random() < 0.08) { amt *= 8; crit = true; beep(1200, 0.09, "square", 0.05); }
  else beep(380 + Math.random() * 40, 0.035);
  const r = ev.target.getBoundingClientRect();
  add(amt, r.left + r.width / 2 + (Math.random() * 40 - 20), r.top - 8, crit);
  checkAch(); renderShop();
}
let pressCd = false;
function clickPress() {
  if (pressCd || !S.owned.press || S.won) return;
  pressCd = true; S.presses += 1;
  const burst = 40 + Math.floor(S.owned.bounce * 8);
  add(burst); beep(90, 0.18, "sawtooth", 0.05);
  document.getElementById("press-hint").textContent = "CRUSH +" + burst;
  setTimeout(() => {
    pressCd = false;
    document.getElementById("press-hint").textContent = "PRESS \u2014 crush for a burst";
  }, 1600);
  checkAch(); renderShop();
}
function win() {
  S.won = true;
  document.getElementById("ocean").style.display = "block";
  checkAch();
}
function reset() {
  S.n = 0; S.total = 0; S.clicks = 0; S.presses = 0; S.won = false; S.ach = {};
  for (const k of Object.keys(S.owned)) S.owned[k] = 0;
  S.logos.forEach(L => L.el.remove()); S.logos = [];
  document.getElementById("ocean").style.display = "none";
  document.title = "untitled";
  applyVisuals(); renderHud(); renderShop(); paintAch();
}

document.getElementById("main-btn").addEventListener("click", clickMain);
document.getElementById("press").addEventListener("click", clickPress);
document.getElementById("up-list").addEventListener("click", e => {
  const b = e.target.closest("[data-id]");
  if (b && !b.disabled) buy(b.dataset.id);
});
document.getElementById("mute").addEventListener("click", () => {
  S.muted = !S.muted;
  document.getElementById("mute").textContent = S.muted ? "sound off" : "sound on";
});
document.getElementById("reset").addEventListener("click", reset);
document.getElementById("again").addEventListener("click", reset);

let last = performance.now(); let acc = 0;
function loop(t) {
  const dt = Math.min(0.05, (t - last) / 1000);
  last = t;
  if (!S.won) {
    tickLogos();
    acc += sps() * dt;
    if (acc >= 1) { const give = Math.floor(acc); acc -= give; add(give); }
  }
  requestAnimationFrame(loop);
}
applyVisuals(); renderHud(); renderShop(); paintAch();
requestAnimationFrame(loop);
