const CONFIG = {
  defaultBet: 1.00,
  startingBalance: 200.00,
  maxHistoryPoints: 60,
  houseEdge: 0.01,
  minBet: 0.10,
  maxBet: 10000.00,
  minMultiplier: 1.00,
  maxMultiplier: 100.00,
  autoCashoutDefault: 2.00,
  crashSpeed: 1.5 // Multiplier increase speed
};

// DOM Elements
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

// Create notification system
const notificationContainer = document.createElement("div");
notificationContainer.className = "notification-container";
document.body.appendChild(notificationContainer);

// Create enhanced stats display
const statsAdvancedContainer = document.createElement("div");
statsAdvancedContainer.className = "stats-advanced";
document.querySelector('.stats-body').appendChild(statsAdvancedContainer);

// Create menu button and panel
const menuBtn = document.createElement("button");
menuBtn.className = "menu-btn";
menuBtn.innerHTML = "🎮 Menu";
document.querySelector('.top-nav-left').appendChild(menuBtn);

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
      <div class="game-badge" style="background: #00C74D; color: #000;">Play Now!</div>
    </div>
    <div class="game-card" data-game="plinko">
      <div class="game-icon">🎯</div>
      <div class="game-info">
        <h4>Plinko</h4>
        <p>Drop balls for multipliers</p>
      </div>
      <div class="game-badge" style="background: #00C74D; color: #000;">Play Now!</div>
    </div>
    <div class="game-card" data-game="crash" data-active="true">
      <div class="game-icon">🚀</div>
      <div class="game-info">
        <h4>Crash</h4>
        <p>Cash out before it crashes</p>
      </div>
      <div class="game-badge active">Playing</div>
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

// Game state
const state = {
  balance: CONFIG.startingBalance,
  inRound: false,
  betAmount: CONFIG.defaultBet,
  currentMultiplier: 1.00,
  crashPoint: 1.00,
  roundHistory: [],
  currentRoundId: 0,
  autoCashoutEnabled: false,
  autoCashoutValue: CONFIG.autoCashoutDefault,
  animationId: null,
  roundStartTime: null,
  soundsEnabled: true,
  hotkeysEnabled: true,
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
  recentMultipliers: [1.00, 1.50, 2.30, 0.50, 3.20],
  chartData: []
};

// ==================== NOTIFICATION SYSTEM ====================

