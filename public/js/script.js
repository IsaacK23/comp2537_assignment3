const board = document.getElementById("game-board");
const message = document.getElementById("message");
const clicksDisplay = document.getElementById("clicks");
const matchedDisplay = document.getElementById("matched");
const remainingDisplay = document.getElementById("remaining");
const timerDisplay = document.getElementById("timer");

const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const powerUpBtn = document.getElementById("powerUpBtn");
const themeBtn = document.getElementById("themeBtn");
const difficultySelect = document.getElementById("difficulty");

let cards = [], flipped = [], matched = 0, totalPairs = 0, clicks = 0;
let timer = 0, interval, timeLimit = 0;
let allowFlip = true;

const difficultyMap = {
  easy: { pairs: 3, time: 20 },
  medium: { pairs: 6, time: 60 },
  hard: { pairs: 9, time: 90 }
};

startBtn.onclick = startGame;
resetBtn.onclick = resetGame;
themeBtn.onclick = () => document.body.classList.toggle("dark");
powerUpBtn.onclick = revealAll;

async function startGame() {
  const level = difficultySelect.value;
  totalPairs = difficultyMap[level].pairs;
  timeLimit = difficultyMap[level].time;
  timer = timeLimit;
  matched = clicks = 0;
  flipped = [];
  cards = [];
  message.textContent = "";
  updateStatus();
  clearInterval(interval);
  interval = setInterval(countdown, 1000);

  const pokemon = await fetchPokemon(totalPairs);
  generateCards(pokemon);
}

function resetGame() {
  clearInterval(interval);
  board.innerHTML = "";
  message.textContent = "Game Reset";
  timerDisplay.textContent = "Time: 0";
}

function countdown() {
  timer--;
  timerDisplay.textContent = `Time: ${timer}`;
  if (timer <= 0) {
    clearInterval(interval);
    endGame(false);
  }
}

function updateStatus() {
  clicksDisplay.textContent = `Clicks: ${clicks}`;
  matchedDisplay.textContent = `Matched: ${matched}`;
  remainingDisplay.textContent = `Remaining: ${totalPairs - matched}`;
  timerDisplay.textContent = `Time: ${timer}`;
}

async function fetchPokemon(pairCount) {
  const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1025");
  const data = await res.json();
  const chosen = [];
  while (chosen.length < pairCount) {
    const rand = data.results[Math.floor(Math.random() * data.results.length)];
    if (!chosen.find(p => p.name === rand.name)) {
      const detail = await fetch(rand.url);
      const poke = await detail.json();
      const img = poke.sprites.other["official-artwork"].front_default;
      if (img) chosen.push({ name: rand.name, img });
    }
  }
  return chosen;
}

function generateCards(pokemon) {
  const allCards = pokemon.flatMap(p => [p, p])
    .sort(() => Math.random() - 0.5);

  board.innerHTML = "";
  allCards.forEach((poke, index) => {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.name = poke.name;
    card.innerHTML = `
      <div class="inner">
        <div class="back"></div>
        <div class="front"><img src="${poke.img}" alt="${poke.name}" width="100%" height="100%"></div>
      </div>`;
    card.onclick = () => handleFlip(card);
    board.appendChild(card);
  });
}

function handleFlip(card) {
  if (!allowFlip) return;
  const inner = card.querySelector(".inner");
  if (inner.classList.contains("flipped")) return;
  inner.classList.add("flipped");
  flipped.push(card);
  clicks++;
  updateStatus();

  if (flipped.length === 2) {
    allowFlip = false;
    const [c1, c2] = flipped;
    if (c1.dataset.name === c2.dataset.name) {
      matched++;
      flipped = [];
      allowFlip = true;
      updateStatus();
      if (matched === totalPairs) endGame(true);
    } else {
      setTimeout(() => {
        c1.querySelector(".inner").classList.remove("flipped");
        c2.querySelector(".inner").classList.remove("flipped");
        flipped = [];
        allowFlip = true;
      }, 1000);
    }
  }
}

function endGame(win) {
  message.textContent = win ? "🎉 You win!" : "Game over!";
  message.className = win ? "win" : "lose";
  document.querySelectorAll(".card").forEach(card =>
    card.onclick = null
  );
  clearInterval(interval);
}

function revealAll() {
  const inners = document.querySelectorAll(".inner");
  inners.forEach(inner => inner.classList.add("flipped"));
  setTimeout(() => {
    inners.forEach(inner => {
      if (!inner.closest(".card").dataset.matched) {
        inner.classList.remove("flipped");
      }
    });
  }, 3000);
}