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
  gridSelection: [],
  searchSelection: [],
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

  const allowed = taskBank.filter(task => {
    if (task.status === "archived") return false;
    if (task.category === "memory") return false;
    return ["math", "logic", "coding"].includes(task.category);
  });

  const picked = [];

  ["math", "logic"].forEach(category => {
    const allInCategory = allowed.filter(task => task.category === category);
    let candidates = allInCategory.filter(task => !previous.has(task.id));
    if (candidates.length < 4) candidates = allInCategory;
    picked.push(...shuffle(candidates).slice(0, 4));
  });

  const codingAll = allowed.filter(task => task.category === "coding");
  let codingCandidates = codingAll.filter(task => !previous.has(task.id));
  if (codingCandidates.length < 2) codingCandidates = codingAll;

  const visualCoding = shuffle(codingCandidates.filter(task => task.subcategory !== "path_code"));
  const pathCoding = shuffle(codingCandidates.filter(task => task.subcategory === "path_code"));

  const codingPicked = [];
  if (visualCoding.length) codingPicked.push(visualCoding.shift());

  const secondPool = shuffle([
    ...visualCoding,
    ...(Math.random() < 0.35 ? pathCoding.slice(0, 1) : [])
  ]);
  if (secondPool.length) codingPicked.push(secondPool[0]);

  if (codingPicked.length < 2) {
    codingPicked.push(...shuffle(codingCandidates.filter(t => !codingPicked.some(p => p.id === t.id))).slice(0, 2 - codingPicked.length));
  }

  picked.push(...codingPicked.slice(0, 2));

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
  stopInstructionAudio();
}

