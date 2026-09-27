import {z
  createPublicClient,
  createWalletClient,
  custom,
  http
} from "https://esm.sh/viem@2.45.0";

import { base } from "https://esm.sh/viem@2.45.0/chains";

const BUILDER_CODE = "bc_z2bsqs1j";

const BASE_CHAIN_ID = "0x2105";
const BASE_CHAIN_DECIMAL = 8453;

const FUNKO_CONTRACT =
  "0x859cb50827bdaf5d980dc8ff79e5cd82094e9296";

/*
 * ERC-8021 attribution suffix for:
 * Builder Code: bc_z2bsqs1j
 */
const DATA_SUFFIX =
  "0x62635f7a3262737173316a0b0080218021802180218021802180218021";

const FUNKO_ABI = [
  {
    type: "function",
    name: "claimFunko",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "_funkoType",
        type: "uint8"
      }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "hasClaimed",
    stateMutability: "view",
    inputs: [
      {
        name: "",
        type: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "bool"
      }
    ]
  },
  {
    type: "function",
    name: "totalMinted",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ]
  },
  {
    type: "function",
    name: "funkoType",
    stateMutability: "view",
    inputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint8"
      }
    ]
  }
];

const publicClient = createPublicClient({
  chain: base,
  transport: http("https://mainnet.base.org")
});

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

  try {

    if (!state.walletAddress) {

      await connectBaseAccount();

      if (!state.walletAddress) {
        return;
      }
    }

    const walletAddress =
      state.walletAddress;

    /*
     * Make sure the connected wallet is
     * actually on Base Mainnet.
     */
    const provider =
      baseProvider || window.ethereum;

    if (!provider) {
      throw new Error(
        "Wallet provider not found."
      );
    }

    const chainId =
      await provider.request({
        method: "eth_chainId"
      });

    if (
      chainId.toLowerCase() !==
      BASE_CHAIN_ID
    ) {

      showModal(
        "🔵",
        "Switch to Base",
        "Please switch your wallet to Base Mainnet."
      );

      return;
    }

    /*
     * Check the real smart contract.
     */
    const alreadyClaimed =
      await publicClient.readContract({
        address: FUNKO_CONTRACT,
        abi: FUNKO_ABI,
        functionName: "hasClaimed",
        args: [walletAddress]
      });

    if (alreadyClaimed) {

      showModal(
        "🧸",
        "Already Claimed!",
        "This wallet has already claimed its Funko on Base Mainnet."
      );

      elements.claimFunkoBtn.disabled =
        true;

      elements.claimFunkoBtn.textContent =
        "Already Claimed ✓";

      return;
    }

    /*
     * Funko type is determined by gameplay.
     *
     * 0 = Base Bot
     * 1 = Moon Alien
     * 2 = Crypto Wizard
     * 3 = Base Ninja
     * 4 = Chain King
     * 5 = Legendary Unicorn
     */
    const funkoType =
      Math.min(
        5,
        Math.floor(score / 10)
      );

    const walletClient =
      createWalletClient({
        chain: base,
        transport: custom(provider)
      });

    /*
     * Check current onchain token count.
     */
    const tokenBefore =
      await publicClient.readContract({
        address: FUNKO_CONTRACT,
        abi: FUNKO_ABI,
        functionName: "totalMinted"
      });

    elements.claimFunkoBtn.disabled =
      true;

    elements.claimFunkoBtn.textContent =
      "Confirm in Wallet...";

    /*
     * REAL BASE MAINNET TRANSACTION
     *
     * Builder Code is attached through
     * ERC-8021 dataSuffix.
     */
    const txHash =
      await walletClient.writeContract({

        address:
          FUNKO_CONTRACT,

        abi:
          FUNKO_ABI,

        functionName:
          "claimFunko",

        args:
          [funkoType],

        account:
          walletAddress,

        dataSuffix:
          DATA_SUFFIX
      });

    elements.claimFunkoBtn.textContent =
      "Minting...";

    showModal(
      "⏳",
      "Transaction Sent!",
      "Your Funko claim is being confirmed on Base Mainnet."
    );

    /*
     * Wait for confirmation.
     */
    const receipt =
      await publicClient.waitForTransactionReceipt({
        hash: txHash
      });

    if (
      receipt.status !== "success"
    ) {

      throw new Error(
        "The transaction reverted."
      );
    }

    /*
     * Save the claimed Funko locally.
     */
    const collectible =
      COLLECTIBLES[funkoType];

    if (
      collectible &&
      !state.collection.includes(
        collectible.id
      )
    ) {

      state.collection.push(
        collectible.id
      );
    }

    state.coins += 100;
    state.xp += 100;

    saveGame();
    render();

    elements.claimFunkoBtn.disabled =
      true;

    elements.claimFunkoBtn.textContent =
      "Funko Claimed ✓";

    showModal(
      collectible
        ? collectible.emoji
        : "🧸",
      "Funko Claimed!",
      `${collectible ? collectible.name : "Funko"} is now yours on Base Mainnet.`
    );

    console.log(
      "FUNKO CLAIM SUCCESS",
      {
        transaction: txHash,
        contract: FUNKO_CONTRACT,
        wallet: walletAddress,
        funkoType,
        tokenId: tokenBefore.toString(),
        builderCode: BUILDER_CODE
      }
    );

  } catch (error) {

    console.error(
      "Funko claim failed:",
      error
    );

    elements.claimFunkoBtn.disabled =
      false;

    elements.claimFunkoBtn.textContent =
      "Claim Funko";

    showModal(
      "⚠️",
      "Claim Failed",
      error.shortMessage ||
      error.message ||
      "The Funko claim failed."
    );
  }
}
