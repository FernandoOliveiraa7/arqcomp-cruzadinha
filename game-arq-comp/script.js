// Cada palavra: resposta, linha (r), coluna (c), direção (H/V) e pista.
const WORDS = [
  {a:"MICROCONTROLADOR", r:5, c:1, d:"H", clue:"Chip único com processador, memória e portas de entrada e saída, usado em sistemas embarcados."},
  {a:"RAM", r:5, c:10, d:"V", clue:"Memória de trabalho volátil: perde o conteúdo quando a energia acaba."},
  {a:"FLASH", r:4, c:12, d:"V", clue:"Memória não volátil regravável, apagada em blocos, comum em pen drives e SSDs."},
  {a:"DUALCORE", r:1, c:3, d:"V", clue:"Processador com dois núcleos de execução no mesmo chip."},
  {a:"ADDRESSBUS", r:3, c:14, d:"V", clue:"Via que leva da CPU a posição de memória a ser lida ou escrita."},
  {a:"REGISTRADORES", r:12, c:2, d:"H", clue:"Pequenas memórias dentro do processador, as mais rápidas, que guardam dados em uso imediato."},
  {a:"CPU", r:2, c:1, d:"H", clue:"Cérebro do computador: busca, decodifica e executa as instruções dos programas."},
  {a:"QUADCORE", r:0, c:7, d:"V", clue:"Processador com quatro núcleos de execução no mesmo chip."},
  {a:"ULA", r:10, c:9, d:"V", clue:"Parte da CPU que faz as contas e as operações lógicas."},
  {a:"ROM", r:12, c:8, d:"V", clue:"Memória não volátil gravada na fabricação, com conteúdo fixo que o usuário não altera."},
  {a:"EEPROM", r:7, c:0, d:"H", clue:"Memória não volátil regravável, que apaga e escreve byte a byte, usada em pequenos dispositivos."},
  {a:"CACHE", r:2, c:6, d:"H", clue:"Memória pequena e muito rápida entre processador e RAM, guarda dados usados com frequência."},
  {a:"DATABUS", r:10, c:4, d:"H", clue:"Via que transporta o conteúdo trafegado entre CPU, memória e periféricos, nos dois sentidos."},
  {a:"DMA", r:14, c:7, d:"H", clue:"Mecanismo que move dados entre periféricos e RAM sem passar pela CPU."},
  {a:"MEMORIADEMASSA", r:1, c:16, d:"V", clue:"Guarda arquivos e programas de forma permanente, como HD e SSD, em grande capacidade."},
  {a:"UC", r:1, c:1, d:"V", clue:"Parte da CPU que interpreta instruções e coordena os demais componentes."}
];

const boardEl = document.getElementById("board");
const cells = {};          // "r,c" -> {el, input, words:[índices]}
let active = {word: null, dir: "H"};

function key(r, c) { return r + "," + c; }
function cellsOf(w) {
  return [...w.a].map((_, i) => key(w.r + (w.d === "V" ? i : 0), w.c + (w.d === "H" ? i : 0)));
}

// Numeração: ordem de leitura; casas iniciais compartilhadas recebem o mesmo número.
const starts = [...new Set(WORDS.map(w => key(w.r, w.c)))]
  .sort((x, y) => { const [r1, c1] = x.split(",").map(Number), [r2, c2] = y.split(",").map(Number); return r1 - r2 || c1 - c2; });
const numOf = {}; starts.forEach((k, i) => numOf[k] = i + 1);
WORDS.forEach(w => w.n = numOf[key(w.r, w.c)]);