function renderTask() {
  stopCurrentTaskActivity();

  if (state.index >= sessionTasks.length) {
    renderFinish();
    return;
  }

  state.codeLetters = [];
  state.gridSelection = [];
  state.searchSelection = [];
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
          <button class="speak-btn" id="speakTask" type="button" aria-label="Przeczytaj instrukcję" hidden>🔊</button>
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
    sudoku_grid: renderSudoku,
    color_grid_copy: renderColorGridCopy,
    visual_search: renderVisualSearch,
    binary_grid_copy: renderBinaryGridCopy,
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
    const total = Number(data.left) || 0;
    const targetRemoved = Number(data.right) || 0;

    area.innerHTML = `
      <div class="math-stack">
        <div class="equation">${escapeHtml(data.expression)} = ?</div>
        <div class="hint-card count-hint interactive-hint">
          <div class="hint-label">Podpowiedź</div>
          <div class="hint-instruction">Odznacz <strong>${targetRemoved}</strong> kropek.</div>
          <div class="interactive-dots" id="subtractionDots">
            ${interactiveDots(total)}
          </div>
          <div class="dot-status">
            <span>Odjęto: <strong id="removedCount">0</strong> z ${targetRemoved}</span>
            <span id="remainingResult" class="remaining-result visible">Zostało: ${total}</span>
          </div>
        </div>
      </div>
    `;

    setupSubtractionDots(total, targetRemoved);
  } else {
    area.innerHTML = `
      <div class="math-stack">
        <div class="equation">${escapeHtml(data.expression)} = ?</div>
        <div class="hint-card count-hint">
          <div class="hint-label">Podpowiedź</div>
          <div class="addition-dots">
            <div class="dot-group">
              <div class="dot-group-label">${escapeHtml(data.left)}</div>
              <div class="count-dots">${plainDots(data.left)}</div>
            </div>
            <div class="dot-operator">+</div>
            <div class="dot-group">
              <div class="dot-group-label">${escapeHtml(data.right)}</div>
              <div class="count-dots">${plainDots(data.right)}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderOptions(task);
}

function setupSubtractionDots(total, targetRemoved) {
  const wrap = document.getElementById("subtractionDots");
  const removedLabel = document.getElementById("removedCount");
  const resultLabel = document.getElementById("remainingResult");
  if (!wrap) return;

  let removed = 0;

  wrap.querySelectorAll(".interactive-dot").forEach(dot => {
    dot.addEventListener("click", () => {
      const isRemoved = dot.classList.contains("removed");

      if (isRemoved) {
        dot.classList.remove("removed");
        removed -= 1;
      } else if (removed < targetRemoved) {
        dot.classList.add("removed");
        removed += 1;
      }

      removedLabel.textContent = String(removed);

      resultLabel.textContent = `Zostało: ${total - removed}`;
      resultLabel.classList.add("visible");
    });
  });
}

function interactiveDots(count) {
  return Array.from({ length: Number(count) || 0 }, (_, index) =>
    `<button class="interactive-dot" type="button" aria-label="Kropka ${index + 1}"></button>`
  ).join("");
}

function renderMissingEquation(task) {
  const area = document.getElementById("taskArea");
  const data = task.content;
  const expression = escapeHtml(data.expression).replace("?", '<span class="inline-missing">?</span>');

  area.innerHTML = `
    <div class="math-stack">
      <div class="equation missing-equation">${expression}</div>
      <div class="hint-card count-hint interactive-hint" id="missingHint"></div>
    </div>
  `;

  renderMissingNumberHint(task);
  renderOptions(task);
}

function renderMissingNumberHint(task) {
  const hint = document.getElementById("missingHint");
  const data = task.content;
  if (!hint) return;

  const expression = String(data.expression || "");

  // a + ? = result
  if (expression.includes("+") && data.missing === "b") {
    const start = Number(data.a) || 0;
    const result = Number(data.result) || 0;
    const needed = Math.max(0, result - start);

    hint.innerHTML = `
      <div class="hint-label">Podpowiedź</div>
      <div class="hint-instruction">Dodawaj kropki, aż suma będzie równa ${result}.</div>
      <div class="missing-add-wrap">
        <div class="dot-group">
          <div class="dot-group-label">Masz: ${start}</div>
          <div class="count-dots fixed-dots">${plainDots(start)}</div>
        </div>
        <div class="dot-group">
          <div class="dot-group-label">Dodaj</div>
          <div class="interactive-dots add-dots" id="missingAddDots">${interactiveDots(needed)}</div>
        </div>
      </div>
      <div class="dot-status live-math-status">
        <span>Dodano: <strong id="addedCount">0</strong></span>
        <span id="sumCount" class="remaining-result visible">Suma: ${start}</span>
      </div>
    `;

    let added = 0;
    hint.querySelectorAll("#missingAddDots .interactive-dot").forEach(dot => {
      dot.classList.add("empty");
      dot.addEventListener("click", () => {
        const filled = dot.classList.contains("filled");
        if (filled) {
          dot.classList.remove("filled");
          dot.classList.add("empty");
          added -= 1;
        } else {
          dot.classList.add("filled");
          dot.classList.remove("empty");
          added += 1;
        }
        document.getElementById("addedCount").textContent = String(added);
        document.getElementById("sumCount").textContent = `Suma: ${start + added}`;
      });
    });
    return;
  }
  // ? + b = result
  if (expression.includes("+") && data.missing === "a") {
    const known = Number(data.b) || 0;
    const result = Number(data.result) || 0;
    const needed = Math.max(0, result - known);

    hint.innerHTML = `
      <div class="hint-label">Podpowiedź</div>
      <div class="hint-instruction">Do ${known} dodawaj kropki, aż suma będzie równa ${result}.</div>
      <div class="missing-add-wrap">
        <div class="dot-group">
          <div class="dot-group-label">Masz: ${known}</div>
          <div class="count-dots fixed-dots">${plainDots(known)}</div>
        </div>
        <div class="dot-group">
          <div class="dot-group-label">Dodaj</div>
          <div class="interactive-dots add-dots" id="missingAddDots">${interactiveDots(needed)}</div>
        </div>
      </div>
      <div class="dot-status live-math-status">
        <span>Dodano: <strong id="addedCount">0</strong></span>
        <span id="sumCount" class="remaining-result visible">Suma: ${known}</span>
      </div>
    `;

    let added = 0;
    hint.querySelectorAll("#missingAddDots .interactive-dot").forEach(dot => {
      dot.classList.add("empty");
      dot.addEventListener("click", () => {
        const filled = dot.classList.contains("filled");
        if (filled) {
          dot.classList.remove("filled");
          dot.classList.add("empty");
          added -= 1;
        } else {
          dot.classList.add("filled");
          dot.classList.remove("empty");
          added += 1;
        }
        document.getElementById("addedCount").textContent = String(added);
        document.getElementById("sumCount").textContent = `Suma: ${known + added}`;
      });
    });
    return;
  }
  // a - ? = result
  if (expression.includes("-") && data.missing === "b") {
    const start = Number(data.a) || 0;
    const result = Number(data.result) || 0;
    const targetRemoved = Math.max(0, start - result);

    hint.innerHTML = `
      <div class="hint-label">Podpowiedź</div>
      <div class="hint-instruction">Odznaczaj kropki, aż zostanie ${result}.</div>
      <div class="interactive-dots" id="missingSubtractDots">${interactiveDots(start)}</div>
      <div class="dot-status">
        <span>Odjęto: <strong id="missingRemovedCount">0</strong></span>
        <span id="missingSubtractResult" class="remaining-result visible">Zostało: ${start}</span>
      </div>
    `;

    let removed = 0;
    hint.querySelectorAll("#missingSubtractDots .interactive-dot").forEach(dot => {
      dot.addEventListener("click", () => {
        const isRemoved = dot.classList.contains("removed");
        if (isRemoved) {
          dot.classList.remove("removed");
          removed -= 1;
        } else if (start - removed > result) {
          dot.classList.add("removed");
          removed += 1;
        }

        document.getElementById("missingRemovedCount").textContent = String(removed);
        const resultLabel = document.getElementById("missingSubtractResult");
        resultLabel.textContent = `Zostało: ${start - removed}`;
        resultLabel.classList.add("visible");
      });
    });
    return;
  }

  // ? - b = result
  if (expression.includes("-") && data.missing === "a") {
    const removed = Number(data.b) || 0;
    const result = Number(data.result) || 0;

    hint.innerHTML = `
      <div class="hint-label">Podpowiedź</div>
      <div class="hint-instruction">Po odjęciu ${removed} zostało ${result}. Policz wszystkie kropki razem.</div>
      <div class="reverse-subtraction">
        <div>
          <div class="mini-label">Zostało</div>
          <div class="count-dots">${plainDots(result)}</div>
        </div>
        <div>
          <div class="mini-label">Odjęto</div>
          <div class="count-dots removed-group">${removedDots(removed)}</div>
        </div>
      </div>
    `;
    return;
  }

  hint.innerHTML = `
    <div class="hint-label">Podpowiedź</div>
    <div class="hint-instruction">Policz elementy krok po kroku.</div>
  `;
}

function removedDots(count) {
  return Array.from({ length: Number(count) || 0 }, () => '<span class="takeaway-dot taken"></span>').join("");
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
  const size = Number(task.content.size) || Math.sqrt(grid.length) || 4;

  area.innerHTML = `
    <div class="sudoku sudoku-dynamic" style="--sudoku-size:${size}">
      ${grid.map(value => `<div class="sudoku-cell ${value == null ? "missing-cell" : ""}">${value == null ? "?" : escapeHtml(value)}</div>`).join("")}
    </div>
  `;
  renderOptions(task);
}

function renderBinaryGridCopy(task) {
  const area = document.getElementById("taskArea");
  const wrap = document.getElementById("options");
  const rows = Number(task.content.rows) || 4;
  const columns = Number(task.content.columns) || 4;
  const pattern = task.content.pattern || [];
  state.gridSelection = Array(pattern.length).fill(0);

  area.innerHTML = `
    <div class="copy-grid-task">
      <div>
        <div class="pattern-label">WZÓR</div>
        ${renderBinaryGrid(pattern, rows, columns, false)}
      </div>
      <div class="copy-arrow">→</div>
      <div>
        <div class="pattern-label">TWÓJ KOD</div>
        ${renderBinaryGrid(state.gridSelection, rows, columns, true)}
      </div>
    </div>
  `;

  wrap.style.display = "block";
  wrap.innerHTML = '<button class="check-btn" id="checkGridCopy">SPRAWDŹ</button>';

  area.querySelectorAll(".binary-cell.editable").forEach((cell,index) => {
    cell.addEventListener("click", () => {
      state.gridSelection[index] = state.gridSelection[index] ? 0 : 1;
      cell.classList.toggle("filled", Boolean(state.gridSelection[index]));
      clearFeedback();
    });
  });

  document.getElementById("checkGridCopy").addEventListener("click", () => {
    const ok = pattern.every((value,index) => Number(value) === Number(state.gridSelection[index] || 0));
    if (ok) success(); else retry();
  });
}

function renderBinaryGrid(values, rows, columns, editable) {
  return `<div class="binary-grid" style="--copy-columns:${columns}">${values.map((value,index) =>
    `<button type="button" class="binary-cell ${value ? "filled" : ""} ${editable ? "editable" : ""}" ${editable ? "" : "disabled"} aria-label="Pole ${index + 1}"></button>`
  ).join("")}</div>`;
}

function renderColorGridCopy(task) {
  const area = document.getElementById("taskArea");
  const wrap = document.getElementById("options");
  const rows = Number(task.content.rows) || 4;
  const columns = Number(task.content.columns) || 4;
  const pattern = task.content.pattern || [];
  const colors = task.content.colors || ["b","y"];
  state.gridSelection = Array(pattern.length).fill("w");

  area.innerHTML = `
    <div class="color-copy-layout">
      <div>
        <div class="pattern-label">WZÓR</div>
        ${renderColorGrid(pattern, columns, false)}
      </div>
      <div>
        <div class="pattern-label">TWÓJ WZÓR</div>
        ${renderColorGrid(state.gridSelection, columns, true)}
      </div>
    </div>
  `;

  wrap.style.display = "block";
  wrap.innerHTML = `
    <div class="color-palette">
      ${colors.map(color => `<button class="color-choice color-${color}" data-color="${color}" aria-label="Kolor"></button>`).join("")}
      <button class="color-choice color-w selected" data-color="w" aria-label="Gumka"></button>
    </div>
    <button class="check-btn" id="checkColorGrid">SPRAWDŹ</button>
  `;

  let selectedColor = "w";
  wrap.querySelectorAll(".color-choice").forEach(button => {
    button.addEventListener("click", () => {
      selectedColor = button.dataset.color;
      wrap.querySelectorAll(".color-choice").forEach(b => b.classList.toggle("selected", b === button));
    });
  });

  area.querySelectorAll(".color-grid-cell.editable").forEach((cell,index) => {
    cell.addEventListener("click", () => {
      state.gridSelection[index] = selectedColor;
      cell.className = `color-grid-cell editable color-${selectedColor}`;
      clearFeedback();
    });
  });

  document.getElementById("checkColorGrid").addEventListener("click", () => {
    const ok = pattern.every((value,index) => value === state.gridSelection[index]);
    if (ok) success(); else retry();
  });
}

function renderColorGrid(values, columns, editable) {
  return `<div class="color-grid" style="--copy-columns:${columns}">${values.map((value,index) =>
    `<button type="button" class="color-grid-cell color-${value} ${editable ? "editable" : ""}" ${editable ? "" : "disabled"} aria-label="Pole ${index + 1}"></button>`
  ).join("")}</div>`;
}

function renderVisualSearch(task) {
  const area = document.getElementById("taskArea");
  const wrap = document.getElementById("options");
  const rows = Number(task.content.rows) || 5;
  const columns = Number(task.content.columns) || 5;
  const grid = task.content.grid || [];
  const target = task.content.target || [];
  const correct = (task.content.correct_positions || []).map(Number);
  state.searchSelection = [];

  area.innerHTML = `
    <div class="visual-search-task">
      <div class="search-target">
        <span class="mini-label">ZNAJDŹ</span>
        <div class="target-sequence">${target.map(v => `<span>${escapeHtml(v)}</span>`).join("")}</div>
      </div>
      <div class="search-grid" style="--search-columns:${columns}">
        ${grid.map((value,index) => `<button class="search-cell" data-index="${index}">${escapeHtml(value)}</button>`).join("")}
      </div>
    </div>
  `;

  wrap.style.display = "block";
  wrap.innerHTML = '<button class="check-btn" id="checkVisualSearch">SPRAWDŹ</button>';

  area.querySelectorAll(".search-cell").forEach(cell => {
    cell.addEventListener("click", () => {
      const index = Number(cell.dataset.index);
      const existing = state.searchSelection.indexOf(index);
      if (existing >= 0) {
        state.searchSelection.splice(existing,1);
        cell.classList.remove("selected");
      } else {
        if (state.searchSelection.length >= target.length) {
          const removed = state.searchSelection.shift();
          area.querySelector(`.search-cell[data-index="${removed}"]`)?.classList.remove("selected");
        }
        state.searchSelection.push(index);
        cell.classList.add("selected");
      }
      clearFeedback();
    });
  });

  document.getElementById("checkVisualSearch").addEventListener("click", () => {
    const selected=[...state.searchSelection].sort((a,b)=>a-b);
    const expected=[...correct].sort((a,b)=>a-b);
    const ok=selected.length===expected.length && selected.every((v,i)=>v===expected[i]);
    if(ok) success(); else retry();
  });
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

      const classes = [
        "command-cell",
        isStart ? "start-cell" : "",
        isTarget ? "target-cell" : ""
      ].filter(Boolean).join(" ");

      const badge = isStart
        ? '<span class="cell-badge">START</span>'
        : (isTarget ? '<span class="cell-badge">CEL</span>' : "");

      cells.push(`<div class="${classes}">${badge}<span class="cell-content">${escapeHtml(value)}</span></div>`);
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

const INSTRUCTION_AUDIO = {
  "Oblicz działanie.": "audio/oblicz-dzialanie.mp3",
  "Jaka liczba pasuje w wyróżnione miejsce?": "audio/jaka-liczba-pasuje.mp3",
  "Jaka liczba powinna być dalej?": "audio/jaka-liczba-dalej.mp3",
  "Która liczba jest większa?": "audio/ktora-liczba-wieksza.mp3",
  "Co będzie dalej?": "audio/co-bedzie-dalej.mp3",
  "Co nie pasuje?": "audio/co-nie-pasuje.mp3",
  "Który element jest owocem?": "audio/ktory-element-owocem.mp3",
  "Który element jest ubraniem?": "audio/ktory-element-ubraniem.mp3",
  "Który element jest pojazdem?": "audio/ktory-element-pojazdem.mp3",
  "Czego brakuje?": "audio/czego-brakuje.mp3",
  "Jaka liczba pasuje w puste pole?": "audio/jaka-liczba-puste-pole.mp3",
  "Odczytaj słowo i wybierz litery.": "audio/odczytaj-slowo.mp3",
  "Wykonaj komendy i wybierz, do czego dotrze robot.": "audio/wykonaj-komendy.mp3",
  "Gdzie dotrze robot?": "audio/gdzie-dotrze-robot.mp3",
  "Które komendy doprowadzą robota do celu?": "audio/ktore-komendy.mp3",
  "Która komenda jest błędna?": "audio/ktora-komenda-bledna.mp3",
  "Jaka komenda powinna być dalej?": "audio/jaka-komenda-dalej.mp3",
  "Odtwórz kod na pustej siatce.": "audio/odtworz-kod.mp3",
  "Pokoloruj pustą siatkę tak samo.": "audio/pokoloruj-siatke.mp3",
  "Znajdź na planszy taki sam układ.": "audio/znajdz-uklad.mp3",
  "Które strzałki prowadzą do celu?": "audio/ktore-strzalki.mp3"
};

let instructionAudio = null;

function setupTaskSpeech() {
  const button = document.getElementById("speakTask");
  const instruction = document.getElementById("instruction")?.textContent?.trim();
  if (!button || !instruction) return;

  const audioUrl = INSTRUCTION_AUDIO[instruction];
  if (!audioUrl) {
    button.hidden = true;
    return;
  }

  const audio = new Audio(audioUrl);
  audio.preload = "metadata";

  audio.addEventListener("canplaythrough", () => {
    button.hidden = false;
  }, { once: true });

  audio.addEventListener("error", () => {
    button.hidden = true;
  }, { once: true });

  button.addEventListener("click", () => {
    stopInstructionAudio();
    instructionAudio = new Audio(audioUrl);
    button.classList.add("speaking");
    instructionAudio.addEventListener("ended", () => button.classList.remove("speaking"), { once: true });
    instructionAudio.addEventListener("error", () => button.classList.remove("speaking"), { once: true });
    instructionAudio.play().catch(() => button.classList.remove("speaking"));
  });
}

function stopInstructionAudio() {
  if (!instructionAudio) return;
  instructionAudio.pause();
  instructionAudio.currentTime = 0;
  instructionAudio = null;
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
