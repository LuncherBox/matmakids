const app = document.getElementById("app");

const SESSION_SIZE = 10;
const CATEGORY_LABELS = {
  math: "Matematyka",
  logic: "Logika",
  coding: "Kodowanie",
  memory: "Pamięć"
};

let taskBank = [];
let sessionTasks = [];

let state = {
  name: localStorage.getItem("kid_name") || "",
  index: 0,
  codeLetters: [],
  memoryTimer: null
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[c]));
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function previousTaskIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem("last_task_ids") || "[]"));
  } catch {
    return new Set();
  }
}

function buildSession() {
  const previous = previousTaskIds();
  const categories = shuffle(["math", "logic", "coding", "memory"]);
  const quotas = {
    [categories[0]]: 3,
    [categories[1]]: 3,
    [categories[2]]: 2,
    [categories[3]]: 2
  };

  const picked = [];

  categories.forEach(category => {
    const allInCategory = taskBank.filter(task => task.category === category);
    let candidates = allInCategory.filter(task => !previous.has(task.id));

    if (candidates.length < quotas[category]) {
      candidates = allInCategory;
    }

    picked.push(...shuffle(candidates).slice(0, quotas[category]));
  });

  sessionTasks = shuffle(picked).slice(0, SESSION_SIZE);
  localStorage.setItem("last_task_ids", JSON.stringify(sessionTasks.map(task => task.id)));
  state.index = 0;
}

async function loadTaskBank() {
  try {
    const response = await fetch("./tasks.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Nie udało się pobrać bazy zadań.");
    taskBank = await response.json();

    if (!Array.isArray(taskBank) || taskBank.length < SESSION_SIZE) {
      throw new Error("Baza zadań jest niepełna.");
    }

    renderName();
  } catch (error) {
    app.innerHTML = `
      <section class="screen centered">
        <div class="finish-card">
          <div class="big-emoji">🛠️</div>
          <h1>Chwilowy problem</h1>
          <p>Nie udało się wczytać zadań. Odśwież stronę.</p>
        </div>
      </section>
    `;
    console.error(error);
  }
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

  input.addEventListener("input", event => {
    state.name = event.target.value;
    btn.disabled = !state.name.trim();
  });

  btn.addEventListener("click", () => {
    localStorage.setItem("kid_name", state.name.trim());
    startNewSession();
  });
}

function startNewSession() {
  stopCurrentTaskActivity();
  buildSession();
  renderTask();
}

