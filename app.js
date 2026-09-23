
const app = document.getElementById("app");

const tasks = [
  {
    id: "add_1",
    type: "equation_with_dots",
    title: "Matematyka",
    instruction: "Oblicz działanie.",
    expression: "1 + 4",
    left: 1,
    right: 4,
    options: [3, 4, 5, 6],
    correct: 5
  },
  {
    id: "subtract_1",
    type: "equation_with_gnome",
    title: "Matematyka",
    instruction: "Ile zostanie?",
    expression: "9 - 4",
    startCount: 9,
    removedCount: 4,
    options: [4, 5, 6, 7],
    correct: 5
  },
  {
    id: "missing_1",
    type: "sequence",
    title: "Brakująca liczba",
    instruction: "Jaka liczba pasuje w wyróżnione miejsce?",
    items: [2, 4, 6, "?", 10],
    options: [7, 8, 9, 10],
    correct: 8
  },
  {
    id: "logic_1",
    type: "emoji_sequence",
    title: "Logika",
    instruction: "Co będzie dalej?",
    items: ["🔵", "🟡", "🔵", "🟡", "🔵", "?"],
    options: ["🔵", "🟡", "🟢", "🟣"],
    correct: "🟡"
  },
  {
    id: "odd_1",
    type: "odd",
    title: "Logika",
    instruction: "Co nie pasuje?",
    items: ["🐶", "🐱", "🐰", "🚗"],
    options: ["🐶", "🐱", "🐰", "🚗"],
    correct: "🚗"
  },
  {
    id: "code_1",
    type: "code_input",
    title: "Kodowanie",
    instruction: "Odczytaj słowo i wybierz litery.",
    key: [
      ["○", "A"], ["□", "O"], ["△", "K"], ["◇", "L"],
      ["⬠", "M"], ["☆", "P"], ["♡", "R"], ["⬡", "S"]
    ],
    symbols: ["◇", "○", "⬡"],
    answer: "LAS"
  },
  {
    id: "pattern_copy_1",
    type: "pattern_copy",
    title: "Logika",
    instruction: "Pokoloruj taki sam wzór.",
    pattern: [
      1,1,1,0,0,
      1,0,0,0,0,
      1,0,0,0,0,
      1,0,0,0,0,
      1,0,0,0,0
    ]
  },
  {
    id: "sudoku_1",
    type: "sudoku",
    title: "Sudoku",
    instruction: "Co pasuje w wyróżnione miejsce?",
    grid: [
      "🍎", null, "🍓", "🍐",
      "🍓", "🍐", "🍎", "🍌",
      "🍌", "🍎", "🍐", "🍓",
      "🍐", "🍓", "🍌", "🍎"
    ],
    options: ["🍎", "🍌", "🍓", "🍐"],
    correct: "🍌"
  },
  {
    id: "add_2",
    type: "equation_with_dots",
    title: "Matematyka",
    instruction: "Oblicz działanie.",
    expression: "3 + 2",
    left: 3,
    right: 2,
    options: [4, 5, 6, 7],
    correct: 5
  }
];

