const BUILDER_CODE = "bc_z2bsqs1j";

const BASE_CHAIN_ID = "0x2105";
const BASE_CHAIN_DECIMAL = 8453;

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
  highScore: 0,
  walletAddress: null
};

let gameActive = false;
let score = 0;
let timeLeft = 30;
let timerInterval = null;

let baseProvider = null;

const elements = {
  level: document.getElementById("level"),
  xpText: document.getElementById("xpText"),
  xpBar: document.getElementById("xpBar"),
  coins: document.getElementById("coins"),
  streak: document.getElementById("streak"),

  score: document.getElementById("score"),
  timer: document.getElementById("timer"),

  startGameBtn:
    document.getElementById("startGameBtn"),

  funkoTarget:
    document.getElementById("funkoTarget"),

  gameArea:
    document.getElementById("gameArea"),

  gameMessage:
    document.getElementById("gameMessage"),

  dailyRewardBtn:
    document.getElementById("dailyRewardBtn"),

  openBoxBtn:
    document.getElementById("openBoxBtn"),

  connectWalletBtn:
    document.getElementById("connectWalletBtn"),

  walletStatus:
    document.getElementById("walletStatus"),

  walletAddress:
    document.getElementById("walletAddress"),

  onchainRewardCard:
    document.getElementById("onchainRewardCard"),

  claimFunkoBtn:
    document.getElementById("claimFunkoBtn"),

  resetBtn:
    document.getElementById("resetBtn"),

  collectionGrid:
    document.getElementById("collectionGrid"),

  collectionCount:
    document.getElementById("collectionCount"),

  modal:
    document.getElementById("modal"),

  modalEmoji:
    document.getElementById("modalEmoji"),

  modalTitle:
    document.getElementById("modalTitle"),

  modalText:
    document.getElementById("modalText"),

  modalActionBtn:
    document.getElementById("modalActionBtn"),

  closeModalBtn:
    document.getElementById("closeModalBtn")
};


/* =========================
   SAVE / LOAD
========================= */

