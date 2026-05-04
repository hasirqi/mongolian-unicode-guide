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
const feedbackLatin = document.getElementById('feedbackLatin');
const feedbackMongolian = document.getElementById('feedbackMongolian');
const feedbackNote = document.getElementById('feedbackNote');
const feedbackList = document.getElementById('feedbackList');
const importFeedbackJson = document.getElementById('importFeedbackJson');
const importFeedbackStatus = document.getElementById('importFeedbackStatus');

const FEEDBACK_KEY = 'imongol_ime_feedback_v1';
const SAMPLE_IMPORT = [
  { latin: 'monggol', mongolian: 'ᠮᠣᠩᠭᠣᠯ', note: 'common word' },
  { latin: 'bichig', mongolian: 'ᠪᠢᠴᠢᠭ', note: 'script / writing' }
];
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

function showImportStatus(message, ok = true) {
  if (!importFeedbackStatus) return;
  importFeedbackStatus.hidden = false;
  importFeedbackStatus.textContent = message;
  importFeedbackStatus.classList.toggle('danger-note', !ok);
}

function copyText(value, button) {
  navigator.clipboard?.writeText(value).then(() => flashCopied(button)).catch(() => flashCopied(button));
}

function loadFeedback() {
  try {
    return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveFeedbackList(list) {
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(list));
}

function feedbackToDictionary() {
  const list = loadFeedback();
  const dictionary = {};
  list.forEach(item => {
    const key = String(item.latin || '').trim().toLowerCase();
    const text = String(item.mongolian || '').trim();
    if (key && text) dictionary[key] = { text, note: item.note || 'local feedback' };
  });
  return dictionary;
}

function rebuildEngine() {
  const mergedData = {
    ...window.iMongolIMEData,
    dictionary: {
      ...window.iMongolIMEData.dictionary,
      ...feedbackToDictionary()
    }
  };
  return window.iMongolIMEEngine.createEngine(mergedData);
}

let currentEngine = rebuildEngine();

function normalizeImportedFeedback(raw) {
  const data = Array.isArray(raw) ? raw : Object.entries(raw || {}).map(([latin, value]) => {
    if (typeof value === 'string') return { latin, mongolian: value, note: 'imported object map' };
    return { latin, mongolian: value?.mongolian || value?.text || '', note: value?.note || 'imported object map' };
  });
  return data.map(item => ({
    latin: String(item.latin || item.input || '').trim(),
    mongolian: String(item.mongolian || item.text || item.output || '').trim(),
    note: String(item.note || item.source || 'imported JSON').trim(),
    createdAt: item.createdAt || new Date().toISOString().slice(0, 10)
  })).filter(item => item.latin && item.mongolian);
}

function renderRules() {
  ruleRows.innerHTML = currentEngine.rules.map(([latin, mongolian, code, note]) => `
    <tr><td><code>${escapeHtml(latin)}</code></td><td class="cp-char">${escapeHtml(mongolian)}</td><td><code>${escapeHtml(code)}</code></td><td>${escapeHtml(note)}</td></tr>
  `).join('');
}

function renderFeedbackList() {
  const list = loadFeedback();
  if (!feedbackList) return;
  feedbackList.innerHTML = list.length ? list.map((item, index) => `
    <div class="feedback-item">
      <div><strong>${escapeHtml(item.latin)}</strong> → <span class="feedback-mn">${escapeHtml(item.mongolian)}</span></div>
      <small>${escapeHtml(item.note || 'local feedback')} · ${escapeHtml(item.createdAt || '')}</small>
      <button class="tool-button ghost mini" data-delete-feedback="${index}">删除</button>
    </div>
  `).join('') : '<p class="note">还没有本地反馈。发现候选不准时，可以在这里积累你自己的词库。</p>';
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
  const cps = currentEngine.toCodepoints(candidate?.text || '');
  codepointsOutput.textContent = cps.join(' ');
  debugOutput.innerHTML = (candidate?.tokens || []).map(token => `
    <span class="debug-token ${token.type === 'dictionary' || token.type === 'fuzzy' ? 'control' : ''}">
      ${escapeHtml(token.output)}<small>${escapeHtml(token.input)} · ${token.type}</small>
    </span>
  `).join('');
  sendToTools.href = 'tools.html?text=' + encodeURIComponent(candidate?.text || '');
}

function renderIme() {
  const candidates = currentEngine.buildCandidates(latinInput.value);
  renderCandidateList(candidates);
  applyCandidate(candidates[0] || { text: '', tokens: [] });
}

function refreshAfterFeedbackChange() {
  currentEngine = rebuildEngine();
  renderFeedbackList();
  renderIme();
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
  const candidates = currentEngine.buildCandidates(latinInput.value);
  if (!Number.isNaN(index) && candidates[index]) {
    candidateList.querySelectorAll('.candidate-card').forEach(el => el.classList.remove('active-candidate'));
    const chosen = candidateList.querySelector(`[data-candidate-index="${index}"]`);
    chosen?.classList.add('active-candidate');
    applyCandidate(candidates[index]);
  }
});

