const CONFIG = {
  defaultBet: 1.0,
  startingBalance: 200.0,
  maxHistoryPoints: 60,
  houseEdge: 0.01,
  minBet: 0.1,
  maxBet: 10000.0,
  minMultiplier: 1.0,
  maxMultiplier: 100.0,
  autoCashoutDefault: 2.0,
  crashSpeed: 1.5,
  minCashoutMultiplier: 1.01
};

const balanceAmountEl = document.getElementById("balance-amount");
const betInput = document.getElementById("bet-input");
const betPreview = document.getElementById("bet-preview");
const betBtn = document.getElementById("bet-btn");
const cashoutBtn = document.getElementById("cashout-btn");
const autoCashoutInput = document.getElementById("auto-cashout-input");
const toggleAutoCashoutBtn = document.getElementById("toggle-auto-cashout");
const profitLabel = document.getElementById("profit-label");
const profitAmount = document.getElementById("profit-amount");
const currentMultiplierEl = document.getElementById("current-multiplier");
const recentMultipliersEl = document.getElementById("recent-multipliers");
const autoInfo = document.getElementById("auto-info");
const tabButtons = document.querySelectorAll(".tab-btn");
const betActionButtons = document.querySelectorAll("[data-bet-action]");
const addBtn = document.getElementById("add-money-btn");
const addPopup = document.getElementById("add-money-popup");
const addQuickButtons = document.querySelectorAll(".add-popup-btn[data-add]");
const addCustomInput = document.getElementById("add-custom-input");
const addCustomBtn = document.getElementById("add-custom-btn");
const statsPanel = document.getElementById("stats-panel");
const statsClose = document.getElementById("stats-close");
const statsOpen = document.getElementById("stats-open");
const statsRefresh = document.getElementById("stats-refresh");
const statsProfit = document.getElementById("stats-profit");
const statsWagered = document.getElementById("stats-wagered");
const statsWins = document.getElementById("stats-wins");
const statsLosses = document.getElementById("stats-losses");
const statsChartCanvas = document.getElementById("stats-chart");
const statsChartCtx = statsChartCanvas.getContext("2d");
const crashChartCanvas = document.getElementById("crash-chart");
const crashChartCtx = crashChartCanvas.getContext("2d");

const notificationContainer = document.createElement("div");
notificationContainer.className = "notification-container";
document.body.appendChild(notificationContainer);

const statsAdvancedContainer = document.createElement("div");
statsAdvancedContainer.className = "stats-advanced";
document.querySelector(".stats-body").appendChild(statsAdvancedContainer);

const menuBtn = document.createElement("button");
menuBtn.className = "menu-btn";
menuBtn.innerHTML = "🎮 Menu";
document.querySelector(".top-nav-left").appendChild(menuBtn);

const menuPanel = document.createElement("div");
menuPanel.className = "menu-panel hidden";
menuPanel.innerHTML = `
  <div class="menu-header">
    <h3>Demo Games</h3>
    <button class="menu-close">&times;</button>
  </div>

  <div class="menu-games">
    <div class="game-card" data-game="mines">
      <div class="game-icon">💣</div>
      <div class="game-info">
        <h4>Mines</h4>
        <p>Find gems, avoid mines</p>
      </div>
      <div class="game-badge" style="background:#00C74D;color:#000;">Play Now!</div>
    </div>

    <div class="game-card" data-game="plinko">
      <div class="game-icon">🎯</div>
      <div class="game-info">
        <h4>Plinko</h4>
        <p>Drop balls for multipliers</p>
      </div>
      <div class="game-badge" style="background:#00C74D;color:#000;">Play Now!</div>
    </div>

    <div class="game-card active" data-game="crash">
      <div class="game-icon">🚀</div>
      <div class="game-info">
        <h4>Crash</h4>
        <p>Cash out before it crashes</p>
      </div>
      <div class="game-badge active">Playing</div>
    </div>

    <div class="game-card" data-game="limbo">
      <div class="game-icon">🎯</div>
      <div class="game-info">
        <h4>Limbo</h4>
        <p>Instant multiplier game</p>
      </div>
      <div class="game-badge" style="background:#00C74D;color:#000;">Play Now!</div>
    </div>

    <div class="game-card" data-game="dice">
      <div class="game-icon">🎲</div>
      <div class="game-info">
        <h4>Dice</h4>
        <p>Predict dice rolls</p>
      </div>
      <div class="game-badge">Coming Soon</div>
    </div>

    <div class="game-card" data-game="roulette">
      <div class="game-icon">🎡</div>
      <div class="game-info">
        <h4>Roulette</h4>
        <p>Classic wheel betting</p>
      </div>
      <div class="game-badge">Coming Soon</div>
    </div>

    <div class="game-card" data-game="blackjack">
      <div class="game-icon">♠️</div>
      <div class="game-info">
        <h4>Blackjack</h4>
        <p>Beat the dealer</p>
      </div>
      <div class="game-badge">Coming Soon</div>
    </div>
  </div>

  <div class="menu-footer">
    <button class="btn dark small" id="reset-stats">Reset Stats</button>
  </div>
`;
document.body.appendChild(menuPanel);


