/**
 * Intent Validator QA Core Engine
 * Rules-based intent classification & header normalization module for Google Apps Script & Node.js
 */

function normalizeHeader_(header) {
  if (!header || typeof header !== 'string') return '';
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function headerMap_(headers) {
  const map = {};
  if (!Array.isArray(headers)) return map;
  headers.forEach((h, index) => {
    if (h && typeof h === 'string' && h.trim()) {
      const normalized = normalizeHeader_(h);
      if (normalized) {
        map[normalized] = index;
      }
    }
  });
  return map;
}

function isIntegrationSheet_(sheetName) {
  if (!sheetName || typeof sheetName !== 'string') return false;
  const lower = sheetName.toLowerCase();
  return lower.includes('integration') || lower.includes('qa') || lower.includes('test');
}

function classifyAction_(trigger, recommended, rulesConfig) {
  const t = ((trigger || '') + ' ' + (recommended || '')).toLowerCase();
  
  if (!rulesConfig || !rulesConfig.rules || !rulesConfig.actions_order) {
    return { action: 'Search/Query', pattern: 'Default Fallback' };
  }

  for (const action of rulesConfig.actions_order) {
    const patterns = rulesConfig.rules[action] || [];
    for (const pattern of patterns) {
      if (t.includes(pattern.toLowerCase())) {
        return { action: action, pattern: pattern };
      }
    }
  }

  return { action: 'Search/Query', pattern: 'Default Fallback' };
}

// Support CommonJS export for Node.js test runner
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    normalizeHeader_,
    headerMap_,
    isIntegrationSheet_,
    classifyAction_
  };
}