function stopCurrentTaskActivity() {
  if (state.memoryTimer) {
    clearTimeout(state.memoryTimer);
    state.memoryTimer = null;
  }
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

function renderTask() {
  stopCurrentTaskActivity();

  if (state.index >= sessionTasks.length) {
    renderFinish();
    return;
  }

  state.codeLetters = [];
  const task = sessionTasks[state.index];
  const progress = Math.round((state.index / sessionTasks.length) * 100);

  app.innerHTML = `
    <section class="screen">
      <div class="topbar">
        <div class="progress-shell"><div class="progress-bar" style="width:${progress}%"></div></div>
        <div class="counter">${state.index + 1}/${sessionTasks.length}</div>
      </div>

      <div class="task-card">
        <div class="task-title">${escapeHtml(CATEGORY_LABELS[task.category] || task.category)}</div>

        <div class="instruction-row">
          <div class="instruction" id="instruction">${escapeHtml(task.instruction)}</div>
          <button class="speak-btn" id="speakTask" type="button" aria-label="Przeczytaj instrukcję">🔊</button>
        </div>

        <div class="task-area" id="taskArea"></div>
        <div class="options" id="options"></div>
        <div class="feedback-slot" id="feedbackSlot" aria-live="polite"></div>
      </div>
    </section>
  `;

  renderByType(task);
  setupTaskSpeech();
}

function renderByType(task) {
  const renderers = {
    equation_with_dots: renderEquationWithDots,
    missing_number_equation: renderMissingEquation,
    number_sequence: renderSequence,
    number_comparison: renderNumberComparison,
    visual_sequence: renderSequence,
    odd_one_out: renderItemRow,
    classification: renderItemRow,
    spatial_relation_grid: renderSpatialRelation,
    pattern_matrix: renderPatternMatrix,
    sudoku_4x4: renderSudoku,
    symbol_code: renderSymbolCode,
    command_grid_follow: renderCommandGrid,
    command_grid_predict: renderCommandGrid,
    command_grid_plan: renderCommandGrid,
    command_grid_debug: renderCommandGrid,
    command_pattern: renderCommandPattern,
    image_memory: renderMemory,
    location_memory_grid: renderMemory,
    sequence_memory: renderMemory,
    number_memory: renderMemory,
    pair_memory: renderMemory
  };

  const renderer = renderers[task.renderer];
  if (renderer) {
    renderer(task);
  } else {
    renderFallback(task);
  }
}

function renderEquationWithDots(task) {
  const area = document.getElementById("taskArea");
  const data = task.content;
  const isSubtraction = task.subcategory === "subtraction";

  if (isSubtraction) {
    area.innerHTML = `
      <div class="math-stack">
        <div class="equation">${escapeHtml(data.expression)} = ?</div>
        <div class="hint-card count-hint">
          <div class="hint-label">Podpowiedź</div>
          <div class="gnome-line">
            <span class="gnome-character">🧙‍♂️</span>
            <span>Gnom zabiera <strong>${escapeHtml(data.right)}</strong></span>
          </div>
          <div class="count-dots">${takeawayDots(data.left, data.right)}</div>
        </div>
      </div>
    `;
  } else {
    area.innerHTML = `
      <div class="math-stack">
        <div class="equation">${escapeHtml(data.expression)} = ?</div>
        <div class="hint-card count-hint">
          <div class="hint-label">Podpowiedź</div>
          <div class="addition-dots">
            <div class="count-dots">${plainDots(data.left)}</div>
            <div class="dot-operator">+</div>
            <div class="count-dots">${plainDots(data.right)}</div>
          </div>
        </div>
      </div>
    `;
  }

  renderOptions(task);
}

function renderMissingEquation(task) {
  const area = document.getElementById("taskArea");
  const expression = escapeHtml(task.content.expression).replace("?", '<span class="inline-missing">?</span>');
  area.innerHTML = `<div class="equation missing-equation">${expression}</div>`;
  renderOptions(task);
}

function renderSequence(task) {
  const area = document.getElementById("taskArea");
  const items = task.content.items || [];
  area.innerHTML = `
    <div class="sequence">
      ${items.map(item => item == null
        ? '<div class="box missing-box">?</div>'
        : `<div class="box">${escapeHtml(item)}</div>`
      ).join("")}
    </div>
  `;
  renderOptions(task);
}

function renderNumberComparison(task) {
  const area = document.getElementById("taskArea");
  const data = task.content;
  area.innerHTML = `
    <div class="number-compare">
      <div class="compare-number">${escapeHtml(data.left)}</div>
      <div class="compare-vs">czy</div>
      <div class="compare-number">${escapeHtml(data.right)}</div>
    </div>
  `;
  renderOptions(task);
}

function renderItemRow(task) {
  const area = document.getElementById("taskArea");
  const items = task.content.items || task.options || [];
  area.innerHTML = `
    <div class="item-row">
      ${items.map(item => `<div class="item-tile">${escapeHtml(item)}</div>`).join("")}
    </div>
  `;
  renderOptions(task);
}

function renderSpatialRelation(task) {
  const area = document.getElementById("taskArea");
  area.innerHTML = renderGrid(task.content.grid_size, task.content.objects, null, null);
  renderOptions(task);
}

function renderPatternMatrix(task) {
  const area = document.getElementById("taskArea");
  const grid = task.content.grid || [];
  area.innerHTML = `
    <div class="pattern-matrix">
      ${grid.flatMap((row, r) => row.map((value, c) => {
        const missing = value == null;
        return `<div class="matrix-cell ${missing ? "missing-cell" : ""}">${missing ? "?" : escapeHtml(value)}</div>`;
      })).join("")}
    </div>
  `;
  renderOptions(task);
}

function renderSudoku(task) {
  const area = document.getElementById("taskArea");
  const grid = (task.content.grid || []).flat();
  area.innerHTML = `
    <div class="sudoku">
      ${grid.map(value => `<div class="sudoku-cell ${value == null ? "missing-cell" : ""}">${value == null ? "?" : escapeHtml(value)}</div>`).join("")}
    </div>
  `;
  renderOptions(task);
}

function renderSymbolCode(task) {
  const area = document.getElementById("taskArea");
  const wrap = document.getElementById("options");
  const legendEntries = Object.entries(task.content.legend || {});
  const code = task.content.code || [];
  const letters = shuffle([...new Set(legendEntries.map(([, letter]) => letter))]);

  area.innerHTML = `
    <div class="code-wrap">
      <div class="code-key">
        ${legendEntries.map(([symbol, letter]) => `
          <div class="code-item">
            <div class="code-symbol">${escapeHtml(symbol)}</div>
            <div class="code-letter">${escapeHtml(letter)}</div>
          </div>
        `).join("")}
      </div>

      <div class="code-word">
        ${code.map(symbol => `<span>${escapeHtml(symbol)}</span>`).join("")}
      </div>

      <div class="code-inputs" id="codeInputs">
        ${code.map((_, index) => `<div class="code-input-box" data-index="${index}"></div>`).join("")}
      </div>
    </div>
  `;

  wrap.style.display = "block";
  wrap.innerHTML = `
    <div class="letter-pad">
      ${letters.map(letter => `<button class="letter-btn" data-letter="${escapeHtml(letter)}">${escapeHtml(letter)}</button>`).join("")}
      <button class="letter-btn erase-btn" id="eraseLetter" aria-label="Usuń ostatnią literę">⌫</button>
    </div>
    <button class="check-btn" id="checkCode">SPRAWDŹ</button>
  `;

  function refresh() {
    document.querySelectorAll(".code-input-box").forEach((box, index) => {
      box.textContent = state.codeLetters[index] || "";
      box.classList.toggle("active", index === state.codeLetters.length && state.codeLetters.length < code.length);
    });
  }

  wrap.querySelectorAll("[data-letter]").forEach(button => {
    button.addEventListener("click", () => {
      if (state.codeLetters.length >= code.length) return;
      state.codeLetters.push(button.dataset.letter);
      clearFeedback();
      refresh();
    });
  });

  document.getElementById("eraseLetter").addEventListener("click", () => {
    state.codeLetters.pop();
    clearFeedback();
    refresh();
  });

  document.getElementById("checkCode").addEventListener("click", () => {
    checkAnswer(state.codeLetters.join(""), task.correct_answer);
  });

  refresh();
}

function renderCommandGrid(task) {
  const area = document.getElementById("taskArea");
  const data = task.content;
  const isPlan = task.renderer === "command_grid_plan";
  const isDebug = task.renderer === "command_grid_debug";
  const target = data.target || null;

  let commandsHtml = "";
  if (data.commands) {
    commandsHtml = `
      <div class="command-sequence">
        ${data.commands.map((command, index) => `
          <div class="command-chip">
            ${isDebug ? `<span class="command-number">${index + 1}</span>` : ""}
            ${commandArrow(command)}
          </div>
        `).join("")}
      </div>
    `;
  }

  area.innerHTML = `
    <div class="command-task">
      ${renderGrid(data.grid_size || 4, data.objects || {}, data.start, target)}
      ${commandsHtml}
      ${isPlan ? '<div class="target-note">🤖 → 🏁</div>' : ""}
    </div>
  `;

  renderOptions(task, value => value);
}

function renderCommandPattern(task) {
  const area = document.getElementById("taskArea");
  const commands = task.content.commands || [];
  area.innerHTML = `
    <div class="command-sequence command-pattern-row">
      ${commands.map(command => command == null
        ? '<div class="command-chip missing-command">?</div>'
        : `<div class="command-chip">${commandArrow(command)}</div>`
      ).join("")}
    </div>
  `;

  renderOptions(task, value => commandArrowFromAnswer(value));
}

function renderMemory(task) {
  const area = document.getElementById("taskArea");
  const options = document.getElementById("options");
  const instruction = document.getElementById("instruction");
  const data = task.content;
  options.innerHTML = "";

  if (task.renderer === "location_memory_grid") {
    area.innerHTML = renderGrid(data.grid_size || 3, {
      [data.position.join(",")]: data.item
    }, null, null);
  } else if (task.renderer === "pair_memory") {
    area.innerHTML = `
      <div class="memory-pairs">
        ${(data.memorize_pairs || []).map(pair => `
          <div class="memory-pair"><span>${escapeHtml(pair.item)}</span><span>↔</span><span>${escapeHtml(pair.pair)}</span></div>
        `).join("")}
      </div>
    `;
  } else {
    const items = data.memorize_items || [];
    area.innerHTML = `
      <div class="memory-items">
        ${items.map(item => `<span>${escapeHtml(item)}</span>`).join("")}
      </div>
    `;
  }

  const seconds = Number(data.display_seconds || task.time_limit_seconds || 4);
  area.insertAdjacentHTML("beforeend", `<div class="memory-timer">Zapamiętaj • ${seconds} s</div>`);

  state.memoryTimer = setTimeout(() => {
    if (sessionTasks[state.index]?.id !== task.id) return;

    instruction.textContent = data.answer_prompt || task.instruction;
    area.innerHTML = '<div class="memory-question">?</div>';

    if (task.renderer === "location_memory_grid") {
      renderLocationOptions(task);
    } else {
      renderOptions(task);
    }
  }, seconds * 1000);
}

function renderLocationOptions(task) {
  const wrap = document.getElementById("options");
  wrap.innerHTML = (task.options || []).map(value => `
    <button class="option location-option" data-value="${escapeHtml(value)}">
      ${locationSymbol(value)}
    </button>
  `).join("");

  wrap.querySelectorAll(".option").forEach(button => {
    button.addEventListener("click", () => checkAnswer(button.dataset.value, task.correct_answer, button));
  });
}

function renderFallback(task) {
  const area = document.getElementById("taskArea");
  area.innerHTML = `<div class="fallback-task">${escapeHtml(task.name || task.subcategory)}</div>`;
  renderOptions(task);
}

function renderOptions(task, formatter = null) {
  const wrap = document.getElementById("options");
  wrap.style.display = "grid";

  const options = task.options || [];
  wrap.innerHTML = options.map(option => {
    const label = formatter ? formatter(option) : option;
    return `<button class="option" data-value="${escapeHtml(option)}">${label}</button>`;
  }).join("");

  wrap.querySelectorAll(".option").forEach(button => {
    button.addEventListener("click", () => {
      checkAnswer(button.dataset.value, task.correct_answer, button);
    });
  });
}

function renderGrid(size, objects = {}, start = null, target = null) {
  const cells = [];
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const key = `${row},${col}`;
      let value = objects[key] || "";
      const isStart = start && start[0] === row && start[1] === col;
      const isTarget = target && target[0] === row && target[1] === col;

      if (isStart) value = value ? `🤖${value}` : "🤖";
      if (isTarget) value = value ? `${value}🏁` : "🏁";

      cells.push(`<div class="command-cell">${escapeHtml(value)}</div>`);
    }
  }

  return `<div class="command-grid" style="--grid-size:${size}">${cells.join("")}</div>`;
}

