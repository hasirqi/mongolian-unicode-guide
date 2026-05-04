const latinInput = document.getElementById('latinInput');
const mongolianOutput = document.getElementById('mongolianOutput');
const verticalPreview = document.getElementById('verticalImePreview');
const codepointsOutput = document.getElementById('imeCodepoints');
const debugOutput = document.getElementById('imeDebug');
const ruleRows = document.getElementById('ruleRows');
const copyMongolianBtn = document.getElementById('copyMongolian');
const copyCodepointsBtn = document.getElementById('copyImeCodepoints');
const sendToTools = document.getElementById('sendToTools');
const candidateList = document.getElementById('candidateList');

const IME_RULES = [
  ['ch', 'ᠴ', 'U+1834', 'CHA'],
  ['sh', 'ᠱ', 'U+1831', 'SHA'],
  ['ng', 'ᠩ', 'U+1829', 'ANG'],
  ['oe', 'ᠥ', 'U+1825', 'OE'],
  ['ö', 'ᠥ', 'U+1825', 'OE'],
  ['ue', 'ᠦ', 'U+1826', 'UE'],
  ['ü', 'ᠦ', 'U+1826', 'UE'],
  ['aa', 'ᠠᠠ', 'U+1820 U+1820', 'experimental long A'],
  ['ee', 'ᠡᠡ', 'U+1821 U+1821', 'experimental long E'],
  ['ii', 'ᠢᠢ', 'U+1822 U+1822', 'experimental long I'],
  ['oo', 'ᠣᠣ', 'U+1823 U+1823', 'experimental long O'],
  ['uu', 'ᠤᠤ', 'U+1824 U+1824', 'experimental long U'],
  ['a', 'ᠠ', 'U+1820', 'A'],
  ['e', 'ᠡ', 'U+1821', 'E'],
  ['i', 'ᠢ', 'U+1822', 'I'],
  ['o', 'ᠣ', 'U+1823', 'O'],
  ['u', 'ᠤ', 'U+1824', 'U'],
  ['n', 'ᠨ', 'U+1828', 'NA'],
  ['b', 'ᠪ', 'U+182A', 'BA'],
  ['p', 'ᠫ', 'U+182B', 'PA'],
  ['q', 'ᠬ', 'U+182C', 'QA'],
  ['g', 'ᠭ', 'U+182D', 'GA'],
  ['m', 'ᠮ', 'U+182E', 'MA'],
  ['l', 'ᠯ', 'U+182F', 'LA'],
  ['s', 'ᠰ', 'U+1830', 'SA'],
  ['t', 'ᠲ', 'U+1832', 'TA'],
  ['d', 'ᠳ', 'U+1833', 'DA'],
  ['j', 'ᠵ', 'U+1835', 'JA'],
  ['y', 'ᠶ', 'U+1836', 'YA'],
  ['r', 'ᠷ', 'U+1837', 'RA'],
  ['w', 'ᠸ', 'U+1838', 'WA'],
  ['f', 'ᠹ', 'U+1839', 'FA'],
  ['k', 'ᠺ', 'U+183A', 'KA'],
  ['h', 'ᠾ', 'U+183E', 'HAA'],
  ['z', 'ᠽ', 'U+183D', 'ZA'],
  ['c', 'ᠼ', 'U+183C', 'TSA'],
  ['x', 'ᠱ', 'U+1831', 'temporary fallback: SHA']
];

const DICTIONARY = {
  mongol: { text: 'ᠮᠣᠩᠭᠣᠯ', note: 'dictionary: Mongol' },
  monggol: { text: 'ᠮᠣᠩᠭᠣᠯ', note: 'dictionary: common doubled-g spelling' },
  bichig: { text: 'ᠪᠢᠴᠢᠭ', note: 'dictionary: writing/script' },
  ger: { text: 'ᠭᠡᠷ', note: 'dictionary: ger' },
  mori: { text: 'ᠮᠣᠷᠢ', note: 'dictionary: horse' },
  nom: { text: 'ᠨᠣᠮ', note: 'dictionary: book' },
  sain: { text: 'ᠰᠠᠢᠨ', note: 'dictionary: good/hello' },
  baina: { text: 'ᠪᠠᠢᠨᠠ', note: 'dictionary: be/exist' },
  mini: { text: 'ᠮᠢᠨᠢ', note: 'dictionary: my' },
  bi: { text: 'ᠪᠢ', note: 'dictionary: I' },
  ta: { text: 'ᠲᠠ', note: 'dictionary: you' }
};