let state = {
  name: localStorage.getItem("kid_name") || "",
  index: 0,
  patternSelection: [],
  codeLetters: []
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

function renderName() {
  app.innerHTML = `
    <section class="screen centered">
      <div class="brand">Mały Trening</div>
      <h1>Cześć 👋</h1>
      <p class="subtle">Wpisz swoje imię i zaczynamy.</p>
      <div class="name-card">
        <label for="name" class="task-title">Jak masz na imię?</label>
        <input id="name" class="name-input" autocomplete="off" inputmode="text" maxlength="20" value="${escapeHtml(state.name)}" />
        <button id="start" class="primary" ${state.name.trim() ? "" : "disabled"}>ZACZYNAM</button>
      </div>
    </section>
  `;
  const input = document.getElementById("name");
  const btn = document.getElementById("start");
  input.addEventListener("input", e => {
    state.name = e.target.value;
    btn.disabled = !state.name.trim();
  });
  btn.addEventListener("click", () => {
    localStorage.setItem("kid_name", state.name.trim());
    state.index = 0;
    renderTask();
  });
}

function renderTask() {
  if (state.index >= tasks.length) {
    renderFinish();
    return;
  }

  state.patternSelection = [];
  state.codeLetters = [];
  const t = tasks[state.index];
  const progress = Math.round((state.index / tasks.length) * 100);

  app.innerHTML = `
    <section class="screen">
      <div class="topbar">
        <div class="progress-shell"><div class="progress-bar" style="width:${progress}%"></div></div>
        <div class="counter">${state.index + 1}/${tasks.length}</div>
      </div>
      <div class="task-card">
        <div class="task-title">${escapeHtml(t.title)}</div>
        <div class="instruction" id="instruction">${escapeHtml(t.instruction)}</div>
        <div class="task-area" id="taskArea"></div>
        <div class="options" id="options"></div>
        <div class="feedback-slot" id="feedbackSlot" aria-live="polite"></div>
      </div>
    </section>
  `;

  const area = document.getElementById("taskArea");

  if (t.type === "equation") {
    area.innerHTML = `<div class="equation">${escapeHtml(t.expression)} = ?</div>`;
    renderOptions(t);
  }

  if (t.type === "equation_with_dots") {
    area.innerHTML = `
      <div class="math-stack">
        <div class="equation">${escapeHtml(t.expression)} = ?</div>
        <div class="hint-card">
          <div class="hint-label">Podpowiedź</div>
          <div class="domino">
            ${dominoHalf(t.left)}
            ${dominoHalf(t.right)}
          </div>
        </div>
      </div>
    `;
    renderOptions(t);
  }

  if (t.type === "equation_with_gnome") {
    area.innerHTML = `
      <div class="math-stack">
        <div class="equation">${escapeHtml(t.expression)} = ?</div>
        <div class="hint-card gnome-hint">
          <div class="gnome-line">
            <span class="gnome-character">🧙‍♂️</span>
            <span><strong>Gnom zabiera ${t.removedCount}</strong><br><small>Zobacz, ile zostaje.</small></span>
          </div>
          <div class="takeaway-dots">${takeawayDots(t.startCount, t.removedCount)}</div>
        </div>
      </div>
    `;
    renderOptions(t);
  }

  if (t.type === "sequence") {
    area.innerHTML = `<div class="sequence">${t.items.map(x => `<div class="box ${x === "?" ? "missing-box" : ""}">${escapeHtml(x)}</div>`).join("")}</div>`;
    renderOptions(t);
  }

  if (t.type === "emoji_sequence") {
    area.innerHTML = `<div class="sequence">${t.items.map(x => `<div class="box ${x === "?" ? "missing-box" : ""}">${x}</div>`).join("")}</div>`;
    renderOptions(t);
  }

  if (t.type === "odd") {
    area.innerHTML = `<div class="sequence">${t.items.map(x => `<div class="box">${x}</div>`).join("")}</div>`;
    renderOptions(t);
  }

  if (t.type === "code_input") {
    renderCodeInputTask(t);
  }

  if (t.type === "pattern_copy") {
    renderPatternCopyTask(t);
  }

  if (t.type === "sudoku") {
    area.innerHTML = `<div class="sudoku">${t.grid.map(v => `<div class="sudoku-cell ${v == null ? "missing-cell" : ""}">${v ?? "?"}</div>`).join("")}</div>`;
    renderOptions(t);
  }
}

function renderOptions(t) {
  const wrap = document.getElementById("options");
  wrap.innerHTML = t.options.map(o => `<button class="option" data-value="${escapeHtml(o)}">${escapeHtml(o)}</button>`).join("");
  wrap.querySelectorAll(".option").forEach(btn => {
    btn.addEventListener("click", () => checkAnswer(btn.dataset.value, t.correct, btn));
  });
}

function renderMemoryTask(t) {
  const area = document.getElementById("taskArea");
  const instruction = document.getElementById("instruction");
  const options = document.getElementById("options");
  options.innerHTML = "";
  instruction.textContent = t.instruction;
  area.innerHTML = `<div class="memory-items">${t.items.map(i => `<span>${i}</span>`).join("")}</div>`;
  setTimeout(() => {
    if (tasks[state.index]?.id !== t.id) return;
    instruction.textContent = t.question;
    area.innerHTML = `<div class="equation">?</div>`;
    renderOptions(t);
  }, t.showMs);
}

function renderCodeInputTask(t) {
  const area = document.getElementById("taskArea");
  const wrap = document.getElementById("options");
  wrap.style.display = "block";

  const uniqueLetters = [...new Set(t.key.map(([, letter]) => letter))].slice(0, 8);

  area.innerHTML = `
    <div class="code-wrap">
      <div class="code-key">
        ${t.key.map(([s,l]) => `<div class="code-item"><div class="code-symbol">${s}</div><div class="code-letter">${l}</div></div>`).join("")}
      </div>
      <div class="code-word">${t.symbols.map(s => `<span>${s}</span>`).join("")}</div>
      <div class="code-inputs" id="codeInputs">
        ${t.symbols.map((_,i) => `<div class="code-input-box" data-index="${i}" aria-label="Litera ${i+1}"></div>`).join("")}
      </div>
    </div>
  `;

  wrap.innerHTML = `
    <div class="letter-pad">
      ${uniqueLetters.map(letter => `<button class="letter-btn" data-letter="${letter}">${letter}</button>`).join("")}
      <button class="letter-btn erase-btn" id="eraseLetter" aria-label="Usuń ostatnią literę">⌫</button>
    </div>
    <button class="check-btn" id="checkCode">SPRAWDŹ</button>
  `;

  function refreshCodeBoxes() {
    document.querySelectorAll(".code-input-box").forEach((box, index) => {
      box.textContent = state.codeLetters[index] || "";
      box.classList.toggle("active", index === state.codeLetters.length && state.codeLetters.length < t.symbols.length);
    });
  }

  document.querySelectorAll(".letter-btn[data-letter]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (state.codeLetters.length >= t.symbols.length) return;
      state.codeLetters.push(btn.dataset.letter);
      clearFeedback();
      refreshCodeBoxes();
    });
  });

  document.getElementById("eraseLetter").addEventListener("click", () => {
    state.codeLetters.pop();
    clearFeedback();
    refreshCodeBoxes();
  });

  document.getElementById("checkCode").addEventListener("click", () => {
    const value = state.codeLetters.join("");
    if (value === t.answer) success();
    else retry();
  });

  refreshCodeBoxes();
}