function showNotification(message, type = 'info', duration = 4000) {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-icon">${getNotificationIcon(type)}</div>
    <div class="notification-content">${message}</div>
    <button class="notification-close">&times;</button>
  `;
  
  notificationContainer.appendChild(notification);
  
  setTimeout(() => notification.classList.add('show'), 10);
  
  notification.querySelector('.notification-close').addEventListener('click', () => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  });
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }
  }, duration);
}

function getNotificationIcon(type) {
  switch(type) {
    case 'success': return '✓';
    case 'warning': return '⚠';
    case 'error': return '✕';
    default: return 'ℹ';
  }
}

// ==================== MENU SYSTEM ====================

function toggleMenu() {
  menuPanel.classList.toggle('hidden');
}

function setupMenu() {
  menuBtn.addEventListener('click', toggleMenu);
  
  document.querySelector('.menu-close').addEventListener('click', () => {
    menuPanel.classList.add('hidden');
  });
  
  // Game card clicks
  document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
      const game = card.dataset.game;
      
      if (game === 'crash') {
        // Already on Crash, do nothing
        return;
      }
      
      if (game === 'mines') {
        // Go back to Mines
        window.location.href = 'https://tenorii23.github.io/Stake_Mines_Demo/';
        return;
      }
      
      if (game === 'plinko') {
        // Open Plinko in new tab
        window.open('https://plinko-web-game.netlify.app/', '_blank');
        return;
      }
      
      // For other games, show coming soon
      showNotification(`🎮 ${card.querySelector('h4').textContent} coming soon!`, 'info', 3000);
      
      // Update active card (only for games that stay in same app)
      document.querySelectorAll('.game-card').forEach(c => {
        c.classList.remove('active');
        const badge = c.querySelector('.game-badge');
        if (c.dataset.game === 'crash') {
          badge.textContent = 'Available';
          badge.classList.remove('active');
        }
      });
      
      card.classList.add('active');
      const badge = card.querySelector('.game-badge');
      badge.textContent = 'Selected';
      badge.classList.add('active');
    });
  });
  
  // Reset stats from menu
  document.getElementById('reset-stats').addEventListener('click', () => {
    if (confirm("Reset all statistics? This cannot be undone.")) {
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
      updateAdvancedStats();
      updateStatsUI();
      drawStatsChart();
      showNotification('Statistics reset', 'info', 2000);
    }
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!menuPanel.contains(e.target) && !menuBtn.contains(e.target)) {
      menuPanel.classList.add('hidden');
    }
  });
}

// ==================== CRASH GAME LOGIC ====================

function generateCrashPoint() {
  // Generate random crash point using exponential distribution
  // Higher multipliers are less likely
  const r = Math.random();
  const e = 1 - 0.05; // House edge
  const crashPoint = (1 / (1 - (r * e))) * 0.99;
  
  // Cap at maximum multiplier
  return Math.min(crashPoint, CONFIG.maxMultiplier);
}

function startRound() {
  const bet = parseFloat(state.betAmount);
  
  if (isNaN(bet) || bet < CONFIG.minBet) {
    showNotification(`Minimum bet is $${CONFIG.minBet}`, 'warning');
    return;
  }
  
  if (bet > state.balance) {
    showNotification('Insufficient balance', 'error');
    return;
  }
  
  state.inRound = true;
  state.currentMultiplier = 1.00;
  state.currentRoundId = Date.now();
  state.roundStartTime = Date.now();
  state.crashPoint = generateCrashPoint();
  state.chartData = [{x: 0, y: 1}];
  
  // Deduct bet from balance
  state.balance -= bet;
  state.stats.wagered += bet;
  state.stats.totalRounds += 1;
  
  // Update UI
  betBtn.disabled = true;
  cashoutBtn.disabled = false;
  betBtn.textContent = "Waiting...";
  
  updateBalanceUI();
  updateProfitPreview();
  updateAdvancedStats();
  updateStatsUI();
  drawStatsChart();
  
  showNotification(`Round started! Bet: $${formatMoney(bet)}`, 'info');
  
  // Start the multiplier animation
  animateMultiplier();
}

function endRound(cashedOut = false) {
  state.inRound = false;
  betBtn.disabled = false;
  cashoutBtn.disabled = true;
  betBtn.textContent = "Bet";
  
  if (cashedOut) {
    // Player cashed out successfully
    const payout = state.betAmount * state.currentMultiplier;
    const profit = payout - state.betAmount;
    
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
    
    // Record fastest cashout
    const roundTime = Date.now() - state.roundStartTime;
    if (!state.stats.fastestCashout || roundTime < state.stats.fastestCashout.time) {
      state.stats.fastestCashout = {
        time: roundTime,
        multiplier: state.currentMultiplier
      };
    }
    
    showNotification(`💰 Cashed out at ${state.currentMultiplier.toFixed(2)}x! Profit: +$${formatMoney(profit)}`, 'success', 5000);
  } else {
    // Player crashed
    state.stats.losses += 1;
    state.stats.profit -= state.betAmount;
    state.stats.currentStreak = 0;
    
    const lossAmount = state.betAmount;
    if (lossAmount > state.stats.biggestLoss) {
      state.stats.biggestLoss = lossAmount;
    }
    
    showNotification(`💥 Crashed at ${state.crashPoint.toFixed(2)}x! Loss: -$${formatMoney(lossAmount)}`, 'error', 5000);
  }
  
  // Add to recent multipliers
  state.recentMultipliers.unshift(cashedOut ? state.currentMultiplier : state.crashPoint);
  if (state.recentMultipliers.length > 5) {
    state.recentMultipliers.pop();
  }
  
  updateRecentMultipliers();
  updateBalanceUI();
  updateAdvancedStats();
  updateStatsUI();
  drawStatsChart();
  pushProfitHistory();
  
  // Reset multiplier display
  currentMultiplierEl.textContent = "1.00x";
  currentMultiplierEl.style.color = "#00C74D";
  
  if (state.animationId) {
    cancelAnimationFrame(state.animationId);
    state.animationId = null;
  }
}

function animateMultiplier() {
  if (!state.inRound) return;
  
  const currentTime = Date.now() - state.roundStartTime;
  const timeInSeconds = currentTime / 1000;
  
  // Calculate multiplier growth (exponential)
  state.currentMultiplier = 1 + (Math.pow(timeInSeconds, CONFIG.crashSpeed) * 0.5);
  
  // Update display
  currentMultiplierEl.textContent = `${state.currentMultiplier.toFixed(2)}x`;
  
  // Update chart data
  state.chartData.push({
    x: timeInSeconds,
    y: state.currentMultiplier
  });
  
  // Draw crash chart
  drawCrashChart();
  
  // Check for crash
  if (state.currentMultiplier >= state.crashPoint) {
    // Game crashed
    state.currentMultiplier = state.crashPoint;
    currentMultiplierEl.textContent = `${state.crashPoint.toFixed(2)}x`;
    currentMultiplierEl.style.color = "#FF4141";
    currentMultiplierEl.style.animation = "flash 0.5s infinite";
    
    setTimeout(() => {
      endRound(false);
    }, 1000);
    return;
  }
  
  // Check for auto cashout
  if (state.autoCashoutEnabled && state.currentMultiplier >= state.autoCashoutValue) {
    cashout(true);
    return;
  }
  
  // Update profit preview
  updateProfitPreview();
  
  // Continue animation
  state.animationId = requestAnimationFrame(animateMultiplier);
}

function cashout(auto = false) {
  if (!state.inRound || state.currentMultiplier <= 1.00) return;
  
  if (state.animationId) {
    cancelAnimationFrame(state.animationId);
    state.animationId = null;
  }
  
  currentMultiplierEl.style.color = "#00C74D";
  currentMultiplierEl.style.animation = "";
  
  endRound(true);
}

// ==================== UTILITY FUNCTIONS ====================

function formatMoney(v) {
  return v.toFixed(2);
}

function updateBalanceUI() {
  balanceAmountEl.textContent = formatMoney(state.balance);
  balanceAmountEl.style.transform = 'scale(1.1)';
  setTimeout(() => balanceAmountEl.style.transform = 'scale(1)', 200);
}

function updateBetPreview() {
  const bet = state.betAmount;
  betPreview.textContent = "$" + formatMoney(bet);
}

function updateProfitPreview() {
  if (!state.inRound) {
    profitLabel.textContent = "Current Multiplier: 1.00x";
    profitAmount.textContent = "$" + formatMoney(state.betAmount);
    return;
  }
  
  const payout = state.betAmount * state.currentMultiplier;
  const profit = payout - state.betAmount;
  
  profitLabel.textContent = `Current Multiplier: ${state.currentMultiplier.toFixed(2)}x`;
  profitAmount.textContent = "$" + formatMoney(payout);
}

function updateRecentMultipliers() {
  recentMultipliersEl.innerHTML = '';
  state.recentMultipliers.forEach(multiplier => {
    const valueEl = document.createElement("div");
    valueEl.className = "recent-value";
    valueEl.textContent = `${multiplier.toFixed(2)}x`;
    valueEl.style.color = multiplier >= 1.00 ? "#00C74D" : "#FF4141";
    recentMultipliersEl.appendChild(valueEl);
  });
}

// ==================== CHART FUNCTIONS ====================

function drawCrashChart() {
  const ctx = crashChartCtx;
  const w = crashChartCanvas.width;
  const h = crashChartCanvas.height;
  
  // Clear canvas
  ctx.clearRect(0, 0, w, h);
  
  // Set background
  ctx.fillStyle = "#0C1824";
  ctx.fillRect(0, 0, w, h);
  
  if (state.chartData.length < 2) return;
  
  // Calculate chart bounds
  const maxX = Math.max(...state.chartData.map(d => d.x)) || 10;
  const maxY = Math.max(...state.chartData.map(d => d.y), state.crashPoint) || 10;
  
  const pad = 40;
  const usableW = w - pad * 2;
  const usableH = h - pad * 2;
  
  // Draw grid lines
  ctx.strokeStyle = "rgba(167, 179, 195, 0.1)";
  ctx.lineWidth = 1;
  
  // Vertical grid
  for (let i = 1; i <= 5; i++) {
    const x = pad + (i / 5) * usableW;
    ctx.beginPath();
    ctx.moveTo(x, pad);
    ctx.lineTo(x, h - pad);
    ctx.stroke();
  }
  
  // Horizontal grid (multiplier lines)
  for (let i = 1; i <= 5; i++) {
    const y = pad + (1 - i / 5) * usableH;
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(w - pad, y);
    ctx.stroke();
    
    // Draw multiplier labels
    ctx.fillStyle = "#A7B3C3";
    ctx.font = "10px system-ui";
    ctx.textAlign = "right";
    ctx.fillText(`${(i * maxY / 5).toFixed(1)}x`, pad - 5, y + 3);
  }
  
  // Draw crash point line
  const crashY = pad + (1 - (state.crashPoint / maxY)) * usableH;
  ctx.strokeStyle = "rgba(255, 65, 65, 0.5)";
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(pad, crashY);
  ctx.lineTo(w - pad, crashY);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Draw crash point label
  ctx.fillStyle = "#FF4141";
  ctx.font = "11px system-ui";
  ctx.textAlign = "right";
  ctx.fillText(`Crash: ${state.crashPoint.toFixed(2)}x`, w - pad, crashY - 5);
  
  // Draw multiplier line
  ctx.beginPath();
  state.chartData.forEach((point, i) => {
    const x = pad + (point.x / maxX) * usableW;
    const y = pad + (1 - (point.y / maxY)) * usableH;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  
  ctx.strokeStyle = "#00C74D";
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // Draw current point
  if (state.chartData.length > 0) {
    const lastPoint = state.chartData[state.chartData.length - 1];
    const x = pad + (lastPoint.x / maxX) * usableW;
    const y = pad + (1 - (lastPoint.y / maxY)) * usableH;
    
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#00C74D";
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  // Draw axis labels
  ctx.fillStyle = "#A7B3C3";
  ctx.font = "11px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("Time (seconds)", w / 2, h - 10);
  
  ctx.save();
  ctx.translate(10, h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillText("Multiplier", 0, 0);
  ctx.restore();
}

function drawStatsChart() {
  const ctx = statsChartCtx;
  const w = statsChartCanvas.width;
  const h = statsChartCanvas.height;
  
  ctx.clearRect(0, 0, w, h);
  
  ctx.fillStyle = "#0F212E";
  ctx.fillRect(0, 0, w, h);
  
  const values = state.stats.history;
  if (!values.length) {
    ctx.fillStyle = "#A7B3C3";
    ctx.font = "11px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("No rounds yet", w / 2, h / 2);
    return;
  }
  
  const minVal = Math.min(0, ...values);
  const maxVal = Math.max(0, ...values);
  const range = maxVal - minVal || 1;
  const pad = 10;
  const usableW = w - pad * 2;
  const usableH = h - pad * 2;
  
  const zeroY = pad + (1 - (0 - minVal) / range) * usableH;
  ctx.beginPath();
  ctx.moveTo(pad, zeroY);
  ctx.lineTo(pad + usableW, zeroY);
  ctx.strokeStyle = "rgba(167, 179, 195, 0.4)";
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
  
  ctx.beginPath();
  values.forEach((v, i) => {
    const x = pad + (i / Math.max(values.length - 1, 1)) * usableW;
    const y = pad + (1 - (v - minVal) / range) * usableH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.lineTo(pad + usableW, h - pad);
  ctx.lineTo(pad, h - pad);
  ctx.closePath();
  
  const grad = ctx.createLinearGradient(0, pad, 0, h);
  if (up) {
    grad.addColorStop(0, "rgba(0, 199, 77, 0.45)");
    grad.addColorStop(1, "rgba(15, 33, 46, 0)");
  } else {
    grad.addColorStop(0, "rgba(255, 65, 65, 0.45)");
    grad.addColorStop(1, "rgba(15, 33, 46, 0)");
  }
  ctx.fillStyle = grad;
  ctx.fill();
  
  if (values.length > 0) {
    ctx.fillStyle = up ? "#00C74D" : "#FF4141";
    ctx.font = "bold 10px system-ui";
    ctx.textAlign = "right";
    ctx.fillText(`$${formatMoney(lastVal)}`, w - pad, Math.max(20, zeroY - 5));
  }
}

// ==================== ENHANCED STATISTICS ====================

function updateAdvancedStats() {
  const totalGames = state.stats.wins + state.stats.losses;
  const winRate = totalGames > 0 ? (state.stats.wins / totalGames * 100).toFixed(1) : '0.0';
  
  const sessionTime = Date.now() - state.stats.sessionStartTime;
  const hours = Math.floor(sessionTime / (1000 * 60 * 60));
  const minutes = Math.floor((sessionTime % (1000 * 60 * 60)) / (1000 * 60));
  
  const avgBet = totalGames > 0 ? state.stats.wagered / totalGames : 0;
  
  const fastestCashoutText = state.stats.fastestCashout ? 
    `${(state.stats.fastestCashout.time / 1000).toFixed(2)}s` : 'N/A';
  
  statsAdvancedContainer.innerHTML = `
    <div class="stats-advanced-grid">
      <div class="stats-advanced-card">
        <div class="stats-advanced-label">Win Rate</div>
        <div class="stats-advanced-value">${winRate}%</div>
        <div class="stats-advanced-sub">${state.stats.wins}W : ${state.stats.losses}L</div>
      </div>
      <div class="stats-advanced-card">
        <div class="stats-advanced-label">Highest Multiplier</div>
        <div class="stats-advanced-value">${state.stats.highestMultiplier.toFixed(2)}x</div>
        <div class="stats-advanced-sub">Best Streak: ${state.stats.bestProfitStreak}</div>
      </div>
      <div class="stats-advanced-card">
        <div class="stats-advanced-label">Biggest Win</div>
        <div class="stats-advanced-value positive">+$${formatMoney(state.stats.biggestWin)}</div>
        <div class="stats-advanced-sub">Biggest Loss: -$${formatMoney(state.stats.biggestLoss)}</div>
      </div>
      <div class="stats-advanced-card">
        <div class="stats-advanced-label">Avg Bet</div>
        <div class="stats-advanced-value">$${formatMoney(avgBet)}</div>
        <div class="stats-advanced-sub">Fastest: ${fastestCashoutText}</div>
      </div>
      <div class="stats-advanced-card">
        <div class="stats-advanced-label">Current Streak</div>
        <div class="stats-advanced-value ${state.stats.currentStreak > 0 ? 'positive' : 'negative'}">${state.stats.currentStreak}</div>
        <div class="stats-advanced-sub">Total Rounds: ${state.stats.totalRounds}</div>
      </div>
      <div class="stats-advanced-card">
        <div class="stats-advanced-label">Session Time</div>
        <div class="stats-advanced-value">${hours}h ${minutes}m</div>
        <div class="stats-advanced-sub">Wagered: $${formatMoney(state.stats.wagered)}</div>
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

// ==================== EVENT HANDLERS ====================

function onBetInputChange() {
  if (state.inRound) {
    betInput.value = formatMoney(state.betAmount);
    showNotification('Cannot change bet during a round', 'warning');
    return;
  }
  
  const v = parseFloat(betInput.value);
  if (isNaN(v) || v < CONFIG.minBet) {
    state.betAmount = CONFIG.minBet;
    betInput.value = CONFIG.minBet.toFixed(2);
  } else if (v > state.balance) {
    state.betAmount = Math.min(state.balance, CONFIG.maxBet);
    betInput.value = formatMoney(state.betAmount);
    showNotification(`Bet cannot exceed balance of $${formatMoney(state.balance)}`, 'warning');
  } else {
    state.betAmount = v;
  }
  updateBetPreview();
  updateProfitPreview();
}

function onAutoCashoutChange() {
  const v = parseFloat(autoCashoutInput.value);
  if (isNaN(v) || v < 1.10) {
    state.autoCashoutValue = 1.10;
    autoCashoutInput.value = "1.10";
  } else {
    state.autoCashoutValue = v;
  }
}

function toggleAutoCashout() {
  state.autoCashoutEnabled = !state.autoCashoutEnabled;
  toggleAutoCashoutBtn.textContent = state.autoCashoutEnabled ? 'ON' : 'OFF';
  toggleAutoCashoutBtn.style.background = state.autoCashoutEnabled ? '#00C74D' : '#1A2C3D';
  toggleAutoCashoutBtn.style.color = state.autoCashoutEnabled ? '#000' : '#A7B3C3';
  
  showNotification(
    state.autoCashoutEnabled ? 
    `Auto cashout enabled at ${state.autoCashoutValue.toFixed(2)}x` : 
    'Auto cashout disabled',
    'info'
  );
}

function attachEvents() {
  betInput.addEventListener("input", onBetInputChange);
  autoCashoutInput.addEventListener("input", onAutoCashoutChange);
  toggleAutoCashoutBtn.addEventListener("click", toggleAutoCashout);
  
  betBtn.addEventListener("click", () => {
    if (!state.inRound) {
      startRound();
    }
  });
  
  cashoutBtn.addEventListener("click", () => {
    cashout(false);
  });
  
  betActionButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      if (state.inRound) {
        showNotification('Cannot change bet during a round', 'warning');
        return;
      }
      
      let bet = state.betAmount;
      
      if (btn.dataset.betAction === "half") bet /= 2;
      if (btn.dataset.betAction === "double") bet *= 2;
      
      bet = Math.max(CONFIG.minBet, parseFloat(bet.toFixed(2)));
      
      if (bet > state.balance) {
        bet = Math.min(state.balance, CONFIG.maxBet);
        showNotification(`Bet cannot exceed balance of $${formatMoney(state.balance)}`, 'warning');
      }
      
      state.betAmount = bet;
      betInput.value = bet.toFixed(2);
      updateBetPreview();
      updateProfitPreview();
      
      showNotification(`Bet set to $${formatMoney(bet)}`, 'info', 1500);
    });
  });
  
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("active")) return;
      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      autoInfo.classList.toggle("hidden", btn.dataset.tab !== "auto");
      
      if (btn.dataset.tab === "auto") {
        showNotification("Auto mode is visual only in this demo", 'info', 3000);
      }
    });
  });
  
  addBtn.addEventListener("click", e => {
    e.stopPropagation();
    addPopup.classList.toggle("hidden");
  });
  
  addQuickButtons.forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const amt = parseFloat(btn.dataset.add);
      if (!isNaN(amt) && amt > 0) {
        state.balance += amt;
        updateBalanceUI();
        addPopup.classList.add("hidden");
        showNotification(`Added $${formatMoney(amt)} to balance`, 'success', 2000);
      }
    });
  });
  
  addCustomBtn.addEventListener("click", e => {
    e.stopPropagation();
    const v = parseFloat(addCustomInput.value);
    if (!isNaN(v) && v > 0) {
      state.balance += v;
      updateBalanceUI();
      addCustomInput.value = "";
      addPopup.classList.add("hidden");
      showNotification(`Added $${formatMoney(v)} to balance`, 'success', 2000);
    } else {
      showNotification('Please enter a valid amount', 'error', 2000);
    }
  });
  
  document.addEventListener("click", () => {
    addPopup.classList.add("hidden");
  });
  
  addPopup.addEventListener("click", e => {
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
      updateAdvancedStats();
      updateStatsUI();
      drawStatsChart();
      showNotification('Statistics reset', 'info', 2000);
    }
  });
}

