const BUILDER_CODE = "bc_z2bsqs1j";

const COLLECTIBLES = [
  {
    id: "robot",
    name: "Base Bot",
    emoji: "🤖",
    rarity: "COMMON"
  },
  {
    id: "alien",
    name: "Moon Alien",
    emoji: "👽",
    rarity: "COMMON"
  },
  {
    id: "wizard",
    name: "Crypto Wizard",
    emoji: "🧙",
    rarity: "RARE"
  },
  {
    id: "ninja",
    name: "Base Ninja",
    emoji: "🥷",
    rarity: "RARE"
  },
  {
    id: "king",
    name: "Chain King",
    emoji: "👑",
    rarity: "EPIC"
  },
  {
    id: "unicorn",
    name: "Legendary Unicorn",
    emoji: "🦄",
    rarity: "LEGENDARY"
  }
];

const state = {
  xp: 0,
  level: 1,
  coins: 0,
  streak: 0,
  lastDailyClaim: null,
  collection: [],
  highScore: 0
};

let gameActive = false;
let score = 0;
let timeLeft = 30;
let timerInterval = null;

const elements = {
  level: document.getElementById("level"),
  xpText: document.getElementById("xpText"),
  xpBar: document.getElementById("xpBar"),
  coins: document.getElementById("coins"),
  streak: document.getElementById("streak"),

  score: document.getElementById("score"),
  timer: document.getElementById("timer"),

  startGameBtn: document.getElementById("startGameBtn"),
  funkoTarget: document.getElementById("funkoTarget"),
  gameArea: document.getElementById("gameArea"),
  gameMessage: document.getElementById("gameMessage"),

  dailyRewardBtn: document.getElementById("dailyRewardBtn"),
  openBoxBtn: document.getElementById("openBoxBtn"),
  connectWalletBtn: document.getElementById("connectWalletBtn"),
  resetBtn: document.getElementById("resetBtn"),

  collectionGrid: document.getElementById("collectionGrid"),
  collectionCount: document.getElementById("collectionCount"),

  modal: document.getElementById("modal"),
  modalEmoji: document.getElementById("modalEmoji"),
  modalTitle: document.getElementById("modalTitle"),
  modalText: document.getElementById("modalText"),
  modalActionBtn: document.getElementById("modalActionBtn"),
  closeModalBtn: document.getElementById("closeModalBtn")
};

function loadGame() {
  const saved = localStorage.getItem("funkoQuestSave");

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      Object.assign(state, parsed);
    } catch (error) {
      console.error("Could not load save data", error);
    }
  }

  render();
}

function saveGame() {
  localStorage.setItem(
    "funkoQuestSave",
    JSON.stringify(state)
  );
}

function getXpNeeded() {
  return state.level * 100;
}

function render() {
  const xpNeeded = getXpNeeded();
  const progress = Math.min(
    100,
    (state.xp / xpNeeded) * 100
  );

  elements.level.textContent = state.level;
  elements.xpText.textContent =
    `${state.xp} / ${xpNeeded}`;

  elements.xpBar.style.width = `${progress}%`;

  elements.coins.textContent = state.coins;
  elements.streak.textContent = state.streak;

  renderCollection();
  updateDailyButton();
}

function addXp(amount) {
  state.xp += amount;

  while (state.xp >= getXpNeeded()) {
    state.xp -= getXpNeeded();
    state.level += 1;

    showModal(
      "⬆️",
      "Level Up!",
      `You reached Level ${state.level}!`
    );
  }

  saveGame();
  render();
}

function addCoins(amount) {
  state.coins += amount;
  saveGame();
  render();
}

function renderCollection() {
  elements.collectionGrid.innerHTML = "";

  COLLECTIBLES.forEach((item) => {
    const owned = state.collection.includes(item.id);

    const card = document.createElement("div");

    card.className =
      `collectible-card ${owned ? "" : "locked"}`;

    card.innerHTML = owned
      ? `
        <div class="collectible-emoji">${item.emoji}</div>
        <div>
          <div class="collectible-name">${item.name}</div>
          <div class="rarity">${item.rarity}</div>
        </div>
      `
      : `
        <div class="collectible-emoji">🔒</div>
        <div>
          <div class="collectible-name">Unknown</div>
          <div class="rarity">LOCKED</div>
        </div>
      `;

    elements.collectionGrid.appendChild(card);
  });

  elements.collectionCount.textContent =
    `${state.collection.length} / ${COLLECTIBLES.length} collected`;
}