function build() {
  const R = Math.max(...WORDS.map(w => w.r + (w.d === "V" ? w.a.length : 1)));
  const C = Math.max(...WORDS.map(w => w.c + (w.d === "H" ? w.a.length : 1)));
  boardEl.style.gridTemplateColumns = `repeat(${C}, var(--cell))`;
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    const div = document.createElement("div");
    div.className = "cell empty";
    boardEl.appendChild(div);
    cells[key(r, c)] = {el: div, r, c, words: [], input: null};
  }
  WORDS.forEach((w, wi) => cellsOf(w).forEach(k => cells[k].words.push(wi)));
  Object.entries(cells).forEach(([k, cell]) => {
    if (!cell.words.length) return;
    cell.el.className = "cell";
    const inp = document.createElement("input");
    inp.maxLength = 1; inp.autocomplete = "off"; inp.setAttribute("aria-label", "casa " + k);
    cell.input = inp;
    if (numOf[k]) { const s = document.createElement("span"); s.className = "num"; s.textContent = numOf[k]; cell.el.appendChild(s); }
    cell.el.appendChild(inp);
    inp.addEventListener("focus", () => select(cell));
    inp.addEventListener("click", () => select(cell, true));
    inp.addEventListener("input", () => onInput(cell));
    inp.addEventListener("keydown", e => onKey(e, cell));
  });
  const ol = {H: document.getElementById("clues-h"), V: document.getElementById("clues-v")};
  WORDS.map((w, i) => ({w, i})).sort((x, y) => x.w.n - y.w.n).forEach(({w, i}) => {
    const li = document.createElement("li");
    li.id = "clue-" + i;
    li.innerHTML = `<b>${w.n}.</b>${w.clue}`;
    li.addEventListener("click", () => { const k = cellsOf(w)[0]; active.dir = w.d; cells[k].input.focus(); });
    ol[w.d].appendChild(li);
  });
}

function wordAt(cell, dir) { return cell.words.find(i => WORDS[i].d === dir); }

function select(cell, toggle) {
  if (toggle && cell.words.length > 1 && active.cell === cell) active.dir = active.dir === "H" ? "V" : "H";
  if (wordAt(cell, active.dir) === undefined) active.dir = WORDS[cell.words[0]].d;
  active.cell = cell; active.word = wordAt(cell, active.dir);
  document.querySelectorAll(".cell.active").forEach(e => e.classList.remove("active"));
  document.querySelectorAll("li.active").forEach(e => e.classList.remove("active"));
  cellsOf(WORDS[active.word]).forEach(k => cells[k].el.classList.add("active"));
  document.getElementById("clue-" + active.word).classList.add("active");
}

function step(cell, delta) {
  const w = WORDS[active.word], ks = cellsOf(w), i = ks.indexOf(key(cell.r, cell.c)) + delta;
  if (i >= 0 && i < ks.length) cells[ks[i]].input.focus();
}

function onInput(cell) {
  const v = cell.input.value.normalize("NFD").replace(/[^A-Za-z]/g, "").toUpperCase();
  cell.input.value = v.slice(-1);
  clearMarks();
  if (v) step(cell, 1);
}

function onKey(e, cell) {
  const moves = {ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0]};
  if (moves[e.key]) {
    e.preventDefault();
    const [dr, dc] = moves[e.key];
    let r = cell.r + dr, c = cell.c + dc;
    while (cells[key(r, c)] && !cells[key(r, c)].input) { r += dr; c += dc; }
    const t = cells[key(r, c)];
    if (t && t.input) { active.dir = dr ? "V" : "H"; t.input.focus(); }
  } else if (e.key === "Backspace" && !cell.input.value) {
    e.preventDefault(); step(cell, -1);
  }
}

function clearMarks() {
  document.querySelectorAll(".cell.ok,.cell.bad,li.ok,li.bad").forEach(e => e.classList.remove("ok", "bad"));
}

function conferir() {
  clearMarks();
  let certas = 0;
  const okCells = new Set();
  const status = WORDS.map(w => {
    const ok = cellsOf(w).every((k, i) => cells[k].input.value === w.a[i]);
    if (ok) { certas++; cellsOf(w).forEach(k => okCells.add(k)); }
    return ok;
  });
  WORDS.forEach((w, i) => {
    document.getElementById("clue-" + i).classList.add(status[i] ? "ok" : "bad");
    if (!status[i]) cellsOf(w).forEach(k => {
      if (!okCells.has(k) && cells[k].input.value) cells[k].el.classList.add("bad");
    });
  });
  okCells.forEach(k => cells[k].el.classList.add("ok"));
  document.getElementById("contador").textContent = `${certas} de ${WORDS.length} palavras`;
}

function reiniciar() {
  Object.values(cells).forEach(c => { if (c.input) c.input.value = ""; });
  clearMarks();
  document.querySelectorAll(".active").forEach(e => e.classList.remove("active"));
  document.getElementById("contador").textContent = `0 de ${WORDS.length} palavras`;
}

build();
document.getElementById("contador").textContent = `0 de ${WORDS.length} palavras`;
document.getElementById("btn-conferir").addEventListener("click", conferir);
document.getElementById("btn-reiniciar").addEventListener("click", reiniciar);