const latinInput = document.getElementById('latinInput');
const mongolianOutput = document.getElementById('mongolianOutput');
const verticalPreview = document.getElementById('verticalImePreview');
const codepointsOutput = document.getElementById('imeCodepoints');
const debugOutput = document.getElementById('imeDebug');
const ruleRows = document.getElementById('ruleRows');
const copyMongolianBtn = document.getElementById('copyMongolian');
const copyCodepointsBtn = document.getElementById('copyImeCodepoints');
const sendToTools = document.getElementById('sendToTools');

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
  mongol: 'ᠮᠣᠩᠭᠣᠯ',
  bichig: 'ᠪᠢᠴᠢᠭ',
  ger: 'ᠭᠡᠷ',
  mori: 'ᠮᠣᠷᠢ',
  nom: 'ᠨᠣᠮ',
  sain: 'ᠰᠠᠢᠨ',
  baina: 'ᠪᠠᠢᠨᠠ'
};

const sortedRules = [...IME_RULES].sort((a, b) => b[0].length - a[0].length);

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

function transliterateWord(word) {
  const lower = word.toLowerCase();
  if (DICTIONARY[lower]) {
    return {
      text: DICTIONARY[lower],
      tokens: [{ input: word, output: DICTIONARY[lower], type: 'dictionary' }]
    };
  }

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
      tokens.push({ input: original, output: original, type: 'raw' });
      i += 1;
    }
  }
  return { text: result, tokens };
}

function transliterateText(value) {
  const parts = value.match(/[A-Za-zöüÖÜ]+|[^A-Za-zöüÖÜ]+/g) || [];
  const allTokens = [];
  const out = parts.map(part => {
    if (/^[A-Za-zöüÖÜ]+$/.test(part)) {
      const converted = transliterateWord(part);
      allTokens.push(...converted.tokens);
      return converted.text;
    }
    allTokens.push({ input: part, output: part, type: 'separator' });
    return part;
  }).join('');
  return { text: out, tokens: allTokens };
}

function renderRules() {
  ruleRows.innerHTML = IME_RULES.map(([latin, mongolian, code, note]) => `
    <tr><td><code>${escapeHtml(latin)}</code></td><td class="cp-char">${escapeHtml(mongolian)}</td><td><code>${escapeHtml(code)}</code></td><td>${escapeHtml(note)}</td></tr>
  `).join('');
}

function renderIme() {
  const converted = transliterateText(latinInput.value);
  mongolianOutput.textContent = converted.text || 'ᠮᠣᠩᠭᠣᠯ';
  verticalPreview.textContent = converted.text || 'ᠮᠣᠩᠭᠣᠯ';
  const cps = toCodepoints(converted.text);
  codepointsOutput.textContent = cps.join(' ');
  debugOutput.innerHTML = converted.tokens.map(token => `
    <span class="debug-token ${token.type === 'dictionary' ? 'control' : ''}">
      ${escapeHtml(token.output)}<small>${escapeHtml(token.input)} · ${token.type}</small>
    </span>
  `).join('');
  sendToTools.href = 'tools.html?text=' + encodeURIComponent(converted.text);
}

document.getElementById('sampleMongol').addEventListener('click', () => { latinInput.value = 'mongol'; renderIme(); });
document.getElementById('sampleBichig').addEventListener('click', () => { latinInput.value = 'bichig'; renderIme(); });
document.getElementById('sampleSentence').addEventListener('click', () => { latinInput.value = 'sain baina, mongol bichig'; renderIme(); });
document.getElementById('clearIme').addEventListener('click', () => { latinInput.value = ''; renderIme(); });
copyMongolianBtn.addEventListener('click', event => copyText(mongolianOutput.textContent, event.currentTarget));
copyCodepointsBtn.addEventListener('click', event => copyText(codepointsOutput.textContent, event.currentTarget));
latinInput.addEventListener('input', renderIme);

renderRules();
renderIme();