function startGame() {
  if (gameActive) return;

  gameActive = true;
  score = 0;
  timeLeft = 30;

  elements.score.textContent = score;
  elements.timer.textContent = timeLeft;

  elements.startGameBtn.disabled = true;
  elements.startGameBtn.textContent = "Game Running...";

  elements.gameMessage.textContent = "";
  elements.funkoTarget.disabled = false;

  moveTarget();

  timerInterval = setInterval(() => {
    timeLeft -= 1;

    elements.timer.textContent = timeLeft;

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function moveTarget() {
  if (!gameActive) return;

  const areaRect =
    elements.gameArea.getBoundingClientRect();

  const targetSize = 78;

  const maxX =
    Math.max(0, areaRect.width - targetSize);

  const maxY =
    Math.max(0, areaRect.height - targetSize);

  const x = Math.random() * maxX;
  const y = Math.random() * maxY;

  elements.funkoTarget.style.left = `${x}px`;
  elements.funkoTarget.style.top = `${y}px`;
}

function hitTarget() {
  if (!gameActive) return;

  score += 1;

  elements.score.textContent = score;

  const bonus = Math.random() > 0.8;

  if (bonus) {
    score += 2;
    elements.score.textContent = score;
    addCoins(1);
  }

  moveTarget();
}

function endGame() {
  if (!gameActive) return;

  gameActive = false;

  clearInterval(timerInterval);

  elements.funkoTarget.disabled = true;

  elements.startGameBtn.disabled = false;
  elements.startGameBtn.textContent = "▶ Play Again";

  elements.gameMessage.textContent =
    `Game Over! Final score: ${score}`;

  const xpEarned = score * 5;
  const coinsEarned = Math.floor(score / 3);

  addXp(xpEarned);
  addCoins(coinsEarned);

  if (score > state.highScore) {
    state.highScore = score;
    saveGame();

    setTimeout(() => {
      showModal(
        "🏆",
        "New High Score!",
        `You scored ${score} and earned ${xpEarned} XP + ${coinsEarned} coins!`
      );
    }, 400);
  } else {
    setTimeout(() => {
      showModal(
        "🎮",
        "Quest Complete!",
        `You scored ${score} and earned ${xpEarned} XP + ${coinsEarned} coins!`
      );
    }, 400);
  }
}

function todayString() {
  return new Date().toISOString().split("T")[0];
}

function yesterdayString() {
  const yesterday = new Date();

  yesterday.setDate(
    yesterday.getDate() - 1
  );

  return yesterday
    .toISOString()
    .split("T")[0];
}

function updateDailyButton() {
  const today = todayString();

  if (state.lastDailyClaim === today) {
    elements.dailyRewardBtn.textContent =
      "Claimed ✓";

    elements.dailyRewardBtn.disabled = true;
  } else {
    elements.dailyRewardBtn.textContent =
      "Claim Daily";

    elements.dailyRewardBtn.disabled = false;
  }
}

function claimDailyReward() {
  const today = todayString();

  if (state.lastDailyClaim === today) {
    return;
  }

  if (
    state.lastDailyClaim === yesterdayString()
  ) {
    state.streak += 1;
  } else {
    state.streak = 1;
  }

  const rewardCoins =
    10 + state.streak * 5;

  const rewardXp =
    20 + state.streak * 5;

  state.lastDailyClaim = today;

  addCoins(rewardCoins);
  addXp(rewardXp);

  saveGame();
  render();

  showModal(
    "🔥",
    "Daily Reward!",
    `Streak: ${state.streak} days! You earned ${rewardCoins} coins and ${rewardXp} XP.`
  );
}

function getRandomCollectible() {
  const roll = Math.random();

  if (roll < 0.45) {
    return COLLECTIBLES[
      Math.floor(Math.random() * 2)
    ];
  }

  if (roll < 0.75) {
    return COLLECTIBLES[
      2 + Math.floor(Math.random() * 2)
    ];
  }

  if (roll < 0.95) {
    return COLLECTIBLES[4];
  }

  return COLLECTIBLES[5];
}

function openMysteryBox() {
  const cost = 25;

  if (state.coins < cost) {
    showModal(
      "🪙",
      "Not Enough Coins",
      `You need ${cost} coins to open a Mystery Box. Play Funko Tap to earn more!`
    );

    return;
  }

  state.coins -= cost;

  const reward = getRandomCollectible();

  const alreadyOwned =
    state.collection.includes(reward.id);

  if (!alreadyOwned) {
    state.collection.push(reward.id);

    addXp(50);

    showModal(
      reward.emoji,
      "New Collectible!",
      `You unlocked ${reward.name} — ${reward.rarity}!`
    );
  } else {
    const duplicateReward = 15;

    state.coins += duplicateReward;

    showModal(
      reward.emoji,
      "Duplicate!",
      `You already own ${reward.name}. You received ${duplicateReward} coins instead!`
    );
  }

  saveGame();
  render();
}

async function connectWallet() {
  /*
    Wallet + Base transaction integration will go here.

    Builder Code:
    bc_z2bsqs1j

    Once a wallet library such as viem/wagmi or a Base SDK
    is added, transaction attribution should be configured
    using the Builder Code according to the transaction stack.
  */

  showModal(
    "🔵",
    "Base Integration",
    `The game is ready for the next step: connecting a Base wallet and adding onchain collectible claims using Builder Code ${BUILDER_CODE}.`
  );
}

function showModal(emoji, title, text) {
  elements.modalEmoji.textContent = emoji;
  elements.modalTitle.textContent = title;
  elements.modalText.textContent = text;

  elements.modal.classList.remove("hidden");
}

function closeModal() {
  elements.modal.classList.add("hidden");
}

function resetGame() {
  const confirmed = confirm(
    "Reset all Funko Quest progress?"
  );

  if (!confirmed) return;

  localStorage.removeItem("funkoQuestSave");

  location.reload();
}

/* EVENTS */

elements.startGameBtn.addEventListener(
  "click",
  startGame
);

elements.funkoTarget.addEventListener(
  "click",
  hitTarget
);

elements.dailyRewardBtn.addEventListener(
  "click",
  claimDailyReward
);

elements.openBoxBtn.addEventListener(
  "click",
  openMysteryBox
);

elements.connectWalletBtn.addEventListener(
  "click",
  connectWallet
);

elements.closeModalBtn.addEventListener(
  "click",
  closeModal
);

elements.modalActionBtn.addEventListener(
  "click",
  closeModal
);

elements.resetBtn.addEventListener(
  "click",
  resetGame
);

elements.modal.addEventListener(
  "click",
  (event) => {
    if (event.target === elements.modal) {
      closeModal();
    }
  }
);

/* START */

loadGame();

console.log(
  "Funko Quest loaded on Base.",
  "Builder Code:",
  BUILDER_CODE
);