function plainDots(count) {
  return Array.from({ length: Number(count) || 0 }, () => '<span class="takeaway-dot"></span>').join("");
}

function takeawayDots(total, removed) {
  const totalCount = Number(total) || 0;
  const removedCount = Number(removed) || 0;

  return Array.from({ length: totalCount }, (_, index) => {
    const removedClass = index >= totalCount - removedCount ? "taken" : "";
    return `<span class="takeaway-dot ${removedClass}"></span>`;
  }).join("");
}

function commandArrow(command) {
  const map = { up: "↑", down: "↓", left: "←", right: "→" };
  return map[command] || escapeHtml(command);
}

function commandArrowFromAnswer(value) {
  const map = { up: "↑", down: "↓", left: "←", right: "→" };
  return map[value] || escapeHtml(value);
}

function locationSymbol(value) {
  const map = {
    top_left: "↖",
    top_right: "↗",
    center: "●",
    bottom_left: "↙",
    bottom_right: "↘"
  };
  return map[value] || escapeHtml(value);
}

function setupTaskSpeech() {
  const button = document.getElementById("speakTask");
  if (!button) return;

  if (!("speechSynthesis" in window)) {
    button.hidden = true;
    return;
  }

  button.addEventListener("click", speakCurrentInstruction);
}

function speakCurrentInstruction() {
  if (!("speechSynthesis" in window)) return;

  const text = document.getElementById("instruction")?.textContent?.trim();
  if (!text) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pl-PL";
  utterance.rate = 0.88;
  utterance.pitch = 1.02;

  const voices = window.speechSynthesis.getVoices();
  const polishVoice = voices.find(voice => voice.lang?.toLowerCase().startsWith("pl"));
  if (polishVoice) utterance.voice = polishVoice;

  const button = document.getElementById("speakTask");
  button?.classList.add("speaking");
  utterance.onend = () => button?.classList.remove("speaking");
  utterance.onerror = () => button?.classList.remove("speaking");

  window.speechSynthesis.speak(utterance);
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

function checkAnswer(value, correct, selectedButton = null) {
  if (String(value) === String(correct)) {
    success(selectedButton);
  } else {
    retry(selectedButton);
  }
}

function success(selectedButton = null) {
  stopCurrentTaskActivity();

  if (selectedButton) selectedButton.classList.add("correct-choice");
  showFeedback("Super! 🌟", "good");

  document.querySelectorAll("button").forEach(button => {
    button.disabled = true;
  });

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

function renderFinish() {
  stopCurrentTaskActivity();

  app.innerHTML = `
    <section class="screen centered">
      <div class="finish-card">
        <div class="big-emoji">🎉</div>
        <h1>Super, ${escapeHtml(state.name)}!</h1>
        <p>10 zadań gotowe.</p>
        <div style="height:20px"></div>
        <button class="primary" id="again">JESZCZE RAZ</button>
      </div>
    </section>
  `;

  document.getElementById("again").addEventListener("click", startNewSession);
}

loadTaskBank();