const FUZZY_ALIASES = {
  menggu: 'mongol',
  mngol: 'mongol',
  monggul: 'mongol',
  monggvl: 'mongol',
  bicig: 'bichig',
  bichik: 'bichig',
  sayn: 'sain',
  sainu: 'sain',
  bna: 'baina'
};

const sortedRules = [...IME_RULES].sort((a, b) => b[0].length - a[0].length);
let activeCandidate = null;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function toCodepoints(value) {
  return Array.from(value).map(ch => 'U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'));
}

function flashCopied(button) {
  if (!button) return;
  const old = button.textContent;
  button.textContent = '已复制';
  button.classList.add('copied');
  setTimeout(() => {
    button.textContent = old;
    button.classList.remove('copied');
  }, 1200);
}

function copyText(value, button) {
  navigator.clipboard?.writeText(value).then(() => flashCopied(button)).catch(() => flashCopied(button));
}

function transliterateWordByRules(word) {
  const lower = word.toLowerCase();
  let i = 0;
  let result = '';
  const tokens = [];
  while (i < word.length) {
    const rest = lower.slice(i);
    const matched = sortedRules.find(([latin]) => rest.startsWith(latin));
    if (matched) {
      const [latin, mongolian] = matched;
      const original = word.slice(i, i + latin.length);
      result += mongolian;
      tokens.push({ input: original, output: mongolian, type: 'rule' });
      i += latin.length;
    } else {
      const original = word[i];
      result += original;
      tokens.push({ input: original, output: original, type: 'unknown' });
      i += 1;
    }
  }
  return { text: result, tokens };
}

function convertParts(value, resolver) {
  const parts = value.match(/[A-Za-zöüÖÜ]+|[^A-Za-zöüÖÜ]+/g) || [];
  const allTokens = [];
  const out = parts.map(part => {
    if (/^[A-Za-zöüÖÜ]+$/.test(part)) {
      const converted = resolver(part);
      allTokens.push(...converted.tokens);
      return converted.text;
    }
    allTokens.push({ input: part, output: part, type: 'separator' });
    return part;
  }).join('');
  return { text: out, tokens: allTokens };
}

function dictionaryResolver(word) {
  const lower = word.toLowerCase();
  if (DICTIONARY[lower]) return { text: DICTIONARY[lower].text, tokens: [{ input: word, output: DICTIONARY[lower].text, type: 'dictionary' }] };
  if (FUZZY_ALIASES[lower] && DICTIONARY[FUZZY_ALIASES[lower]]) {
    const key = FUZZY_ALIASES[lower];
    return { text: DICTIONARY[key].text, tokens: [{ input: word, output: DICTIONARY[key].text, type: 'fuzzy' }] };
  }
  return transliterateWordByRules(word);
}

function ruleResolver(word) {
  return transliterateWordByRules(word);
}

function buildCandidates(value) {
  const trimmed = value.trim();
  if (!trimmed) return [];
  const candidates = [];
  const dict = convertParts(value, dictionaryResolver);
  candidates.push({ id: 'smart', label: '智能推荐', text: dict.text, confidence: 95, source: '词典 + 模糊推测 + 规则兜底', explanation: '优先识别常用词和近似拼写，未知部分按最长匹配规则转换。', tokens: dict.tokens });
  const rule = convertParts(value, ruleResolver);
  if (rule.text !== dict.text) candidates.push({ id: 'rule', label: '规则直转', text: rule.text, confidence: 72, source: '基础转写规则', explanation: '不使用词典，只根据当前映射表机械转换，适合调试。', tokens: rule.tokens });
  const normalized = value.toLowerCase().replace(/gg/g, 'g').replace(/v/g, 'u');
  if (normalized !== value.toLowerCase()) {
    const norm = convertParts(normalized, dictionaryResolver);
    if (!candidates.some(c => c.text === norm.text)) candidates.push({ id: 'normalized', label: '容错候选', text: norm.text, confidence: 66, source: '输入归一化', explanation: `将输入临时归一化为 ${normalized} 后生成，用于处理重复字母或键盘习惯差异。`, tokens: norm.tokens });
  }
  return candidates.slice(0, 4);
}