// ==================== INITIALIZATION ====================

function init() {
  state.balance = CONFIG.startingBalance;
  state.betAmount = CONFIG.defaultBet;
  state.autoCashoutValue = CONFIG.autoCashoutDefault;
  
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
  
  // Add CSS for notifications, animations, and menu
  const enhancedCSS = `
  .notification-container {
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 350px;
  }

  .notification {
    background: #132439;
    border: 1px solid #1A2C3D;
    border-radius: 6px;
    padding: 12px 15px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    transform: translateX(120%);
    transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    overflow: hidden;
  }

  .notification.show {
    transform: translateX(0);
  }

  .notification-icon {
    font-size: 18px;
    font-weight: bold;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .notification-success .notification-icon {
    background: rgba(0, 199, 77, 0.15);
    color: #00C74D;
  }

  .notification-warning .notification-icon {
    background: rgba(245, 166, 35, 0.15);
    color: #F5A623;
  }

  .notification-error .notification-icon {
    background: rgba(255, 65, 65, 0.15);
    color: #FF4141;
  }

  .notification-info .notification-icon {
    background: rgba(167, 179, 195, 0.15);
    color: #A7B3C3;
  }

  .notification-content {
    flex: 1;
    font-size: 13px;
    line-height: 1.4;
    color: #FFFFFF;
  }

  .notification-close {
    background: transparent;
    border: none;
    color: #A7B3C3;
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .notification-close:hover {
    color: #FFFFFF;
  }

  @keyframes flash {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .stats-advanced {
    margin-top: 15px;
  }

  .stats-advanced-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .stats-advanced-card {
    background: #0C1824;
    border: 1px solid #1A2C3D;
    border-radius: 6px;
    padding: 8px;
  }

  .stats-advanced-label {
    font-size: 10px;
    color: #A7B3C3;
    margin-bottom: 2px;
  }

  .stats-advanced-value {
    font-size: 12px;
    font-weight: 600;
    color: #FFFFFF;
  }

  .stats-advanced-value.positive {
    color: #00C74D;
  }

  .stats-advanced-value.negative {
    color: #FF4141;
  }

  .stats-advanced-sub {
    font-size: 9px;
    color: #A7B3C3;
    margin-top: 2px;
  }

  /* Menu Styles */
  .menu-btn {
    background: transparent;
    border: 1px solid #1A2C3D;
    color: #A7B3C3;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;
  }
  
  .menu-btn:hover {
    background: #1A2C3D;
    color: #FFFFFF;
  }
  
  .menu-panel {
    position: fixed;
    top: 0;
    left: 0;
    width: 300px;
    height: 100vh;
    background: #132439;
    border-right: 1px solid #1A2C3D;
    z-index: 1001;
    overflow-y: auto;
    box-shadow: 5px 0 25px rgba(0, 0, 0, 0.5);
  }
  
  .menu-header {
    padding: 20px;
    border-bottom: 1px solid #1A2C3D;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .menu-header h3 {
    margin: 0;
    color: #FFFFFF;
    font-size: 16px;
  }
  
  .menu-close {
    background: transparent;
    border: none;
    color: #A7B3C3;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .menu-close:hover {
    color: #FFFFFF;
  }
  
  .menu-games {
    padding: 15px;
  }
  
  .game-card {
    background: #0C1824;
    border: 1px solid #1A2C3D;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .game-card:hover {
    background: #1A2C3D;
    transform: translateY(-2px);
  }
  
  .game-card.active {
    border-color: #00C74D;
    background: rgba(0, 199, 77, 0.1);
  }
  
  .game-icon {
    font-size: 24px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1A2C3D;
    border-radius: 8px;
  }
  
  .game-info {
    flex: 1;
  }
  
  .game-info h4 {
    margin: 0 0 4px 0;
    color: #FFFFFF;
    font-size: 14px;
  }
  
  .game-info p {
    margin: 0;
    color: #A7B3C3;
    font-size: 11px;
  }
  
  .game-badge {
    font-size: 10px;
    padding: 2px 6px;
    background: #1A2C3D;
    color: #A7B3C3;
    border-radius: 999px;
  }
  
  .game-badge.active {
    background: #00C74D;
    color: #000;
  }
  
  .menu-footer {
    padding: 15px;
    border-top: 1px solid #1A2C3D;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .btn.small {
    padding: 6px 12px;
    font-size: 12px;
  }
  `;
  
  const styleSheet = document.createElement("style");
  styleSheet.textContent = enhancedCSS;
  document.head.appendChild(styleSheet);
}

document.addEventListener("DOMContentLoaded", init);