function renderPatternCopyTask(t) {
  const area = document.getElementById("taskArea");
  const wrap = document.getElementById("options");
  wrap.style.display = "block";

  area.innerHTML = `
    <div class="pattern-block">
      <div class="pattern-label">WZÓR</div>
      ${patternGridStatic(t.pattern)}
      <div class="pattern-label">TWÓJ WZÓR</div>
      ${patternGridEditable(t.pattern.length)}
    </div>
  `;

  wrap.innerHTML = `<button class="check-btn" id="checkPattern">SPRAWDŹ</button>`;

  document.querySelectorAll(".dot-button").forEach((btn, idx) => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("filled");
      state.patternSelection[idx] = btn.classList.contains("filled") ? 1 : 0;
      clearFeedback();
    });
  });

  document.getElementById("checkPattern").addEventListener("click", () => {
    const current = Array.from({length: t.pattern.length}, (_, i) => state.patternSelection[i] ? 1 : 0);
    const ok = current.every((v, i) => v === t.pattern[i]);
    if (ok) success();
    else retry();
  });
}

function patternGridStatic(pattern) {
  return `<div class="grid-5">${pattern.map(v => `<div class="dot-static ${v ? "filled" : ""}"></div>`).join("")}</div>`;
}

function patternGridEditable(length) {
  return `<div class="grid-5">${Array.from({length}, (_,i) => `<button class="dot-button" aria-label="Kropka ${i+1}"></button>`).join("")}</div>`;
}

function feedbackSlot() {
  return document.getElementById("feedbackSlot");
}

function clearFeedback() {
  const slot = feedbackSlot();
  if (!slot) return;
  slot.className = "feedback-slot";
  slot.textContent = "";
}

function showFeedback(text, kind) {
  const slot = feedbackSlot();
  if (!slot) return;
  slot.className = `feedback-slot visible ${kind}`;
  slot.textContent = text;
}

function success(selectedButton = null) {
  if (selectedButton) selectedButton.classList.add("correct-choice");
  showFeedback("Super! 🌟", "good");
  document.querySelectorAll("button").forEach(el => el.disabled = true);
  setTimeout(() => {
    state.index += 1;
    renderTask();
  }, 850);
}

function retry(selectedButton = null) {
  if (selectedButton) {
    selectedButton.classList.add("wrong-choice");
    setTimeout(() => selectedButton.classList.remove("wrong-choice"), 700);
  }
  showFeedback("Spróbuj jeszcze raz", "retry");
}

function checkAnswer(value, correct, selectedButton = null) {
  if (String(value) === String(correct)) success(selectedButton);
  else retry(selectedButton);
}

function dominoHalf(count) {
  const positions = {
    0: [],
    1: [[50,50]],
    2: [[25,25],[75,75]],
    3: [[25,25],[50,50],[75,75]],
    4: [[25,25],[75,25],[25,75],[75,75]],
    5: [[25,25],[75,25],[50,50],[25,75],[75,75]],
    6: [[25,20],[75,20],[25,50],[75,50],[25,80],[75,80]]
  };
  return `<div class="domino-half">${positions[count].map(([x,y]) => `<span class="pip" style="left:calc(${x}% - 6px);top:calc(${y}% - 6px)"></span>`).join("")}</div>`;
}

function takeawayDots(total, removed) {
  return Array.from({length: total}, (_, index) => {
    const removedClass = index >= total - removed ? "taken" : "";
    return `<span class="takeaway-dot ${removedClass}"></span>`;
  }).join("");
}

function renderFinish() {
  app.innerHTML = `
    <section class="screen centered">
      <div class="finish-card">
        <div class="big-emoji">🎉</div>
        <h1>Super, ${escapeHtml(state.name)}!</h1>
        <p>Zrobiłaś wszystkie zadania na dziś.</p>
        <div style="height:20px"></div>
        <button class="primary" id="again">JESZCZE RAZ</button>
      </div>
    </section>
  `;
  document.getElementById("again").addEventListener("click", () => {
    state.index = 0;
    renderTask();
  });
}

renderName();