function renderRules() {
  ruleRows.innerHTML = IME_RULES.map(([latin, mongolian, code, note]) => `
    <tr><td><code>${escapeHtml(latin)}</code></td><td class="cp-char">${escapeHtml(mongolian)}</td><td><code>${escapeHtml(code)}</code></td><td>${escapeHtml(note)}</td></tr>
  `).join('');
}

function renderCandidateList(candidates) {
  candidateList.innerHTML = candidates.map((candidate, index) => `
    <article class="card candidate-card ${index === 0 ? 'active-candidate' : ''}" data-candidate-index="${index}">
      <div class="candidate-head"><h3>${escapeHtml(candidate.label)}</h3><span>${candidate.confidence}%</span></div>
      <div class="candidate-text" lang="mn-Mong">${escapeHtml(candidate.text)}</div>
      <p><strong>来源：</strong>${escapeHtml(candidate.source)}</p>
      <p>${escapeHtml(candidate.explanation)}</p>
      <button class="tool-button mini" data-use-candidate="${index}">使用这个候选</button>
    </article>
  `).join('');
}

function applyCandidate(candidate) {
  activeCandidate = candidate;
  mongolianOutput.textContent = candidate?.text || 'ᠮᠣᠩᠭᠣᠯ';
  verticalPreview.textContent = candidate?.text || 'ᠮᠣᠩᠭᠣᠯ';
  const cps = toCodepoints(candidate?.text || '');
  codepointsOutput.textContent = cps.join(' ');
  debugOutput.innerHTML = (candidate?.tokens || []).map(token => `
    <span class="debug-token ${token.type === 'dictionary' || token.type === 'fuzzy' ? 'control' : ''}">
      ${escapeHtml(token.output)}<small>${escapeHtml(token.input)} · ${token.type}</small>
    </span>
  `).join('');
  sendToTools.href = 'tools.html?text=' + encodeURIComponent(candidate?.text || '');
}

function renderIme() {
  const candidates = buildCandidates(latinInput.value);
  renderCandidateList(candidates);
  applyCandidate(candidates[0] || { text: '', tokens: [] });
}

document.getElementById('sampleMongol').addEventListener('click', () => { latinInput.value = 'monggol'; renderIme(); });
document.getElementById('sampleBichig').addEventListener('click', () => { latinInput.value = 'bichig'; renderIme(); });
document.getElementById('sampleSentence').addEventListener('click', () => { latinInput.value = 'sain baina, mini monggol bichig'; renderIme(); });
document.getElementById('clearIme').addEventListener('click', () => { latinInput.value = ''; renderIme(); });
copyMongolianBtn.addEventListener('click', event => copyText(mongolianOutput.textContent, event.currentTarget));
copyCodepointsBtn.addEventListener('click', event => copyText(codepointsOutput.textContent, event.currentTarget));
latinInput.addEventListener('input', renderIme);
candidateList.addEventListener('click', event => {
  const button = event.target.closest('[data-use-candidate]');
  const card = event.target.closest('[data-candidate-index]');
  const index = Number(button?.dataset.useCandidate ?? card?.dataset.candidateIndex);
  const candidates = buildCandidates(latinInput.value);
  if (!Number.isNaN(index) && candidates[index]) {
    candidateList.querySelectorAll('.candidate-card').forEach(el => el.classList.remove('active-candidate'));
    const chosen = candidateList.querySelector(`[data-candidate-index="${index}"]`);
    chosen?.classList.add('active-candidate');
    applyCandidate(candidates[index]);
  }
});

renderRules();
renderIme();
