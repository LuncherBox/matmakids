
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
    type: "equation",
    title: "Matematyka",
    instruction: "Ile zostanie?",
    expression: "9 - 4",
    options: [4, 5, 6, 7],
    correct: 5
  },
  {
    id: "missing_1",
    type: "sequence",
    title: "Brakująca liczba",
    instruction: "Jaka liczba pasuje?",
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
    id: "memory_1",
    type: "memory",
    title: "Pamięć",
    instruction: "Zapamiętaj obrazki",
    items: ["🍎", "🚗", "🐶", "⭐"],
    question: "Co było na trzecim miejscu?",
    options: ["🍎", "🚗", "🐶", "⭐"],
    correct: "🐶",
    showMs: 4000
  },
  {
    id: "code_1",
    type: "code_input",
    title: "Kodowanie",
    instruction: "Odczytaj słowo i wpisz litery.",
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
    instruction: "Co pasuje w puste miejsce?",
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
  patternSelection: []
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
        <div class="hint-label">Podpowiedź</div>
        <div class="domino">
          ${dominoHalf(t.left)}
          ${dominoHalf(t.right)}
        </div>
      </div>
    `;
    renderOptions(t);
  }

  if (t.type === "sequence") {
    area.innerHTML = `<div class="sequence">${t.items.map(x => `<div class="box">${escapeHtml(x)}</div>`).join("")}</div>`;
    renderOptions(t);
  }

  if (t.type === "emoji_sequence" || t.type === "odd") {
    area.innerHTML = `<div class="sequence">${t.items.map(x => `<div class="box">${x}</div>`).join("")}</div>`;
    renderOptions(t);
  }

  if (t.type === "memory") {
    renderMemoryTask(t);
  }

  if (t.type === "code_input") {
    renderCodeInputTask(t);
  }

  if (t.type === "pattern_copy") {
    renderPatternCopyTask(t);
  }

  if (t.type === "sudoku") {
    area.innerHTML = `<div class="sudoku">${t.grid.map(v => `<div class="sudoku-cell">${v ?? "?"}</div>`).join("")}</div>`;
    renderOptions(t);
  }
}

function renderOptions(t) {
  const wrap = document.getElementById("options");
  wrap.innerHTML = t.options.map(o => `<button class="option" data-value="${escapeHtml(o)}">${escapeHtml(o)}</button>`).join("");
  wrap.querySelectorAll(".option").forEach(btn => {
    btn.addEventListener("click", () => checkAnswer(btn.dataset.value, t.correct));
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
      <div class="code-inputs">
        ${t.symbols.map((_,i) => `<input class="code-input" maxlength="1" inputmode="text" autocomplete="off" aria-label="Litera ${i+1}" />`).join("")}
      </div>
    </div>
  `;

  wrap.innerHTML = `
    <div class="letter-pad">
      ${uniqueLetters.map(letter => `<button class="letter-btn" data-letter="${letter}">${letter}</button>`).join("")}
    </div>
    <button class="check-btn" id="checkCode">SPRAWDŹ</button>
  `;

  const inputs = [...document.querySelectorAll(".code-input")];
  const focusFirstEmpty = () => {
    const target = inputs.find(i => !i.value) || inputs[inputs.length - 1];
    target.focus();
  };
  setTimeout(() => inputs[0]?.focus(), 100);

  document.querySelectorAll(".letter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = inputs.find(i => !i.value) || inputs[inputs.length - 1];
      target.value = btn.dataset.letter;
      const next = inputs.find(i => !i.value);
      if (next) next.focus();
    });
  });

  inputs.forEach((input, idx) => {
    input.addEventListener("input", e => {
      e.target.value = e.target.value.toUpperCase().replace(/[^A-ZĄĆĘŁŃÓŚŹŻ]/g, "").slice(0,1);
      if (e.target.value && inputs[idx+1]) inputs[idx+1].focus();
    });
  });

  document.getElementById("checkCode").addEventListener("click", () => {
    const value = inputs.map(i => i.value.trim().toUpperCase()).join("");
    if (value === t.answer) success();
    else retry();
  });
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

function showFeedback(text, kind) {
  const old = document.querySelector(".feedback");
  if (old) old.remove();
  const el = document.createElement("div");
  el.className = `feedback ${kind}`;
  el.textContent = text;
  document.body.appendChild(el);
  return el;
}

function success() {
  const fb = showFeedback("Super! 🌟", "good");
  document.querySelectorAll("button, input").forEach(el => el.disabled = true);
  setTimeout(() => {
    fb.remove();
    state.index += 1;
    renderTask();
  }, 850);
}

function retry() {
  const fb = showFeedback("Spróbuj jeszcze raz", "retry");
  setTimeout(() => fb.remove(), 900);
}

function checkAnswer(value, correct) {
  if (String(value) === String(correct)) success();
  else retry();
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
