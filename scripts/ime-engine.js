// iMongol IME engine layer
// Pure-ish browser global module. No DOM access here.

(function () {
  function toCodepoints(value) {
    return Array.from(value).map(ch => 'U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'));
  }

  function createEngine(data) {
    const rules = data.rules || [];
    const dictionary = data.dictionary || {};
    const fuzzyAliases = data.fuzzyAliases || {};
    const sortedRules = [...rules].sort((a, b) => b[0].length - a[0].length);

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
      if (dictionary[lower]) {
        return { text: dictionary[lower].text, tokens: [{ input: word, output: dictionary[lower].text, type: 'dictionary' }] };
      }
      if (fuzzyAliases[lower] && dictionary[fuzzyAliases[lower]]) {
        const key = fuzzyAliases[lower];
        return { text: dictionary[key].text, tokens: [{ input: word, output: dictionary[key].text, type: 'fuzzy' }] };
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
      if (rule.text !== dict.text) {
        candidates.push({ id: 'rule', label: '规则直转', text: rule.text, confidence: 72, source: '基础转写规则', explanation: '不使用词典，只根据当前映射表机械转换，适合调试。', tokens: rule.tokens });
      }

      const normalized = value.toLowerCase().replace(/gg/g, 'g').replace(/v/g, 'u');
      if (normalized !== value.toLowerCase()) {
        const norm = convertParts(normalized, dictionaryResolver);
        if (!candidates.some(c => c.text === norm.text)) {
          candidates.push({ id: 'normalized', label: '容错候选', text: norm.text, confidence: 66, source: '输入归一化', explanation: `将输入临时归一化为 ${normalized} 后生成，用于处理重复字母或键盘习惯差异。`, tokens: norm.tokens });
        }
      }
      return candidates.slice(0, 4);
    }

    return { rules, dictionary, fuzzyAliases, buildCandidates, toCodepoints };
  }

  window.iMongolIMEEngine = { createEngine, toCodepoints };
})();
