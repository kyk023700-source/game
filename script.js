// State management
let currentMode = "normal";
const reincarnationHistory = [];

const FUNNY_SLOGANS = [
  "전 세계 80억 인구 데이터 동기화 중...",
  "신생아 호적 대장 훑는 중...",
  "인도 인구가 14억이라는 사실을 잊지 마세요...",
  "중국 신생아실 문앞을 지나가는 중...",
  "혹시 모나코나 스위스 금수저 로또 당첨?!",
  "영혼 이동 웜홀 통과 중...",
  "운명의 국경선 넘나드는 중..."
];

// Elements
const screenIntro = document.getElementById("screen-intro");
const screenGacha = document.getElementById("screen-gacha");
const screenResult = document.getElementById("screen-result");

const startBtn = document.getElementById("start-btn");
const retryBtn = document.getElementById("retry-btn");
const shareBtn = document.getElementById("share-btn");

const slotFlag = document.getElementById("slot-flag");
const slotName = document.getElementById("slot-name");
const slotSub = document.getElementById("slot-sub");
const gachaMsg = document.getElementById("gacha-msg");

const resBadge = document.getElementById("res-badge");
const resFlag = document.getElementById("res-flag");
const resRarity = document.getElementById("res-rarity");
const resCountry = document.getElementById("res-country");
const resTitle = document.getElementById("res-title");
const resProb = document.getElementById("res-prob");
const resTrait = document.getElementById("res-trait");
const resPassive = document.getElementById("res-passive");
const resDifficulty = document.getElementById("res-difficulty");
const resQuote = document.getElementById("res-quote");
const historyList = document.getElementById("history-list");

// Sound effect synthesizer using Web Audio API (No external sound files required)
function playBeep(freq = 440, type = "sine", duration = 0.08) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Audio might be blocked before user gesture
  }
}

function playFanfare() {
  const notes = [261.63, 329.63, 392.00, 523.25]; // C, E, G, High C
  notes.forEach((freq, idx) => {
    setTimeout(() => {
      playBeep(freq, "triangle", 0.3);
    }, idx * 90);
  });
}

// Country Pick Algorithm based on Mode & Weight
function pickCountry(mode) {
  let list = COUNTRIES.map(c => ({ ...c }));

  if (mode === "chaos") {
    // 모든 국가 동등 확률
    const randIdx = Math.floor(Math.random() * list.length);
    return list[randIdx];
  }

  if (mode === "lucky") {
    // 복지/선진국 버프
    const luckyCountries = ["스위스", "노르웨이", "아이슬란드", "모나코", "독일", "미국", "영국", "대한민국", "일본"];
    list.forEach(c => {
      if (luckyCountries.includes(c.name)) {
        c.weight *= 6; // 가중치 6배 뻥튀기
      }
    });
  }

  // 가중치 룰렛
  const totalWeight = list.reduce((sum, c) => sum + c.weight, 0);
  let randomVal = Math.random() * totalWeight;

  for (const country of list) {
    if (randomVal < country.weight) {
      return country;
    }
    randomVal -= country.weight;
  }

  return list[0];
}

// Screen transitions
function showScreen(screen) {
  [screenIntro, screenGacha, screenResult].forEach(s => {
    s.classList.add("hidden");
    s.classList.remove("fade-in");
  });
  screen.classList.remove("hidden");
  screen.classList.add("fade-in");
}

// Start Gacha Flow
function triggerReincarnation() {
  const selectedKarma = document.querySelector('input[name="karma"]:checked');
  currentMode = selectedKarma ? selectedKarma.value : "normal";

  showScreen(screenGacha);

  // 룰렛 연출 시작
  let speed = 60;
  let counter = 0;
  const maxSpins = 32;
  const targetCountry = pickCountry(currentMode);

  const spinInterval = setInterval(() => {
    counter++;
    const randomPick = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
    
    slotFlag.textContent = randomPick.flag;
    slotName.textContent = randomPick.name;
    slotSub.textContent = `출생 확률 검토 중...`;

    // 사운드
    playBeep(300 + (counter * 18), "sawtooth", 0.05);

    // 안내 메시지 랜덤 변경
    if (counter % 5 === 0) {
      const msgIdx = Math.floor(Math.random() * FUNNY_SLOGANS.length);
      gachaMsg.textContent = `"${FUNNY_SLOGANS[msgIdx]}"`;
    }

    if (counter >= maxSpins) {
      clearInterval(spinInterval);
      setTimeout(() => {
        finishGacha(targetCountry);
      }, 500);
    }
  }, speed);
}

// Finish Gacha & Show Result
function finishGacha(country) {
  showScreen(screenResult);
  playFanfare();

  // 폭죽 이펙트 (Canvas Confetti)
  if (typeof confetti === "function") {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  }

  // Populate data
  resFlag.textContent = country.flag;
  resCountry.textContent = country.name;
  resTitle.textContent = `"${country.title}"`;
  resProb.textContent = country.probText;
  resTrait.textContent = country.trait;
  resPassive.textContent = country.passive;
  resDifficulty.textContent = country.difficulty;
  resQuote.textContent = country.reaction;
  resRarity.textContent = country.probText.split(" ")[0];

  // History 기록
  reincarnationHistory.unshift(country);
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = "";
  reincarnationHistory.slice(0, 8).forEach((item, idx) => {
    const badge = document.createElement("span");
    badge.className = "history-badge";
    badge.innerHTML = `${item.flag} ${item.name} <small>(${idx === 0 ? "방금" : `${idx + 1}회차 전`})</small>`;
    historyList.appendChild(badge);
  });
}

// Event Listeners
startBtn.addEventListener("click", () => {
  triggerReincarnation();
});

retryBtn.addEventListener("click", () => {
  triggerReincarnation();
});

shareBtn.addEventListener("click", () => {
  if (reincarnationHistory.length === 0) return;
  const current = reincarnationHistory[0];
  const shareText = `[다음 생애 환생 가챠 결과 🎲]\n국가: ${current.flag} ${current.name}\n${current.reaction}\n\n👉 지금 환생 결과 확인하기: https://github.com`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(shareText).then(() => {
      const originalText = shareBtn.innerHTML;
      shareBtn.innerHTML = "<span>✅ 클립보드에 복사 완료!</span>";
      setTimeout(() => {
        shareBtn.innerHTML = originalText;
      }, 2000);
    }).catch(() => {
      fallbackCopy(shareText);
    });
  } else {
    fallbackCopy(shareText);
  }
});

function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
  alert("클립보드에 결과가 복사되었습니다!");
}