const state = {
  balance: CONFIG.startingBalance,
  inRound: false,
  roundResolved: false,
  betAmount: CONFIG.defaultBet,
  currentMultiplier: 1.0,
  crashPoint: 1.0,
  currentRoundId: 0,
  autoCashoutEnabled: false,
  autoCashoutValue: CONFIG.autoCashoutDefault,
  animationId: null,
  roundStartTime: null,
  stats: {
    profit: 0,
    wagered: 0,
    wins: 0,
    losses: 0,
    history: [],
    highestMultiplier: 0,
    totalRounds: 0,
    bestProfitStreak: 0,
    currentStreak: 0,
    biggestWin: 0,
    biggestLoss: 0,
    totalPlayTime: 0,
    sessionStartTime: Date.now(),
    fastestCashout: null
  },
  recentMultipliers: [1.0, 1.5, 2.3, 0.5, 3.2],
  chartData: []
};

function showNotification(message, type = "info", duration = 4000) {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-icon">${getNotificationIcon(type)}</div>
    <div class="notification-content">${message}</div>
    <button class="notification-close">&times;</button>
  `;
  notificationContainer.appendChild(notification);
  setTimeout(() => notification.classList.add("show"), 10);
  notification
    .querySelector(".notification-close")
    .addEventListener("click", () => {
      notification.classList.remove("show");
      setTimeout(() => notification.remove(), 300);
    });
  setTimeout(() => {
    if (notification.parentNode) {
      notification.classList.remove("show");
      setTimeout(() => notification.remove(), 300);
    }
  }, duration);
}

function getNotificationIcon(type) {
  switch (type) {
    case "success":
      return "✓";
    case "warning":
      return "⚠";
    case "error":
      return "✕";
    default:
      return "ℹ";
  }
}

function toggleMenu() {
  menuPanel.classList.toggle("hidden");
}

function toggleMenu() {
  menuPanel.classList.toggle("hidden");
}

function setupMenu() {
  menuBtn.addEventListener("click", toggleMenu);

  menuPanel.querySelector(".menu-close").addEventListener("click", () => {
    menuPanel.classList.add("hidden");
  });

  menuPanel.querySelectorAll(".game-card").forEach(card => {
    card.addEventListener("click", () => {
      const game = card.dataset.game;

      if (game === "crash") return;

      if (game === "mines") {
        window.location.href = "https://tenorii23.github.io/Stake_Mines_Demo/";
        return;
      }

      if (game === "plinko") {
        window.open("https://plinko-web-game.netlify.app/", "_blank");
        return;
      }

      if (game === "limbo") {
        window.location.href = "https://tenorii23.github.io/Stake_Limbo_Demo/";
        return;
      }

      showNotification(`🎮 ${card.querySelector("h4").textContent} coming soon!`, "info", 3000);
    });
  });

  document.getElementById("reset-stats").addEventListener("click", () => {
    if (confirm("Reset all statistics? This cannot be undone.")) {
      resetStats();
      updateAdvancedStats();
      updateStatsUI();
      drawStatsChart();
      showNotification("Statistics reset", "info", 2000);
    }
  });

  document.addEventListener("click", e => {
    if (!menuPanel.contains(e.target) && !menuBtn.contains(e.target)) {
      menuPanel.classList.add("hidden");
    }
  });
}


function generateCrashPoint() {
  const r = Math.random();
  const house = CONFIG.houseEdge;
  const raw = (1 - house) / (1 - r);
  const withMin = Math.max(CONFIG.minMultiplier + 0.001, raw);
  return Math.min(withMin, CONFIG.maxMultiplier);
}

function startRound() {
  if (state.inRound && !state.roundResolved) return;

  const bet = parseFloat(state.betAmount);
  if (isNaN(bet) || bet < CONFIG.minBet) {
    showNotification(`Minimum bet is $${CONFIG.minBet}`, "warning");
    return;
  }
  if (bet > state.balance) {
    showNotification("Insufficient balance", "error");
    return;
  }

  state.inRound = true;
  state.roundResolved = false;
  state.currentMultiplier = 1.0;
  state.currentRoundId = Date.now();
  state.roundStartTime = Date.now();
  state.crashPoint = generateCrashPoint();
  state.chartData = [{ x: 0, y: 1 }];

  state.balance -= bet;
  state.stats.wagered += bet;
  state.stats.totalRounds += 1;

  betBtn.disabled = true;
  cashoutBtn.disabled = false;
  betBtn.textContent = "Waiting...";

  updateBalanceUI();
  updateProfitPreview();
  updateAdvancedStats();
  updateStatsUI();
  drawStatsChart();

  showNotification(`Round started! Bet: $${formatMoney(bet)}`, "info");

  if (state.animationId) {
    cancelAnimationFrame(state.animationId);
    state.animationId = null;
  }

  state.animationId = requestAnimationFrame(animateMultiplier);
}

function endRound(cashedOut = false) {
  if (state.roundResolved) return;
  state.roundResolved = true;
  state.inRound = false;

  betBtn.disabled = false;
  cashoutBtn.disabled = true;
  betBtn.textContent = "Bet";

  if (state.animationId) {
    cancelAnimationFrame(state.animationId);
    state.animationId = null;
  }

  const bet = state.betAmount;

  if (cashedOut) {
    const payout = bet * state.currentMultiplier;
    const profit = payout - bet;

    state.balance += payout;
    state.stats.wins += 1;
    state.stats.profit += profit;
    state.stats.currentStreak += 1;

    if (state.stats.currentStreak > state.stats.bestProfitStreak) {
      state.stats.bestProfitStreak = state.stats.currentStreak;
    }
    if (profit > state.stats.biggestWin) {
      state.stats.biggestWin = profit;
    }
    if (state.currentMultiplier > state.stats.highestMultiplier) {
      state.stats.highestMultiplier = state.currentMultiplier;
    }

    const roundTime = Date.now() - state.roundStartTime;
    if (!state.stats.fastestCashout || roundTime < state.stats.fastestCashout.time) {
      state.stats.fastestCashout = {
        time: roundTime,
        multiplier: state.currentMultiplier
      };
    }

    showNotification(
      `💰 Cashed out at ${state.currentMultiplier.toFixed(2)}x! Profit: +$${formatMoney(
        profit
      )}`,
      "success",
      5000
    );
  } else {
    state.stats.losses += 1;
    state.stats.profit -= bet;
    state.stats.currentStreak = 0;

    if (bet > state.stats.biggestLoss) {
      state.stats.biggestLoss = bet;
    }

    showNotification(
      `💥 Crashed at ${state.crashPoint.toFixed(2)}x! Loss: -$${formatMoney(bet)}`,
      "error",
      5000
    );
  }

  state.recentMultipliers.unshift(
    cashedOut ? state.currentMultiplier : Math.max(state.crashPoint, CONFIG.minMultiplier)
  );
  if (state.recentMultipliers.length > 5) {
    state.recentMultipliers.pop();
  }

  pushProfitHistory();
  updateRecentMultipliers();
  updateBalanceUI();
  updateAdvancedStats();
  updateStatsUI();
  drawStatsChart();

  currentMultiplierEl.textContent = "1.00x";
  currentMultiplierEl.style.color = "#00C74D";
  currentMultiplierEl.style.animation = "";
  currentMultiplierEl.style.textShadow = "none";
}

function animateMultiplier() {
  if (!state.inRound || state.roundResolved) return;

  const elapsedMs = Date.now() - state.roundStartTime;
  const t = elapsedMs / 1000;

  state.currentMultiplier = 1 + Math.pow(t, CONFIG.crashSpeed) * 0.5;

  let color;
  if (state.currentMultiplier < 2) color = "#00C74D";
  else if (state.currentMultiplier < 5) color = "#F5A623";
  else if (state.currentMultiplier < 10) color = "#FF6B00";
  else color = "#FF4141";

  currentMultiplierEl.textContent = `${state.currentMultiplier.toFixed(2)}x`;
  currentMultiplierEl.style.color = color;
  currentMultiplierEl.style.textShadow =
    state.currentMultiplier > 5 ? `0 0 10px ${color}` : "none";

  state.chartData.push({ x: t, y: state.currentMultiplier });
  drawCrashChart();

  if (state.currentMultiplier >= state.crashPoint) {
    state.currentMultiplier = state.crashPoint;
    currentMultiplierEl.textContent = `${state.crashPoint.toFixed(2)}x`;
    currentMultiplierEl.style.color = "#FF4141";
    currentMultiplierEl.style.textShadow = "0 0 20px rgba(255, 65, 65, 0.7)";
    currentMultiplierEl.style.animation = "flash 0.3s infinite";

    state.chartData.push({ x: t, y: state.crashPoint });
    drawCrashChart();

    setTimeout(() => {
      endRound(false);
    }, 800);
    return;
  }

  if (
    state.autoCashoutEnabled &&
    state.currentMultiplier >= state.autoCashoutValue &&
    state.currentMultiplier >= CONFIG.minCashoutMultiplier
  ) {
    cashout(true);
    return;
  }

  updateProfitPreview();
  state.animationId = requestAnimationFrame(animateMultiplier);
}

function cashout(auto = false) {
  if (!state.inRound || state.roundResolved) return;
  if (state.currentMultiplier < CONFIG.minCashoutMultiplier) {
    if (!auto) {
      showNotification(
        `You can only cash out after ${CONFIG.minCashoutMultiplier.toFixed(2)}x`,
        "warning",
        2500
      );
    }
    return;
  }

  if (state.animationId) {
    cancelAnimationFrame(state.animationId);
    state.animationId = null;
  }

  currentMultiplierEl.style.textShadow = "none";
  currentMultiplierEl.style.animation = "";
  endRound(true);
}

function formatMoney(v) {
  return v.toFixed(2);
}

function updateBalanceUI() {
  balanceAmountEl.textContent = formatMoney(state.balance);
  balanceAmountEl.style.transform = "scale(1.1)";
  setTimeout(() => (balanceAmountEl.style.transform = "scale(1)"), 200);
}

function updateBetPreview() {
  betPreview.textContent = "$" + formatMoney(state.betAmount);
}

function updateProfitPreview() {
  if (!state.inRound || state.roundResolved) {
    profitLabel.textContent = "Current Multiplier: 1.00x";
    profitAmount.textContent = "$" + formatMoney(state.betAmount);
    profitAmount.style.color = "#FFFFFF";
    return;
  }

  const payout = state.betAmount * state.currentMultiplier;
  const profit = payout - state.betAmount;

  profitLabel.textContent = `Current Multiplier: ${state.currentMultiplier.toFixed(2)}x`;
  profitAmount.textContent = "$" + formatMoney(payout);

  if (profit > 0) profitAmount.style.color = "#00C74D";
  else if (profit < 0) profitAmount.style.color = "#FF4141";
  else profitAmount.style.color = "#FFFFFF";
}

function updateRecentMultipliers() {
  recentMultipliersEl.innerHTML = "";
  state.recentMultipliers.forEach((multiplier) => {
    const valueEl = document.createElement("div");
    valueEl.className = "recent-value";
    valueEl.textContent = `${multiplier.toFixed(2)}x`;
    valueEl.style.color = multiplier >= 1.0 ? "#00C74D" : "#FF4141";
    recentMultipliersEl.appendChild(valueEl);
  });
}

function resizeCanvases() {
  const dpr = window.devicePixelRatio || 1;

  const crashContainer = crashChartCanvas.parentElement;
  const statsContainer = statsChartCanvas.parentElement;

  if (crashContainer) {
    const w = crashContainer.clientWidth;
    const h = crashContainer.clientHeight;
    crashChartCanvas.style.width = w + "px";
    crashChartCanvas.style.height = h + "px";
    crashChartCanvas.width = w * dpr;
    crashChartCanvas.height = h * dpr;
    crashChartCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    crashChartCtx.imageSmoothingEnabled = true;
    crashChartCtx.imageSmoothingQuality = "high";
  }

  if (statsContainer) {
    const w = statsContainer.clientWidth;
    const h = statsContainer.clientHeight;
    statsChartCanvas.style.width = w + "px";
    statsChartCanvas.style.height = h + "px";
    statsChartCanvas.width = w * dpr;
    statsChartCanvas.height = h * dpr;
    statsChartCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    statsChartCtx.imageSmoothingEnabled = true;
    statsChartCtx.imageSmoothingQuality = "high";
  }
}

function drawCrashChart() {
  const dpr = window.devicePixelRatio || 1;
  crashChartCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const ctx = crashChartCtx;
  const w = crashChartCanvas.width / dpr;
  const h = crashChartCanvas.height / dpr;

  if (!w || !h) return;

  ctx.clearRect(0, 0, w, h);

  const bgGradient = ctx.createLinearGradient(0, 0, 0, h);
  bgGradient.addColorStop(0, "#0A1622");
  bgGradient.addColorStop(1, "#0C1824");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, w, h);

  if (state.chartData.length < 2) return;

  const currentTime = state.chartData[state.chartData.length - 1].x;
  const windowStart = Math.max(0, currentTime - 12);
  const windowEnd = currentTime;
  const windowDuration = windowEnd - windowStart || 1;

  const visibleData = state.chartData.filter((d) => d.x >= windowStart);
  if (visibleData.length < 2) return;

  const minY = 1.0;
  const maxY = Math.max(
    ...visibleData.map((d) => d.y),
    state.currentMultiplier * 1.4,
    6.0
  );
  const yRange = maxY - minY || 1;

  const margin = { top: 40, right: 30, bottom: 50, left: 55 };
  const chartWidth = w - margin.left - margin.right;
  const chartHeight = h - margin.top - margin.bottom;

  const timeToX = (time) => {
    const rel = time - windowStart;
    const progress = rel / windowDuration;
    return margin.left + progress * chartWidth;
  };

  const multToY = (m) => {
    const norm = (m - minY) / yRange;
    return margin.top + chartHeight - norm * chartHeight;
  };

  ctx.strokeStyle = "rgba(167, 179, 195, 0.15)";
  ctx.lineWidth = 1;

  const timeStep = 2;
  const firstGridTime = Math.ceil(windowStart / timeStep) * timeStep;
  for (let t = firstGridTime; t <= windowEnd; t += timeStep) {
    const x = timeToX(t);
    if (x >= margin.left && x <= margin.left + chartWidth) {
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + chartHeight);
      ctx.stroke();

      ctx.fillStyle = "#A7B3C3";
      ctx.font = "10px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(`${t.toFixed(0)}s`, x, margin.top + chartHeight + 18);
    }
  }

  let multStep = 1;
  if (maxY > 10) multStep = 2;
  if (maxY > 20) multStep = 5;
  if (maxY > 50) multStep = 10;

  for (let m = minY; m <= maxY; m += multStep) {
    const y = multToY(m);
    if (y >= margin.top && y <= margin.top + chartHeight) {
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + chartWidth, y);
      ctx.stroke();

      ctx.fillStyle = "#A7B3C3";
      ctx.font = "10px system-ui";
      ctx.textAlign = "right";
      ctx.fillText(`${m.toFixed(1)}x`, margin.left - 8, y + 3);
    }
  }

  ctx.beginPath();
  let first = true;
  for (let i = 0; i < visibleData.length; i++) {
    const p = visibleData[i];
    const x = timeToX(p.x);
    const y = multToY(p.y);

    if (first) {
      ctx.moveTo(x, y);
      first = false;
    } else {
      const prev = visibleData[i - 1];
      const px = timeToX(prev.x);
      const py = multToY(prev.y);
      const cp1x = px + (x - px) * 0.5;
      const cp1y = py;
      const cp2x = px + (x - px) * 0.5;
      const cp2y = y;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
    }
  }

  const lineGradient = ctx.createLinearGradient(0, margin.top, 0, margin.top + chartHeight);
  lineGradient.addColorStop(0, "#FF4141");
  lineGradient.addColorStop(0.4, "#FF6B00");
  lineGradient.addColorStop(0.7, "#F5A623");
  lineGradient.addColorStop(1, "#00C74D");

  ctx.strokeStyle = lineGradient;
  ctx.lineWidth = 3;
  ctx.stroke();

  if (visibleData.length > 0) {
    const last = visibleData[visibleData.length - 1];
    const x = timeToX(last.x);
    const y = multToY(last.y);

    let pointColor;
    if (state.currentMultiplier < 2) pointColor = "#00C74D";
    else if (state.currentMultiplier < 5) pointColor = "#F5A623";
    else if (state.currentMultiplier < 10) pointColor = "#FF6B00";
    else pointColor = "#FF4141";

    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, 14);
    glowGradient.addColorStop(0, pointColor + "80");
    glowGradient.addColorStop(1, pointColor + "00");
    ctx.fillStyle = glowGradient;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = pointColor;
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.stroke();

    if (state.inRound && !state.roundResolved) {
      ctx.fillStyle = pointColor;
      ctx.font = "bold 12px system-ui";
      ctx.textAlign = "left";
      ctx.fillText(`${state.currentMultiplier.toFixed(2)}x`, x + 12, y - 10);
    }
  }

  ctx.fillStyle = "#A7B3C3";
  ctx.font = "11px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("Time (seconds)", margin.left + chartWidth / 2, h - 20);

  ctx.save();
  ctx.translate(20, margin.top + chartHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillText("Multiplier", 0, 0);
  ctx.restore();
}

function drawStatsChart() {
  const dpr = window.devicePixelRatio || 1;
  statsChartCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const ctx = statsChartCtx;
  const w = statsChartCanvas.width / dpr;
  const h = statsChartCanvas.height / dpr;

  if (!w || !h) return;

  ctx.clearRect(0, 0, w, h);

  const bgGradient = ctx.createLinearGradient(0, 0, w, h);
  bgGradient.addColorStop(0, "#0A1622");
  bgGradient.addColorStop(1, "#0C1824");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, w, h);

  const values = state.stats.history;
  if (!values.length) {
    ctx.fillStyle = "#A7B3C3";
    ctx.font = "12px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("No rounds yet", w / 2, h / 2);
    return;
  }

  const minVal = Math.min(0, ...values);
  const maxVal = Math.max(0, ...values);
  const range = maxVal - minVal || 1;
  const pad = 20;
  const usableW = w - pad * 2;
  const usableH = h - pad * 2;

  const zeroY = pad + (1 - (0 - minVal) / range) * usableH;

  ctx.beginPath();
  ctx.moveTo(pad, zeroY);
  ctx.lineTo(pad + usableW, zeroY);
  ctx.strokeStyle = "rgba(167, 179, 195, 0.45)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  values.forEach((v, i) => {
    const x = pad + (i / Math.max(values.length - 1, 1)) * usableW;
    const y = pad + (1 - (v - minVal) / range) * usableH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  const lastVal = values[values.length - 1];
  const up = lastVal >= 0;
  ctx.strokeStyle = up ? "#00C74D" : "#FF4141";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = up ? "#00C74D" : "#FF4141";
  ctx.font = "bold 11px system-ui";
  ctx.textAlign = "right";
  const displayY = Math.max(25, zeroY - 8);
  ctx.fillText(`$${formatMoney(lastVal)}`, w - pad, displayY);
}

function updateAdvancedStats() {
  const totalGames = state.stats.wins + state.stats.losses;
  const winRate = totalGames > 0 ? (state.stats.wins / totalGames) * 100 : 0;

  const sessionTime = Date.now() - state.stats.sessionStartTime;
  const hours = Math.floor(sessionTime / (1000 * 60 * 60));
  const minutes = Math.floor((sessionTime % (1000 * 60 * 60)) / (1000 * 60));

  const avgBet = totalGames > 0 ? state.stats.wagered / totalGames : 0;

  const fastestCashoutText = state.stats.fastestCashout
    ? `${(state.stats.fastestCashout.time / 1000).toFixed(2)}s`
    : "N/A";

  statsAdvancedContainer.innerHTML = `
    <div class="stats-advanced-grid">
      <div class="stats-advanced-card">
        <div class="stats-advanced-label">Win Rate</div>
        <div class="stats-advanced-value">${winRate.toFixed(1)}%</div>
        <div class="stats-advanced-sub">${state.stats.wins}W : ${
    state.stats.losses
  }L</div>
      </div>
      <div class="stats-advanced-card">
        <div class="stats-advanced-label">Highest Multiplier</div>
        <div class="stats-advanced-value">${state.stats.highestMultiplier.toFixed(
          2
        )}x</div>
        <div class="stats-advanced-sub">Best Streak: ${
          state.stats.bestProfitStreak
        }</div>
      </div>
      <div class="stats-advanced-card">
        <div class="stats-advanced-label">Biggest Win</div>
        <div class="stats-advanced-value positive">+$${formatMoney(
          state.stats.biggestWin
        )}</div>
        <div class="stats-advanced-sub">Biggest Loss: -$${formatMoney(
          state.stats.biggestLoss
        )}</div>
      </div>
      <div class="stats-advanced-card">
        <div class="stats-advanced-label">Avg Bet</div>
        <div class="stats-advanced-value">$${formatMoney(avgBet)}</div>
        <div class="stats-advanced-sub">Fastest: ${fastestCashoutText}</div>
      </div>
      <div class="stats-advanced-card">
        <div class="stats-advanced-label">Current Streak</div>
        <div class="stats-advanced-value ${
          state.stats.currentStreak > 0 ? "positive" : "negative"
        }">${state.stats.currentStreak}</div>
        <div class="stats-advanced-sub">Total Rounds: ${
          state.stats.totalRounds
        }</div>
      </div>
      <div class="stats-advanced-card">
        <div class="stats-advanced-label">Session Time</div>
        <div class="stats-advanced-value">${hours}h ${minutes}m</div>
        <div class="stats-advanced-sub">Wagered: $${formatMoney(
          state.stats.wagered
        )}</div>
      </div>
    </div>
  `;
}

function pushProfitHistory() {
  state.stats.history.push(state.stats.profit);
  if (state.stats.history.length > CONFIG.maxHistoryPoints) {
    state.stats.history.shift();
  }
}

function updateStatsUI() {
  statsProfit.textContent = "$" + formatMoney(state.stats.profit);
  statsProfit.classList.toggle("positive", state.stats.profit >= 0);
  statsProfit.classList.toggle("negative", state.stats.profit < 0);

  statsWagered.textContent = "$" + formatMoney(state.stats.wagered);
  statsWins.textContent = state.stats.wins.toString();
  statsLosses.textContent = state.stats.losses.toString();
}

function resetStats() {
  state.stats = {
    profit: 0,
    wagered: 0,
    wins: 0,
    losses: 0,
    history: [],
    highestMultiplier: 0,
    totalRounds: 0,
    bestProfitStreak: 0,
    currentStreak: 0,
    biggestWin: 0,
    biggestLoss: 0,
    totalPlayTime: 0,
    sessionStartTime: Date.now(),
    fastestCashout: null
  };
}

function onBetInputChange() {
  if (state.inRound && !state.roundResolved) {
    betInput.value = formatMoney(state.betAmount);
    showNotification("Cannot change bet during a round", "warning");
    return;
  }

  const v = parseFloat(betInput.value);
  if (isNaN(v) || v < CONFIG.minBet) {
    state.betAmount = CONFIG.minBet;
    betInput.value = CONFIG.minBet.toFixed(2);
  } else if (v > state.balance) {
    state.betAmount = Math.min(state.balance, CONFIG.maxBet);
    betInput.value = formatMoney(state.betAmount);
    showNotification(
      `Bet cannot exceed balance of $${formatMoney(state.balance)}`,
      "warning"
    );
  } else {
    state.betAmount = v;
  }
  updateBetPreview();
  updateProfitPreview();
}

function onAutoCashoutChange() {
  const v = parseFloat(autoCashoutInput.value);
  if (isNaN(v) || v < CONFIG.minCashoutMultiplier) {
    state.autoCashoutValue = CONFIG.minCashoutMultiplier;
    autoCashoutInput.value = CONFIG.minCashoutMultiplier.toFixed(2);
  } else {
    state.autoCashoutValue = v;
  }
}

function toggleAutoCashout() {
  state.autoCashoutEnabled = !state.autoCashoutEnabled;
  toggleAutoCashoutBtn.textContent = state.autoCashoutEnabled ? "ON" : "OFF";
  toggleAutoCashoutBtn.style.background = state.autoCashoutEnabled
    ? "#00C74D"
    : "#1A2C3D";
  toggleAutoCashoutBtn.style.color = state.autoCashoutEnabled ? "#000" : "#A7B3C3";

  showNotification(
    state.autoCashoutEnabled
      ? `Auto cashout enabled at ${state.autoCashoutValue.toFixed(2)}x`
      : "Auto cashout disabled",
    "info"
  );
}

function attachEvents() {
  betInput.addEventListener("input", onBetInputChange);
  autoCashoutInput.addEventListener("input", onAutoCashoutChange);
  toggleAutoCashoutBtn.addEventListener("click", toggleAutoCashout);

  betBtn.addEventListener("click", () => {
    if (!state.inRound || state.roundResolved) {
      startRound();
    }
  });

  cashoutBtn.addEventListener("click", () => {
    cashout(false);
  });

  betActionButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (state.inRound && !state.roundResolved) {
        showNotification("Cannot change bet during a round", "warning");
        return;
      }

      let bet = state.betAmount;

      if (btn.dataset.betAction === "half") bet /= 2;
      if (btn.dataset.betAction === "double") bet *= 2;

      bet = Math.max(CONFIG.minBet, parseFloat(bet.toFixed(2)));

      if (bet > state.balance) {
        bet = Math.min(state.balance, CONFIG.maxBet);
        showNotification(
          `Bet cannot exceed balance of $${formatMoney(state.balance)}`,
          "warning"
        );
      }

      state.betAmount = bet;
      betInput.value = bet.toFixed(2);
      updateBetPreview();
      updateProfitPreview();

      showNotification(`Bet set to $${formatMoney(bet)}`, "info", 1500);
    });
  });

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("active")) return;
      tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      autoInfo.classList.toggle("hidden", btn.dataset.tab !== "auto");

      if (btn.dataset.tab === "auto") {
        showNotification("Auto mode is visual only in this demo", "info", 3000);
      }
    });
  });

  addBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    addPopup.classList.toggle("hidden");
  });

  addQuickButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const amt = parseFloat(btn.dataset.add);
      if (!isNaN(amt) && amt > 0) {
        state.balance += amt;
        updateBalanceUI();
        addPopup.classList.add("hidden");
        showNotification(`Added $${formatMoney(amt)} to balance`, "success", 2000);
      }
    });
  });

  addCustomBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const v = parseFloat(addCustomInput.value);
    if (!isNaN(v) && v > 0) {
      state.balance += v;
      updateBalanceUI();
      addCustomInput.value = "";
      addPopup.classList.add("hidden");
      showNotification(`Added $${formatMoney(v)} to balance`, "success", 2000);
    } else {
      showNotification("Please enter a valid amount", "error", 2000);
    }
  });

  document.addEventListener("click", () => {
    addPopup.classList.add("hidden");
  });

  addPopup.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  statsClose.addEventListener("click", () => {
    statsPanel.classList.add("hidden");
    statsOpen.classList.remove("hidden");
  });

  statsOpen.addEventListener("click", () => {
    statsPanel.classList.remove("hidden");
    statsOpen.classList.add("hidden");
  });

  statsRefresh.addEventListener("click", () => {
    if (confirm("Reset all statistics? This cannot be undone.")) {
      resetStats();
      updateAdvancedStats();
      updateStatsUI();
      drawStatsChart();
      showNotification("Statistics reset", "info", 2000);
    }
  });
}

function init() {
  state.balance = CONFIG.startingBalance;
  state.betAmount = CONFIG.defaultBet;
  state.autoCashoutValue = CONFIG.autoCashoutDefault;

  resizeCanvases();
  window.addEventListener("resize", () => {
    setTimeout(() => {
      resizeCanvases();
      drawCrashChart();
      drawStatsChart();
    }, 100);
  });

  updateBalanceUI();
  betInput.value = CONFIG.defaultBet.toFixed(2);
  autoCashoutInput.value = CONFIG.autoCashoutDefault.toFixed(2);
  updateBetPreview();
  updateProfitPreview();
  updateRecentMultipliers();
  updateAdvancedStats();
  updateStatsUI();
  drawStatsChart();
  drawCrashChart();
  attachEvents();
  setupMenu();

  setTimeout(() => {
    resizeCanvases();
    drawCrashChart();
    drawStatsChart();
  }, 100);
}

document.addEventListener("DOMContentLoaded", init);