function loadGame() {
  const saved =
    localStorage.getItem("funkoQuestSave");

  if (saved) {
    try {
      Object.assign(
        state,
        JSON.parse(saved)
      );
    } catch (error) {
      console.error(
        "Save data error:",
        error
      );
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


/* =========================
   XP
========================= */

function getXpNeeded() {
  return state.level * 100;
}


function addXp(amount) {

  state.xp += amount;

  while (
    state.xp >= getXpNeeded()
  ) {

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


/* =========================
   RENDER
========================= */

function render() {

  const needed =
    getXpNeeded();

  const progress =
    Math.min(
      100,
      (state.xp / needed) * 100
    );

  elements.level.textContent =
    state.level;

  elements.xpText.textContent =
    `${state.xp} / ${needed}`;

  elements.xpBar.style.width =
    `${progress}%`;

  elements.coins.textContent =
    state.coins;

  elements.streak.textContent =
    state.streak;

  renderCollection();

  updateDailyButton();

  renderWallet();
}


function renderCollection() {

  elements.collectionGrid.innerHTML =
    "";

  COLLECTIBLES.forEach(
    item => {

      const owned =
        state.collection.includes(
          item.id
        );

      const card =
        document.createElement("div");

      card.className =
        `collectible-card ${
          owned ? "" : "locked"
        }`;

      if (owned) {

        card.innerHTML = `
          <div class="collectible-emoji">
            ${item.emoji}
          </div>

          <div>
            <div class="collectible-name">
              ${item.name}
            </div>

            <div class="rarity">
              ${item.rarity}
            </div>
          </div>
        `;

      } else {

        card.innerHTML = `
          <div class="collectible-emoji">
            🔒
          </div>

          <div>
            <div class="collectible-name">
              Unknown
            </div>

            <div class="rarity">
              LOCKED
            </div>
          </div>
        `;
      }

      elements.collectionGrid
        .appendChild(card);
    }
  );

  elements.collectionCount.textContent =
    `${state.collection.length} / ${COLLECTIBLES.length} collected`;
}


/* =========================
   GAME
========================= */

function startGame() {

  if (gameActive) return;

  gameActive = true;

  score = 0;

  timeLeft = 30;

  elements.score.textContent =
    score;

  elements.timer.textContent =
    timeLeft;

  elements.startGameBtn.disabled =
    true;

  elements.startGameBtn.textContent =
    "Game Running...";

  elements.gameMessage.textContent =
    "";

  elements.funkoTarget.disabled =
    false;

  moveTarget();

  timerInterval =
    setInterval(() => {

      timeLeft -= 1;

      elements.timer.textContent =
        timeLeft;

      if (timeLeft <= 0) {
        endGame();
      }

    }, 1000);
}


function moveTarget() {

  if (!gameActive) return;

  const rect =
    elements.gameArea
      .getBoundingClientRect();

  const size = 78;

  const maxX =
    Math.max(
      0,
      rect.width - size
    );

  const maxY =
    Math.max(
      0,
      rect.height - size
    );

  const x =
    Math.random() * maxX;

  const y =
    Math.random() * maxY;

  elements.funkoTarget.style.left =
    `${x}px`;

  elements.funkoTarget.style.top =
    `${y}px`;
}


function hitTarget() {

  if (!gameActive) return;

  score += 1;

  elements.score.textContent =
    score;

  if (Math.random() > 0.8) {

    score += 2;

    elements.score.textContent =
      score;

    addCoins(1);
  }

  moveTarget();
}


function endGame() {

  if (!gameActive) return;

  gameActive = false;

  clearInterval(timerInterval);

  elements.funkoTarget.disabled =
    true;

  elements.startGameBtn.disabled =
    false;

  elements.startGameBtn.textContent =
    "▶ Play Again";

  elements.gameMessage.textContent =
    `Game Over! Final score: ${score}`;

  const xpEarned =
    score * 5;

  const coinsEarned =
    Math.floor(score / 3);

  addXp(xpEarned);

  addCoins(coinsEarned);

  if (
    score > state.highScore
  ) {

    state.highScore =
      score;

    saveGame();

    showModal(
      "🏆",
      "New High Score!",
      `Score ${score}! You earned ${xpEarned} XP and ${coinsEarned} coins.`
    );

  } else {

    showModal(
      "🎮",
      "Quest Complete!",
      `Score ${score}! You earned ${xpEarned} XP and ${coinsEarned} coins.`
    );
  }
}


/* =========================
   DAILY
========================= */

function todayString() {

  return new Date()
    .toISOString()
    .split("T")[0];
}


function yesterdayString() {

  const date =
    new Date();

  date.setDate(
    date.getDate() - 1
  );

  return date
    .toISOString()
    .split("T")[0];
}


function updateDailyButton() {

  if (
    state.lastDailyClaim ===
    todayString()
  ) {

    elements.dailyRewardBtn.textContent =
      "Claimed ✓";

    elements.dailyRewardBtn.disabled =
      true;

  } else {

    elements.dailyRewardBtn.textContent =
      "Claim Daily";

    elements.dailyRewardBtn.disabled =
      false;
  }
}


function claimDailyReward() {

  const today =
    todayString();

  if (
    state.lastDailyClaim === today
  ) return;

  if (
    state.lastDailyClaim ===
    yesterdayString()
  ) {

    state.streak += 1;

  } else {

    state.streak = 1;
  }

  const coins =
    10 + state.streak * 5;

  const xp =
    20 + state.streak * 5;

  state.lastDailyClaim =
    today;

  addCoins(coins);

  addXp(xp);

  saveGame();

  render();

  showModal(
    "🔥",
    "Daily Reward!",
    `Streak ${state.streak} days! +${coins} coins and +${xp} XP.`
  );
}


/* =========================
   MYSTERY BOX
========================= */

function getRandomCollectible() {

  const roll =
    Math.random();

  if (roll < 0.45) {

    return COLLECTIBLES[
      Math.floor(
        Math.random() * 2
      )
    ];
  }

  if (roll < 0.75) {

    return COLLECTIBLES[
      2 +
      Math.floor(
        Math.random() * 2
      )
    ];
  }

  if (roll < 0.95) {

    return COLLECTIBLES[4];
  }

  return COLLECTIBLES[5];
}


function openMysteryBox() {

  const cost = 25;

  if (
    state.coins < cost
  ) {

    showModal(
      "🪙",
      "Not Enough Coins",
      `You need ${cost} coins. Play Funko Tap to earn more!`
    );

    return;
  }

  state.coins -= cost;

  const reward =
    getRandomCollectible();

  const alreadyOwned =
    state.collection.includes(
      reward.id
    );

  if (!alreadyOwned) {

    state.collection.push(
      reward.id
    );

    addXp(50);

    showModal(
      reward.emoji,
      "New Collectible!",
      `You unlocked ${reward.name} — ${reward.rarity}!`
    );

  } else {

    const duplicateReward =
      15;

    state.coins +=
      duplicateReward;

    showModal(
      reward.emoji,
      "Duplicate!",
      `You already own ${reward.name}. +${duplicateReward} coins.`
    );
  }

  saveGame();

  render();
}


/* =========================
   BASE MAINNET
========================= */

function shortAddress(address) {

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}


function getInjectedProvider() {

  if (
    window.ethereum
  ) {

    return window.ethereum;
  }

  return null;
}


async function connectBaseAccount() {

  try {

    /*
      Base Account SDK
      Base Mainnet = 8453
      Hex chain ID = 0x2105
    */

    if (
      window.createBaseAccountSDK
    ) {

      const sdk =
        window.createBaseAccountSDK({
          appName:
            "Funko Quest",

          appLogoUrl:
            window.location.origin +
            "/favicon.ico",

          appChainIds: [
            BASE_CHAIN_DECIMAL
          ]
        });

      baseProvider =
        sdk.getProvider();

      const result =
        await baseProvider.request({
          method:
            "wallet_connect",

          params: [
            {
              version: "1"
            }
          ]
        });

      if (
        result &&
        result.accounts &&
        result.accounts.length
      ) {

        const address =
          result.accounts[0].address;

        state.walletAddress =
          address;

        saveGame();

        renderWallet();

        showModal(
          "🔵",
          "Base Connected!",
          `Wallet ${shortAddress(address)} is connected to Funko Quest.`
        );

        return;
      }
    }

    /*
      Fallback for browser wallets
      such as Coinbase Wallet / MetaMask.
    */

    const provider =
      getInjectedProvider();

    if (!provider) {

      showModal(
        "🔵",
        "Wallet Not Found",
        "Open Funko Quest in a wallet-enabled browser or Base App to connect your wallet."
      );

      return;
    }

    const accounts =
      await provider.request({
        method:
          "eth_requestAccounts"
      });

    if (
      !accounts ||
      !accounts.length
    ) return;

    const address =
      accounts[0];

    const chainId =
      await provider.request({
        method:
          "eth_chainId"
      });

    if (
      chainId.toLowerCase() !==
      BASE_CHAIN_ID
    ) {

      try {

        await provider.request({
          method:
            "wallet_switchEthereumChain",

          params: [
            {
              chainId:
                BASE_CHAIN_ID
            }
          ]
        });

      } catch (switchError) {

        showModal(
          "🔵",
          "Switch to Base",
          "Please switch your wallet to Base Mainnet and try again."
        );

        return;
      }
    }

    state.walletAddress =
      address;

    saveGame();

    renderWallet();

    showModal(
      "🔵",
      "Base Connected!",
      `Wallet ${shortAddress(address)} is connected on Base Mainnet.`
    );

  } catch (error) {

    console.error(
      "Wallet connection error:",
      error
    );

    showModal(
      "⚠️",
      "Connection Failed",
      error.message ||
      "The wallet connection was cancelled or failed."
    );
  }
}


function renderWallet() {

  if (
    state.walletAddress
  ) {

    elements.walletStatus.textContent =
      "Connected to Base Mainnet.";

    elements.walletAddress.textContent =
      state.walletAddress;

    elements.connectWalletBtn.textContent =
      shortAddress(
        state.walletAddress
      );

    elements.onchainRewardCard.style.display =
      "flex";

  } else {

    elements.walletStatus.textContent =
      "Connect your wallet to unlock onchain Funko rewards.";

    elements.walletAddress.textContent =
      "";

    elements.connectWalletBtn.textContent =
      "Connect Wallet";

    elements.onchainRewardCard.style.display =
      "none";
  }
}


/* =========================
   ONCHAIN CLAIM
========================= */

async function claimFunko() {

  if (
    !state.walletAddress
  ) {

    await connectBaseAccount();

    return;
  }

  /*
    IMPORTANT:

    The Funko collectible contract has not
    been deployed yet.

    We will add the real contract address
    after deploying the Funko Quest contract
    on Base Mainnet.

    Builder Code:
    bc_z2bsqs1j
  */

  showModal(
    "🏆",
    "Almost Ready!",
    "Your Base wallet is connected. The next step is deploying the Funko Quest collectible contract on Base Mainnet. Then this button will perform the real onchain claim."
  );
}


/* =========================
   MODAL
========================= */

function showModal(
  emoji,
  title,
  text
) {

  elements.modalEmoji.textContent =
    emoji;

  elements.modalTitle.textContent =
    title;

  elements.modalText.textContent =
    text;

  elements.modal.classList.remove(
    "hidden"
  );
}


function closeModal() {

  elements.modal.classList.add(
    "hidden"
  );
}


/* =========================
   RESET
========================= */

function resetGame() {

  const confirmed =
    confirm(
      "Reset all Funko Quest progress?"
    );

  if (!confirmed) return;

  localStorage.removeItem(
    "funkoQuestSave"
  );

  location.reload();
}


/* =========================
   EVENTS
========================= */

elements.startGameBtn
  .addEventListener(
    "click",
    startGame
  );

elements.funkoTarget
  .addEventListener(
    "click",
    hitTarget
  );

elements.dailyRewardBtn
  .addEventListener(
    "click",
    claimDailyReward
  );

elements.openBoxBtn
  .addEventListener(
    "click",
    openMysteryBox
  );

elements.connectWalletBtn
  .addEventListener(
    "click",
    connectBaseAccount
  );

elements.claimFunkoBtn
  .addEventListener(
    "click",
    claimFunko
  );

elements.closeModalBtn
  .addEventListener(
    "click",
    closeModal
  );

elements.modalActionBtn
  .addEventListener(
    "click",
    closeModal
  );

elements.resetBtn
  .addEventListener(
    "click",
    resetGame
  );

elements.modal.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      elements.modal
    ) {

      closeModal();
    }
  }
);


/* =========================
   START
========================= */

loadGame();

console.log(
  "Funko Quest",
  "Base Mainnet",
  BASE_CHAIN_DECIMAL,
  "Builder:",
  BUILDER_CODE
);
