(function () {
  'use strict';

  var state = {
    files: [],
    activeIndex: -1
  };

  var HIGHLIGHT_RULES = {
    py: {
      keywords: /\b(and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield|True|False|None|self)\b/g,
      decorator: /^(\s*@[\w.]+)/gm,
      fstring: /(f["'])((?:[^"']|\\["'])*)(["'])/g,
      comment: /#.*$/gm,
      string: /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,
      number: /\b(\d+\.?\d*|0x[\da-fA-F]+|0b[01]+|0o[0-7]+)\b/g,
      builtin: /\b(print|len|range|int|str|float|list|dict|tuple|set|type|open|input|super|zip|map|filter|reduce|enumerate|sorted|reversed|abs|min|max|sum|any|all|isinstance|hasattr|getattr|setattr|staticmethod|classmethod|property|__init__|__str__|__repr__)\b/g
    },
    js: {
      keywords: /\b(async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|function|if|import|in|instanceof|let|new|of|return|static|super|switch|this|throw|try|typeof|var|void|while|with|yield|true|false|null|undefined)\b/g,
      comment: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
      string: /(`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,
      number: /\b(\d+\.?\d*|0x[\da-fA-F]+)\b/g,
      template: /\$\{([^}]*)\}/g
    },
    html: {
      tag: /<\/?([\w-]+)([\s\S]*?)(\/?>)/g,
      attr: /\b(\w[\w-]*)(=)(["'])/g,
      string: /(["'])(?:(?!\1)[^\\]|\\.)*\1/g,
      comment: /<!--[\s\S]*?-->/g
    },
    css: {
      selector: /([.#][\w-]+|\w+)(?=\s*\{)/g,
      property: /([\w-]+)\s*:/g,
      value: /:\s*(.+?);/g,
      comment: /\/\*[\s\S]*?\*\//g,
      string: /(["'])(?:(?!\1)[^\\]|\\.)*\1/g,
      number: /\b(\d+\.?\d*)(px|em|rem|vh|vw|%|s|ms)?\b/g
    },
    json: {
      key: /"([^"]+)"\s*:/g,
      string: /("(?:[^"\\]|\\.)*")/g,
      number: /\b(-?\d+\.?\d*(?:[eE][+-]?\d+)?)\b/g,
      boolean: /\b(true|false|null)\b/g
    },
    yaml: {
      key: /^(\s*)([\w-]+)\s*:/gm,
      comment: /#.*$/gm,
      value: /:\s+(.+)$/gm,
      array: /^\s*-\s+/gm,
      string: /(["'])(?:(?!\1)[^\\]|\\.)*\1/g,
      number: /\b(\d+\.?\d*)\b/g,
      boolean: /\b(true|false|yes|no|on|off|null|~)\b/g
    },
    md: {
      header: /^(#{1,6})\s+(.+)$/gm,
      bold: /\*\*(.+?)\*\*/g,
      italic: /\*(.+?)\*/g,
      code: /(`+)((?:[^`]|`(?!\1))*)\1/g,
      link: /\[([^\]]+)\]\(([^)]+)\)/g,
      list: /^(\s*[-*+]\s|\s*\d+\.\s)/gm,
      comment: /<!--[\s\S]*?-->/g
    }
  };

  var EXT_MAP = {
    py: 'py', js: 'js', mjs: 'js', ts: 'js', jsx: 'js', tsx: 'js',
    html: 'html', htm: 'html',
    css: 'css', scss: 'css', less: 'css',
    json: 'json', geojson: 'json',
    yaml: 'yaml', yml: 'yaml',
    md: 'md', markdown: 'md',
    txt: 'py',
    toml: 'yaml', cfg: 'yaml', ini: 'yaml'
  };

  function getExt(name) {
    var idx = name.lastIndexOf('.');
    if (idx === -1) return 'txt';
    var ext = name.substring(idx + 1).toLowerCase();
    return EXT_MAP[ext] || 'txt';
  }

  function escHtml(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function applyRules(text, rules) {
    var tokens = [];
    var placeholderIdx = 0;
    var placeholders = {};
    var protectedAreas = [];

    var protectionPatterns = [];
    if (rules.string) protectionPatterns.push(rules.string);
    if (rules.comment) protectionPatterns.push(rules.comment);

    protectionPatterns.forEach(function (pattern) {
      var match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(text)) !== null) {
        var ph = '\x00PH' + (placeholderIdx++) + '\x00';
        protectedAreas.push({ start: match.index, end: match.index + match[0].length, ph: ph, original: match[0], type: pattern === rules.string ? 'string' : 'comment' });
      }
    });

    protectedAreas.sort(function (a, b) { return a.start - b.start; });
    var merged = [];
    for (var i = 0; i < protectedAreas.length; i++) {
      if (merged.length > 0 && protectedAreas[i].start < merged[merged.length - 1].end) continue;
      merged.push(protectedAreas[i]);
    }
    protectedAreas = merged;

    var result = '';
    var lastIdx = 0;
    for (var p = 0; p < protectedAreas.length; p++) {
      var area = protectedAreas[p];
      result += text.substring(lastIdx, area.start);
      placeholders[area.ph] = area;
      result += area.ph;
      lastIdx = area.end;
    }
    result += text.substring(lastIdx);

    var replaceMap = {};
    for (var key in rules) {
      if (key === 'string' || key === 'comment') continue;
      var pattern = rules[key];
      if (!pattern) continue;
      pattern.lastIndex = 0;
      var m;
      while ((m = pattern.exec(result)) !== null) {
        var matched = m[0];
        var mStart = m.index;
        var isProtected = false;
        for (var q = 0; q < protectedAreas.length; q++) {
          if (mStart >= protectedAreas[q].start && mStart < protectedAreas[q].end) {
            isProtected = true;
            break;
          }
        }
        if (!isProtected) {
          var tokenType = key;
          if (tokenType === 'decorator') tokenType = 'decorator';
          else if (tokenType === 'fstring') tokenType = 'string';
          else if (tokenType === 'builtin') tokenType = 'function';
          else if (tokenType === 'tag') tokenType = 'tag';
          else if (tokenType === 'attr') tokenType = 'attr';
          else if (tokenType === 'header' || tokenType === 'bold' || tokenType === 'italic' || tokenType === 'link' || tokenType === 'list') tokenType = 'keyword';
          else if (tokenType === 'key') tokenType = 'attr';
          else if (tokenType === 'value') tokenType = 'string';
          else if (tokenType === 'array') tokenType = 'keyword';
          else if (tokenType === 'selector') tokenType = 'type';
          else if (tokenType === 'property') tokenType = 'attr';
          else if (tokenType === 'boolean') tokenType = 'keyword';
          else if (tokenType === 'code') tokenType = 'string';
          var keyStr = '\x00TK' + (placeholderIdx++) + '\x00';
          replaceMap[keyStr] = '<span class="token-' + tokenType + '">' + escHtml(matched) + '</span>';
          result = result.substring(0, mStart) + keyStr + result.substring(mStart + matched.length);
          pattern.lastIndex = mStart + keyStr.length;
        }
      }
    }

    for (var ph2 in placeholders) {
      var area2 = placeholders[ph2];
      var cls = area2.type === 'string' ? 'token-string' : 'token-comment';
      var escaped = escHtml(area2.original);
      if (area2.type === 'comment' && cls === 'token-comment') {
      }
      replaceMap[ph2] = '<span class="' + cls + '">' + escaped + '</span>';
    }

    var finalResult = result;
    for (var rk in replaceMap) {
      finalResult = finalResult.split(rk).join(replaceMap[rk]);
    }

    return finalResult;
  }

  function highlightCode(code, ext) {
    var rules = HIGHLIGHT_RULES[ext] || HIGHLIGHT_RULES.py;
    var escaped = escHtml(code);
    var result = applyRules(code, rules);
    return '<pre><code>' + result + '</code></pre>';
  }

  function addLineNumbers(html) {
    var lines = html.split('\n');
    var out = '';
    for (var i = 0; i < lines.length; i++) {
      var lineNum = i + 1;
      var lineContent = lines[i];
      out += '<span class="code-line"><span class="code-line-num" style="display:inline-block;width:48px;padding-right:16px;text-align:right;color:var(--text-muted);user-select:none;font-size:0.75rem;opacity:0.6;">' + lineNum + '</span>' + lineContent + '</span>';
    }
    return out;
  }

  function render(container) {
    var html = '<div class="card" style="padding:0;overflow:hidden;">' +
      '<div class="card-header" style="display:flex;justify-content:space-between;align-items:center;padding:8px 16px;margin:0;background:var(--bg-secondary);border-bottom:1px solid var(--border);">' +
      '<div class="tabs tab-header" id="codeTabs" style="display:flex;gap:0;border-bottom:none;overflow-x:auto;flex:1;">';

    if (state.files.length === 0) {
      html += '<span style="color:var(--text-muted);font-size:0.85rem;padding:6px 0;">Файлы не открыты</span>';
    } else {
      for (var i = 0; i < state.files.length; i++) {
        var f = state.files[i];
        var active = i === state.activeIndex ? ' active' : '';
        html += '<div class="tab' + active + '" data-tab-index="' + i + '" style="display:flex;align-items:center;gap:6px;padding:6px 12px;font-size:0.8rem;cursor:pointer;border-bottom:2px solid ' + (active ? 'var(--accent)' : 'transparent') + ';color:' + (active ? 'var(--accent)' : 'var(--text-secondary)') + ';white-space:nowrap;transition:var(--transition);">' +
          '<i class="fas fa-file-code" style="font-size:0.75rem;"></i> ' + escHtml(f.name) +
          '<span class="tab-close" data-tab-index="' + i + '" style="margin-left:4px;cursor:pointer;color:var(--text-muted);font-size:0.7rem;padding:2px;border-radius:3px;">' +
          '<i class="fas fa-times"></i></span></div>';
      }
    }

    html += '</div><div style="display:flex;gap:8px;flex-shrink:0;">' +
      '<button class="btn btn-sm btn-secondary" id="codeOpenBtn" style="font-size:0.8rem;"><i class="fas fa-folder-open"></i> Открыть файл</button>' +
      '<input type="file" id="codeFileInput" accept=".py,.js,.html,.css,.json,.yaml,.yml,.md,.txt,.toml,.cfg,.ini" hidden>' +
      '</div></div>';

    html += '<div class="card-body" style="padding:0;">' +
      '<div class="code-block" style="border:none;border-radius:0;">' +
      '<div class="code-header" id="codeFileHeader" style="display:flex;align-items:center;justify-content:space-between;padding:8px 16px;background:var(--bg-secondary);border-bottom:1px solid var(--border);font-size:0.8rem;">';

    if (state.files.length > 0 && state.activeIndex >= 0) {
      var activeFile = state.files[state.activeIndex];
      html += '<span id="codeFileName"><i class="fas fa-file" style="margin-right:6px;"></i>' + escHtml(activeFile.name) + '</span>' +
        '<div class="code-actions" style="display:flex;align-items:center;gap:8px;">' +
        '<span class="text-muted" id="codeFileInfo" style="font-size:0.7rem;">' + activeFile.lines + ' строк, ' + activeFile.size + '</span>' +
        '<button class="btn btn-sm btn-ghost" id="codeCopyBtn" style="font-size:0.75rem;"><i class="fas fa-copy"></i> Копировать</button>' +
        '<button class="btn btn-sm btn-ghost" id="codeDownloadBtn" style="font-size:0.75rem;"><i class="fas fa-download"></i> Скачать</button>' +
        '</div>';
    } else {
      html += '<span id="codeFileName" style="color:var(--text-muted);">Файл не выбран</span>' +
        '<div class="code-actions"><span class="text-muted" id="codeFileInfo" style="margin-right:12px;font-size:0.7rem;"></span>' +
        '<button class="btn btn-sm btn-ghost" id="codeCopyBtn" style="font-size:0.75rem;" disabled><i class="fas fa-copy"></i> Копировать</button>' +
        '<button class="btn btn-sm btn-ghost" id="codeDownloadBtn" style="font-size:0.75rem;" disabled><i class="fas fa-download"></i> Скачать</button></div>';
    }

    html += '</div><div class="code-content" id="codeContent" style="overflow:auto;max-height:70vh;padding:0;font-family:var(--font-mono);font-size:0.8rem;line-height:1.6;background:var(--bg-tertiary);">';

    if (state.files.length > 0 && state.activeIndex >= 0) {
      var cf = state.files[state.activeIndex];
      var highlighted = highlightCode(cf.content, cf.ext);
      var withLines = addLineNumbers(highlighted);
      html += withLines;
    } else {
      html += '<div class="empty-state" style="padding:60px 20px;"><div class="empty-state-icon" style="margin-bottom:16px;"><i class="fas fa-file-code" style="font-size:2rem;"></i></div><div class="empty-state-text" style="color:var(--text-muted);font-family:var(--font-sans);">Откройте файл для просмотра</div></div>';
    }

    html += '</div></div></div></div>';

    container.innerHTML = html;
    bindEvents(container);
  }

  function openFile(file) {
    var ext = getExt(file.name);
    var reader = new FileReader();
    reader.onload = function (e) {
      var content = e.target.result;
      var lines = content.split('\n').length;
      var size = content.length;
      var sizeStr = size < 1024 ? size + ' B' : size < 1048576 ? (size / 1024).toFixed(1) + ' KB' : (size / 1048576).toFixed(1) + ' MB';

      var existing = -1;
      for (var i = 0; i < state.files.length; i++) {
        if (state.files[i].name === file.name) {
          existing = i;
          break;
        }
      }

      if (existing >= 0) {
        state.files[existing].content = content;
        state.files[existing].lines = lines;
        state.files[existing].size = sizeStr;
        state.files[existing].ext = ext;
        state.activeIndex = existing;
      } else {
        state.files.push({
          name: file.name,
          content: content,
          lines: lines,
          size: sizeStr,
          ext: ext
        });
        state.activeIndex = state.files.length - 1;
      }

      var container = document.getElementById('appContent');
      if (container) render(container);
    };
    reader.readAsText(file);
  }

  function closeTab(index) {
    if (index < 0 || index >= state.files.length) return;
    state.files.splice(index, 1);
    if (state.files.length === 0) {
      state.activeIndex = -1;
    } else if (state.activeIndex >= state.files.length) {
      state.activeIndex = state.files.length - 1;
    } else if (state.activeIndex === index) {
      state.activeIndex = Math.min(index, state.files.length - 1);
    }
    var container = document.getElementById('appContent');
    if (container) render(container);
  }

  function copyContent() {
    if (state.activeIndex < 0 || !state.files[state.activeIndex]) return;
    var content = state.files[state.activeIndex].content;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(content).then(function () {
        App.ui.showToast('Скопировано в буфер обмена', 'success');
      }).catch(function () {
        fallbackCopy(content);
      });
    } else {
      fallbackCopy(content);
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      App.ui.showToast('Скопировано в буфер обмена', 'success');
    } catch (e) {
      App.ui.showToast('Не удалось скопировать', 'error');
    }
    document.body.removeChild(ta);
  }

  function downloadContent() {
    if (state.activeIndex < 0 || !state.files[state.activeIndex]) return;
    var f = state.files[state.activeIndex];
    var blob = new Blob([f.content], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = f.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function loadFromProjectFiles() {
    if (!App.projectManager) return;
    var project = App.projectManager.getCurrentProject();
    if (!project || !project.generatedFiles) {
      App.ui.showToast('Нет открытого проекта с файлами', 'warning');
      return;
    }
    var files = project.generatedFiles;
    var names = Object.keys(files);
    if (names.length === 0) {
      App.ui.showToast('В проекте нет сгенерированных файлов', 'warning');
      return;
    }
    var added = 0;
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      var content = files[name];
      if (typeof content !== 'string') continue;
      var ext = getExt(name);
      var lines = content.split('\n').length;
      var sizeStr = content.length < 1024 ? content.length + ' B' : content.length < 1048576 ? (content.length / 1024).toFixed(1) + ' KB' : (content.length / 1048576).toFixed(1) + ' MB';

      var existing = false;
      for (var j = 0; j < state.files.length; j++) {
        if (state.files[j].name === name) { existing = true; break; }
      }
      if (!existing) {
        state.files.push({ name: name, content: content, lines: lines, size: sizeStr, ext: ext });
        added++;
      }
    }
    if (added > 0) {
      state.activeIndex = state.files.length - added;
      App.ui.showToast('Загружено файлов: ' + added, 'success');
    } else {
      App.ui.showToast('Файлы уже открыты', 'info');
    }
    var container = document.getElementById('appContent');
    if (container) render(container);
  }

  function bindEvents(container) {
    var openBtn = document.getElementById('codeOpenBtn');
    var fileInput = document.getElementById('codeFileInput');
    var copyBtn = document.getElementById('codeCopyBtn');
    var downloadBtn = document.getElementById('codeDownloadBtn');

    if (openBtn) {
      openBtn.addEventListener('click', function () {
        if (fileInput) fileInput.click();
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', function () {
        if (fileInput.files) {
          for (var i = 0; i < fileInput.files.length; i++) {
            openFile(fileInput.files[i]);
          }
          fileInput.value = '';
        }
      });
    }

    var tabs = container.querySelectorAll('.tab');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var idx = parseInt(tab.getAttribute('data-tab-index'), 10);
        if (!isNaN(idx) && idx >= 0 && idx < state.files.length) {
          state.activeIndex = idx;
          render(container);
        }
      });
    });

    var closeBtns = container.querySelectorAll('.tab-close');
    closeBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var idx = parseInt(btn.getAttribute('data-tab-index'), 10);
        closeTab(idx);
      });
    });

    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        copyContent();
      });
    }

    if (downloadBtn) {
      downloadBtn.addEventListener('click', function () {
        downloadContent();
      });
    }
  }

  App.registerComponent({
    id: 'code-viewer',
    title: 'Code Viewer',
    icon: 'fa-code',
    init: function () {
      var self = this;
      this._eventUnsubs = [];
      this._eventUnsubs.push(App.events.on('project:changed', function () {
        var container = document.getElementById('appContent');
        if (container && state.files.length === 0) {
          loadFromProjectFiles();
        }
      }));
    },
    render: function (container) {
      render(container);
    },
    destroy: function () {
      if (this._eventUnsubs) {
        for (var i = 0; i < this._eventUnsubs.length; i++) {
          this._eventUnsubs[i]();
        }
        this._eventUnsubs = null;
      }
    }
  });
})();