document.getElementById('useCurrentAsFeedback').addEventListener('click', () => {
  feedbackLatin.value = latinInput.value.trim();
  feedbackMongolian.value = mongolianOutput.textContent.trim();
  feedbackNote.value = activeCandidate?.source || 'current candidate';
});

document.getElementById('saveFeedback').addEventListener('click', event => {
  const latin = feedbackLatin.value.trim();
  const mongolian = feedbackMongolian.value.trim();
  if (!latin || !mongolian) return;
  const list = loadFeedback().filter(item => String(item.latin).toLowerCase() !== latin.toLowerCase());
  list.unshift({ latin, mongolian, note: feedbackNote.value.trim() || 'local feedback', createdAt: new Date().toISOString().slice(0, 10) });
  saveFeedbackList(list.slice(0, 200));
  flashCopied(event.currentTarget);
  refreshAfterFeedbackChange();
});

document.getElementById('exportFeedback').addEventListener('click', event => {
  copyText(JSON.stringify(loadFeedback(), null, 2), event.currentTarget);
});

document.getElementById('clearFeedback').addEventListener('click', () => {
  localStorage.removeItem(FEEDBACK_KEY);
  refreshAfterFeedbackChange();
});

document.getElementById('loadSampleImport').addEventListener('click', () => {
  importFeedbackJson.value = JSON.stringify(SAMPLE_IMPORT, null, 2);
  showImportStatus('已填入示例 JSON，可以直接导入。');
});

document.getElementById('importFeedback').addEventListener('click', event => {
  try {
    const imported = normalizeImportedFeedback(JSON.parse(importFeedbackJson.value || '[]'));
    if (!imported.length) {
      showImportStatus('没有找到可导入的词条。请检查 latin 和 mongolian 字段。', false);
      return;
    }
    const map = new Map(loadFeedback().map(item => [String(item.latin).toLowerCase(), item]));
    imported.forEach(item => map.set(item.latin.toLowerCase(), item));
    saveFeedbackList(Array.from(map.values()).slice(0, 1000));
    flashCopied(event.currentTarget);
    showImportStatus(`导入完成：${imported.length} 条，重复 latin 已自动覆盖。`);
    refreshAfterFeedbackChange();
  } catch (error) {
    showImportStatus('JSON 解析失败：请确认格式正确。', false);
  }
});

feedbackList.addEventListener('click', event => {
  const button = event.target.closest('[data-delete-feedback]');
  if (!button) return;
  const index = Number(button.dataset.deleteFeedback);
  const list = loadFeedback();
  list.splice(index, 1);
  saveFeedbackList(list);
  refreshAfterFeedbackChange();
});

renderRules();
renderFeedbackList();
renderIme();
