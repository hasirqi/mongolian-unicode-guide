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

const imeEngine = window.iMongolIMEEngine.createEngine(window.iMongolIMEData);
let activeCandidate = null;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
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

function renderRules() {
  ruleRows.innerHTML = imeEngine.rules.map(([latin, mongolian, code, note]) => `
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
  mongolianOutput.textContent = candidate?.text || '';
  verticalPreview.textContent = candidate?.text || '';
  const cps = imeEngine.toCodepoints(candidate?.text || '');
  codepointsOutput.textContent = cps.join(' ');
  debugOutput.innerHTML = (candidate?.tokens || []).map(token => `
    <span class="debug-token ${token.type === 'dictionary' || token.type === 'fuzzy' ? 'control' : ''}">
      ${escapeHtml(token.output)}<small>${escapeHtml(token.input)} · ${token.type}</small>
    </span>
  `).join('');
  sendToTools.href = 'tools.html?text=' + encodeURIComponent(candidate?.text || '');
}

function renderIme() {
  const candidates = imeEngine.buildCandidates(latinInput.value);
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
  const candidates = imeEngine.buildCandidates(latinInput.value);
  if (!Number.isNaN(index) && candidates[index]) {
    candidateList.querySelectorAll('.candidate-card').forEach(el => el.classList.remove('active-candidate'));
    const chosen = candidateList.querySelector(`[data-candidate-index="${index}"]`);
    chosen?.classList.add('active-candidate');
    applyCandidate(candidates[index]);
  }
});

renderRules();
renderIme();
