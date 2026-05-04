const input = document.getElementById('inputText');
const rows = document.getElementById('codepointRows');
const seq = document.getElementById('sequenceOutput');
const debugView = document.getElementById('debugView');
const previewGrid = document.getElementById('previewGrid');
const charCount = document.getElementById('charCount');
const codepointCount = document.getElementById('codepointCount');
const controlCount = document.getElementById('controlCount');
const specialBadges = document.getElementById('specialBadges');
const fontSize = document.getElementById('fontSize');
const letterSpacing = document.getElementById('letterSpacing');
const writingMode = document.getElementById('writingMode');

const CONTROL_NAMES = {
  0x180B: ['FVS1', 'Mongolian Free Variation Selector One', '请求第一类自由变体'],
  0x180C: ['FVS2', 'Mongolian Free Variation Selector Two', '请求第二类自由变体'],
  0x180D: ['FVS3', 'Mongolian Free Variation Selector Three', '请求第三类自由变体'],
  0x180E: ['MVS', 'Mongolian Vowel Separator', '历史兼容相关字符，使用需谨慎'],
  0x200C: ['ZWNJ', 'Zero Width Non-Joiner', '零宽不连接符，阻断连接'],
  0x200D: ['ZWJ', 'Zero Width Joiner', '零宽连接符，辅助连接'],
  0x202F: ['NNBSP', 'Narrow No-Break Space', '窄不换行空格，常用于后缀前连接']
};

const FONT_PRESETS = [
  { label: 'Noto Sans Mongolian', family: '\"Noto Sans Mongolian\", serif' },
  { label: 'Mongolian Baiti', family: '\"Mongolian Baiti\", serif' },
  { label: 'Menksoft / 系统回退', family: 'MenksoftQagan, Menksoft, serif' },
  { label: '系统 Serif', family: 'serif' },
  { label: '系统 Sans-serif', family: 'sans-serif' }
];

function toHex(cp) {
  return 'U+' + cp.toString(16).toUpperCase().padStart(4, '0');
}

function classify(cp) {
  if (CONTROL_NAMES[cp]) return CONTROL_NAMES[cp];
  if (cp >= 0x1800 && cp <= 0x180A) return ['Mongolian punctuation', 'Mongolian punctuation', '蒙古文标点符号'];
  if (cp >= 0x1810 && cp <= 0x1819) return ['Mongolian digit', 'Mongolian digit', '蒙古文数字'];
  if (cp >= 0x1820 && cp <= 0x1842) return ['Mongolian letter', 'Mongolian letter', '蒙古文字母'];
  if (cp >= 0x1843 && cp <= 0x18AA) return ['Mongolian extended', 'Mongolian extended', '蒙古文扩展字符或附加符号'];
  if (cp === 0x20) return ['SPACE', 'Space', '普通空格'];
  if (cp === 0x0A) return ['LF', 'Line Feed', '换行'];
  return ['Other', 'Other Unicode character', '非蒙古文区块字符'];
}

function visibleChar(ch, cp) {
  if (CONTROL_NAMES[cp]) return `<span class="invisible-tag">${CONTROL_NAMES[cp][0]}</span>`;
  if (cp === 0x20) return '<span class="invisible-tag">SPACE</span>';
  if (cp === 0x0A) return '<span class="invisible-tag">LF</span>';
  return ch;
}

function escapeHtml(s) {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function applyQueryInput() {
  const params = new URLSearchParams(window.location.search);
  const text = params.get('text');
  const cp = params.get('cp');
  if (text) {
    input.value = text;
    const title = document.querySelector('.page-hero .subtitle');
    if (title && cp) title.textContent = `已从字符表带入 ${cp}，可查看码点、不可见控制符、竖排预览和字体对比。`;
  }
}

function renderCodepoints() {
  const chars = Array.from(input.value);
  rows.innerHTML = '';
  let controls = 0;
  const specialSet = new Set();
  const seqParts = [];
  const debugParts = [];

  chars.forEach((ch, index) => {
    const cp = ch.codePointAt(0);
    const [shortName, longName, note] = classify(cp);
    const isControl = Boolean(CONTROL_NAMES[cp]) || cp === 0x20 || cp === 0x0A;
    if (CONTROL_NAMES[cp]) {
      controls += 1;
      specialSet.add(shortName);
    }
    seqParts.push(toHex(cp));
    debugParts.push(isControl ? `<span class="debug-token control">${shortName}<small>${toHex(cp)}</small></span>` : `<span class="debug-token">${escapeHtml(ch)}<small>${toHex(cp)}</small></span>`);

    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${index + 1}</td><td class="cp-char">${visibleChar(escapeHtml(ch), cp)}</td><td><code>${toHex(cp)}</code></td><td>${cp}</td><td>${shortName}<br><small>${longName}</small></td><td>${note}</td>`;
    rows.appendChild(tr);
  });

  seq.textContent = seqParts.join(' ');
  debugView.innerHTML = debugParts.join('');
  charCount.textContent = input.value.length;
  codepointCount.textContent = chars.length;
  controlCount.textContent = controls;
  specialBadges.innerHTML = specialSet.size ? Array.from(specialSet).map(s => `<span>${s}</span>`).join('') : '<span>未发现特殊控制符</span>';
  renderPreviews();
}

function renderPreviews() {
  const value = input.value || 'ᠮᠣᠩᠭᠣᠯ';
  previewGrid.innerHTML = FONT_PRESETS.map(font => `
    <article class="card preview-card">
      <h3>${font.label}</h3>
      <div class="preview-box" style="font-family:${font.family};font-size:${fontSize.value}px;letter-spacing:${letterSpacing.value}px;writing-mode:${writingMode.value};">${escapeHtml(value)}</div>
      <p><code>${font.family}</code></p>
    </article>
  `).join('');
}

function copySequence() {
  navigator.clipboard?.writeText(seq.textContent || '').catch(() => {});
}

document.getElementById('sampleBasic').addEventListener('click', () => { input.value = 'ᠮᠣᠩᠭᠣᠯ'; renderCodepoints(); });
document.getElementById('sampleControl').addEventListener('click', () => { input.value = 'ᠠ\u180B ᠨ\u200Dᠭ\u202Fᠠ'; renderCodepoints(); });
document.getElementById('clearInput').addEventListener('click', () => { input.value = ''; renderCodepoints(); });
document.getElementById('copySequence').addEventListener('click', copySequence);
[input, fontSize, letterSpacing, writingMode].forEach(el => el.addEventListener('input', renderCodepoints));
applyQueryInput();
renderCodepoints();
