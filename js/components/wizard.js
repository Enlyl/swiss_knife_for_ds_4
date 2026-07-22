(function () {
  'use strict';

  var _state = null;
  var _container = null;

  function escHtml(str) {
    if (typeof str !== 'string') return '';
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function formatDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + d.getFullYear();
  }

  var CAT_NAMES = {
    core: 'Основные', viz: 'Визуализация', ml: 'Машинное обучение',
    dl: 'Глубокое обучение', nlp: 'NLP', cv: 'Компьютерное зрение',
    recsys: 'Рекомендательные системы', ts: 'Временные ряды',
    agents: 'AI Агенты', llm: 'LLM', web: 'Веб', net: 'Сеть',
    tools: 'Инструменты', mlops: 'MLOps', io: 'Ввод/Вывод', other: 'Прочее'
  };

  function catName(c) { return CAT_NAMES[c] || c; }

  function levelInfo(lvl) {
    if (lvl === 'beginner') return ['Начальный', 'badge-info'];
    if (lvl === 'intermediate') return ['Средний', 'badge-warning'];
    return ['Продвинутый', 'badge-danger'];
  }

  function getTemplates() { return App.templateManager ? App.templateManager.getTemplates() : []; }

  function getTemplate(id) { return App.templateManager ? App.templateManager.getTemplate(id) : null; }

  function resetState() {
    _state = {
      step: 1, name: '', description: '', pythonVersion: '3.12',
      useUv: true, templateId: null, selectedLibraries: [], libraryFilter: '',
      rootDir: '', dirHandle: null
    };
  }

  function saveStepData() {
    var el;
    if (_state.step === 1) {
      el = document.getElementById('wizName');
      if (el) _state.name = el.value.trim();
      el = document.getElementById('wizDesc');
      if (el) _state.description = el.value.trim();
      el = document.getElementById('wizRootDir');
      if (el) _state.rootDir = el.value.trim();
      el = document.getElementById('wizPython');
      if (el) _state.pythonVersion = el.value;
      var env = document.querySelector('input[name="env"]:checked');
      if (env) _state.useUv = env.value === 'uv';
    }
    if (_state.step === 3) {
      _state.selectedLibraries = [];
      var cbs = _container.querySelectorAll('#libraryList input[type="checkbox"]:checked');
      cbs.forEach(function (cb) { _state.selectedLibraries.push(cb.value); });
    }
  }

  function validateStep(step) {
    if (step === 1) {
      saveStepData();
      if (!_state.name) {
        App.ui.showToast('Введите название проекта', 'error');
        var el = document.getElementById('wizName');
        if (el) el.focus();
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (!_state.templateId) {
        App.ui.showToast('Выберите шаблон проекта', 'error');
        return false;
      }
      return true;
    }
    if (step === 3) {
      saveStepData();
      if (_state.selectedLibraries.length === 0) {
        App.ui.showToast('Выберите хотя бы одну библиотеку', 'error');
        return false;
      }
      return true;
    }
    return true;
  }

  /* ---- Step Indicators ---- */

  function renderSteps() {
    var steps = [
      { num: 1, label: 'Основное' }, { num: 2, label: 'Шаблон' },
      { num: 3, label: 'Библиотеки' }, { num: 4, label: 'Обзор' }
    ];
    var html = '<div class="wizard-steps">';
    for (var i = 0; i < steps.length; i++) {
      var s = steps[i];
      var cls = 'wizard-step';
      if (s.num < _state.step) cls += ' wizard-step-completed';
      else if (s.num === _state.step) cls += ' wizard-step-active';
      html += '<div class="' + cls + '">' +
        '<div class="wizard-step-num">' + (s.num < _state.step ? '<i class="fas fa-check"></i>' : s.num) + '</div>' +
        '<div class="wizard-step-label">' + s.label + '</div></div>';
      if (i < steps.length - 1) {
        html += '<div class="wizard-step-connector' + (s.num < _state.step ? ' wizard-step-connector-done' : '') + '"></div>';
      }
    }
    html += '</div>';
    return html;
  }

  function renderNav() {
    var html = '<div class="wizard-nav">';
    if (_state.step > 1) {
      html += '<button class="btn btn-secondary" id="wizPrevBtn"><i class="fas fa-arrow-left"></i> Назад</button>';
    } else {
      html += '<div></div>';
    }
    if (_state.step < 4) {
      html += '<button class="btn btn-primary" id="wizNextBtn">Далее <i class="fas fa-arrow-right"></i></button>';
    } else {
      html += '<button class="btn btn-success" id="wizCreateBtn"><i class="fas fa-check"></i> Создать проект</button>';
    }
    html += '</div>';
    return html;
  }

  /* ---- Step 1: Основное ---- */

  function renderStep1() {
    return '<div class="wizard-content">' +
      '<div class="form-group">' +
        '<label class="form-label">Название проекта *</label>' +
        '<input type="text" class="input" id="wizName" value="' + escHtml(_state.name) + '" placeholder="Например: Анализ продаж 2026">' +
        '<div class="form-hint">Дайте проекту понятное название</div></div>' +
      '<div class="form-group">' +
        '<label class="form-label">Описание</label>' +
        '<textarea class="textarea" id="wizDesc" rows="3" placeholder="Кратко опишите цель проекта...">' + escHtml(_state.description) + '</textarea></div>' +
      '<div class="form-group">' +
        '<label class="form-label">Директория проекта</label>' +
        '<div style="display:flex;gap:8px">' +
          '<input type="text" class="input" id="wizRootDir" value="' + escHtml(_state.rootDir) + '" placeholder="~/projects/' + escHtml(_state.name || 'my_project') + '" style="flex:1">' +
          '<button class="btn btn-secondary" id="wizBrowseBtn" title="Выбрать папку"><i class="fas fa-folder-open"></i></button>' +
        '</div>' +
        '<div class="form-hint">Полный путь к папке проекта, например C:\\Projects\\' + escHtml(_state.name || 'my_project') + ' (для создания venv и установки пакетов). Кнопка справа — записать файлы в выбранную папку.</div></div>' +
      '<div class="form-group">' +
        '<label class="form-label">Версия Python</label>' +
        '<select class="select" id="wizPython">' +
          '<option value="3.12"' + (_state.pythonVersion === '3.12' ? ' selected' : '') + '>Python 3.12 (рекомендуется)</option>' +
          '<option value="3.11"' + (_state.pythonVersion === '3.11' ? ' selected' : '') + '>Python 3.11</option>' +
          '<option value="3.10"' + (_state.pythonVersion === '3.10' ? ' selected' : '') + '>Python 3.10</option>' +
          '<option value="3.13"' + (_state.pythonVersion === '3.13' ? ' selected' : '') + '>Python 3.13 (новейшая)</option>' +
        '</select></div>' +
      '<div class="form-group">' +
        '<label class="form-label">Виртуальное окружение</label>' +
        '<div class="grid grid-2">' +
          '<label class="checkbox-card' + (_state.useUv ? ' selected' : '') + '" id="wizEnvUv">' +
            '<input type="radio" name="env" value="uv"' + (_state.useUv ? ' checked' : '') + ' hidden>' +
            '<div class="checkbox-card-content">' +
              '<div class="checkbox-card-title"><i class="fas fa-bolt"></i> uv <span class="badge badge-success">Рекомендуется</span></div>' +
              '<div class="checkbox-card-desc">В 10-100x быстрее pip, современный менеджер пакетов</div></div></label>' +
          '<label class="checkbox-card' + (!_state.useUv ? ' selected' : '') + '" id="wizEnvVenv">' +
            '<input type="radio" name="env" value="venv"' + (!_state.useUv ? ' checked' : '') + ' hidden>' +
            '<div class="checkbox-card-content">' +
              '<div class="checkbox-card-title"><i class="fas fa-box"></i> venv + pip</div>' +
              '<div class="checkbox-card-desc">Стандартный менеджер, встроен в Python</div></div></label>' +
        '</div></div>' +
      '</div>';
  }

  /* ---- Step 2: Шаблон ---- */

  function renderTemplateCard(t) {
    var sel = _state.templateId === t.id ? ' card-selected' : '';
    var lvl = levelInfo(t.level);
    var libCount = t.libraries ? t.libraries.length : 0;
    var selBadge = sel ? '<span class="badge badge-success" style="position:absolute;top:8px;right:8px;z-index:1;"><i class="fas fa-check"></i> Выбран</span>' : '';
    return '<div class="card card-hoverable template-select-card' + sel + '" data-id="' + escHtml(t.id) + '" style="position:relative;overflow:hidden;">' +
      selBadge +
      '<div class="template-select-icon" style="' + (sel ? 'color:' + (t.color || 'var(--accent)') : '') + '"><i class="fas ' + (t.icon || 'fa-cube') + '" style="color:' + (t.color || 'var(--accent)') + '"></i></div>' +
      '<div class="template-select-name">' + escHtml(t.name) + '</div>' +
      '<div class="template-select-desc">' + escHtml(t.description) + '</div>' +
      '<div class="template-select-meta">' +
        '<span class="badge ' + lvl[1] + '">' + lvl[0] + '</span>' +
        '<span class="badge">' + libCount + ' библиотек</span></div></div>';
  }

  function renderTemplateDetails(t) {
    if (!t) return '<div class="template-details-empty">Выберите шаблон, чтобы увидеть подробности</div>';
    var lvl = levelInfo(t.level);
    var roadmapCount = t.roadmap ? t.roadmap.length : 0;
    var libCount = t.libraries ? t.libraries.length : 0;
    var html = '<div class="template-details">' +
      '<div class="template-details-icon" style="background:' + (t.color || 'var(--accent)') + '20;color:' + (t.color || 'var(--accent)') + '">' +
        '<i class="fas ' + (t.icon || 'fa-cube') + '"></i></div>' +
      '<div class="template-details-info">' +
        '<div class="template-details-name">' + escHtml(t.name) + '</div>' +
        '<div class="template-details-desc">' + escHtml(t.description) + '</div>' +
        '<div class="template-details-meta">' +
          '<span><i class="fas fa-signal"></i> Уровень: <span class="badge ' + lvl[1] + '">' + lvl[0] + '</span></span>' +
          '<span><i class="fas fa-tag"></i> Категория: ' + escHtml(t.category || '—') + '</span>' +
          '<span><i class="fas fa-list"></i> Этапов: ' + roadmapCount + '</span>' +
          '<span><i class="fas fa-cube"></i> Библиотек: ' + libCount + '</span></div></div></div>';
    if (t.structure && t.structure.length) {
      html += '<div class="template-details-structure"><h4>Структура проекта</h4>' + renderStructure(t.structure, 0) + '</div>';
    }
    return html;
  }

  function renderStructure(items, depth) {
    if (!items) return '';
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var pad = depth * 20;
      if (item.type === 'dir') {
        html += '<div style="padding-left:' + pad + 'px;color:var(--warning);font-size:0.85rem;margin:2px 0">' +
          '<i class="fas fa-folder"></i> ' + escHtml(item.name) + '/</div>';
        if (item.children) html += renderStructure(item.children, depth + 1);
      } else {
        html += '<div style="padding-left:' + pad + 'px;color:var(--text-muted);font-size:0.85rem;margin:2px 0">' +
          '<i class="fas fa-file"></i> ' + escHtml(item.name) + '</div>';
      }
    }
    return html;
  }

  function renderStep2() {
    var templates = getTemplates();
    var html = '<div class="wizard-content">' +
      '<p style="color:var(--text-secondary);margin-bottom:16px">Выберите шаблон, который лучше всего подходит для вашей задачи</p>' +
      '<div class="grid grid-3 mb-4">';
    for (var i = 0; i < templates.length; i++) {
      html += renderTemplateCard(templates[i]);
    }
    html += '</div>';
    var tpl = _state.templateId ? getTemplate(_state.templateId) : null;
    html += '<div id="templateDetails">' + renderTemplateDetails(tpl) + '</div>';
    return html + '</div>';
  }

  /* ---- Step 3: Библиотеки ---- */

  function renderLibraryCheckbox(lib) {
    var sel = _state.selectedLibraries.indexOf(lib.name) !== -1;
    var req = lib.required;
    var html = '<label class="checkbox-card' + (sel ? ' selected' : '') + '">' +
      '<input type="checkbox" value="' + escHtml(lib.name) + '"' + (sel ? ' checked' : '') + (req ? ' disabled' : '') + ' hidden>' +
      '<div class="checkbox-card-content">' +
        '<div class="checkbox-card-title">' + escHtml(lib.name);
    if (req) html += ' <span class="badge badge-danger">Обязательная</span>';
    else if (lib.popular) html += ' <span class="badge badge-info">Популярная</span>';
    html += '</div><div class="checkbox-card-desc">' + escHtml(lib.description || '') + '</div></div></label>';
    return html;
  }

  function renderLibraryGroups(libs) {
    var filtered = libs;
    if (_state.libraryFilter) {
      var f = _state.libraryFilter.toLowerCase();
      filtered = libs.filter(function (l) {
        return l.name.toLowerCase().indexOf(f) !== -1 ||
          (l.description && l.description.toLowerCase().indexOf(f) !== -1);
      });
    }
    if (!filtered.length) {
      return '<div style="padding:40px 20px;text-align:center;color:var(--text-muted)"><i class="fas fa-search" style="font-size:1.5rem;display:block;margin-bottom:8px"></i>Ничего не найдено</div>';
    }
    var cats = {};
    for (var i = 0; i < filtered.length; i++) {
      var c = filtered[i].category || 'other';
      if (!cats[c]) cats[c] = [];
      cats[c].push(filtered[i]);
    }
    var html = '';
    var keys = Object.keys(cats);
    for (var j = 0; j < keys.length; j++) {
      var k = keys[j];
      html += '<div class="mb-4">' +
        '<h4 style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid var(--border);padding-bottom:6px">' + catName(k) + ' <span style="font-weight:400;color:var(--text-muted)">(' + cats[k].length + ')</span></h4>' +
        '<div class="flex flex-col" style="gap:4px">';
      for (var m = 0; m < cats[k].length; m++) {
        html += renderLibraryCheckbox(cats[k][m]);
      }
      html += '</div></div>';
    }
    return html;
  }

  function applyPreset(idx) {
    var tpl = getTemplate(_state.templateId);
    if (!tpl || !tpl.libraries) return;
    if (idx === 0) {
      _state.selectedLibraries = tpl.libraries.filter(function (l) { return l.required; }).map(function (l) { return l.name; });
    } else if (idx === 1) {
      _state.selectedLibraries = tpl.libraries.filter(function (l) { return l.checked; }).map(function (l) { return l.name; });
    } else if (idx === 2) {
      _state.selectedLibraries = tpl.libraries.map(function (l) { return l.name; });
    }
    var stepContent = _container.querySelector('.wizard-step-content');
    if (stepContent) {
      stepContent.innerHTML = renderStep3();
      attachStep3Events();
    }
  }

  function renderStep3() {
    var tpl = getTemplate(_state.templateId);
    var libs = tpl && tpl.libraries ? tpl.libraries : [];
    var presets = tpl && tpl.presets ? tpl.presets : [];
    var html = '<div class="wizard-content">' +
      '<p style="color:var(--text-secondary);margin-bottom:12px">Выберите библиотеки для вашего проекта</p>';
    if (presets.length) {
      html += '<div class="flex gap-2 mb-4" style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">';
      html += '<span style="font-size:0.85rem;color:var(--text-muted);align-self:center">Быстрый выбор:</span>';
      for (var i = 0; i < presets.length; i++) {
        html += '<button class="btn btn-sm btn-outline preset-btn" data-preset="' + i + '">' + escHtml(presets[i]) + '</button>';
      }
      html += '</div>';
    }
    html += '<div style="position:relative;margin-bottom:16px">' +
      '<i class="fas fa-search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-muted);z-index:1"></i>' +
      '<input type="text" class="input" id="libSearch" placeholder="Поиск библиотек..." value="' + escHtml(_state.libraryFilter) + '" style="padding-left:32px">' +
      '</div>';
    html += '<div id="libraryList" class="library-list">' + renderLibraryGroups(libs) + '</div>';
    return html + '</div>';
  }

  /* ---- Step 4: Обзор ---- */

  function renderStep4() {
    var tpl = _state.templateId ? getTemplate(_state.templateId) : null;
    var envLabel = _state.useUv ? 'uv (рекомендуется)' : 'venv + pip';
    var envIcon = _state.useUv ? 'fa-bolt' : 'fa-box';
    var html = '<div class="wizard-content">' +
      '<h3 style="margin-bottom:16px;font-size:1.1rem">Проверьте параметры проекта</h3>' +
      '<div class="card" style="padding:16px 20px;margin-bottom:16px">' +
        '<table style="width:100%;border-collapse:collapse">' +
          '<tr><td style="padding:8px 12px;color:var(--text-muted);width:160px;font-size:0.85rem">Название</td><td style="padding:8px 12px;font-weight:600">' + escHtml(_state.name) + '</td></tr>' +
          '<tr><td style="padding:8px 12px;color:var(--text-muted);width:160px;font-size:0.85rem;border-top:1px solid var(--border)">Описание</td><td style="padding:8px 12px;border-top:1px solid var(--border)">' + (_state.description ? escHtml(_state.description) : '<span style="color:var(--text-muted)">—</span>') + '</td></tr>' +
          '<tr><td style="padding:8px 12px;color:var(--text-muted);width:160px;font-size:0.85rem;border-top:1px solid var(--border)">Директория</td><td style="padding:8px 12px;border-top:1px solid var(--border)"><code style="font-size:0.8rem">' + escHtml(_state.rootDir || '—') + '</code></td></tr>' +
          '<tr><td style="padding:8px 12px;color:var(--text-muted);width:160px;font-size:0.85rem;border-top:1px solid var(--border)">Python</td><td style="padding:8px 12px;border-top:1px solid var(--border)">' + escHtml(_state.pythonVersion) + '</td></tr>' +
          '<tr><td style="padding:8px 12px;color:var(--text-muted);width:160px;font-size:0.85rem;border-top:1px solid var(--border)">Окружение</td><td style="padding:8px 12px;border-top:1px solid var(--border)"><i class="fas ' + envIcon + '" style="margin-right:4px;color:var(--warning)"></i> ' + envLabel + '</td></tr>' +
          '<tr><td style="padding:8px 12px;color:var(--text-muted);width:160px;font-size:0.85rem;border-top:1px solid var(--border)">Шаблон</td><td style="padding:8px 12px;border-top:1px solid var(--border)"><i class="fas ' + (tpl && tpl.icon || 'fa-cube') + '" style="margin-right:4px;color:' + (tpl && tpl.color || 'var(--accent)') + '"></i> ' + (tpl ? escHtml(tpl.name) : '—') + '</td></tr>' +
          '<tr><td style="padding:8px 12px;color:var(--text-muted);width:160px;font-size:0.85rem;border-top:1px solid var(--border)">Библиотеки</td><td style="padding:8px 12px;border-top:1px solid var(--border)">' + _state.selectedLibraries.length + ' шт.</td></tr>' +
        '</table></div>';

    if (_state.selectedLibraries.length) {
      html += '<div class="card" style="padding:16px 20px;margin-bottom:16px">' +
        '<h4 style="font-size:0.9rem;margin-bottom:8px">Выбранные библиотеки</h4>' +
        '<div class="flex gap-1" style="display:flex;flex-wrap:wrap;gap:4px">';
      for (var i = 0; i < _state.selectedLibraries.length; i++) {
        html += '<span class="badge badge-info">' + escHtml(_state.selectedLibraries[i]) + '</span>';
      }
      html += '</div></div>';
    }

    if (tpl && tpl.structure && tpl.structure.length) {
      var roadmapCount = tpl.roadmap ? tpl.roadmap.length : 0;
      html += '<div class="card" style="padding:16px 20px;margin-bottom:16px">' +
        '<h4 style="font-size:0.9rem;margin-bottom:8px">Структура проекта (' + roadmapCount + ' этапов)</h4>' +
        '<div style="font-size:0.85rem">' + renderStructure(tpl.structure, 0) + '</div></div>';
    }

    html += '</div>';
    return html;
  }

  /* ---- Events ---- */

  function attachStep1Events() {
    (function() {
      var browseBtn = document.getElementById('wizBrowseBtn');
      var dirInput = document.getElementById('wizRootDir');
      if (browseBtn && window.showDirectoryPicker) {
        browseBtn.addEventListener('click', function() {
          window.showDirectoryPicker({ mode: 'readwrite' }).then(function(handle) {
            _state.dirHandle = handle;
            if (dirInput) dirInput.value = handle.name;
            _state.rootDir = handle.name;
          }).catch(function() {});
        });
      } else if (browseBtn) {
        browseBtn.style.opacity = '0.5';
        browseBtn.title = 'Выбор папки недоступен в вашем браузере';
      }
    })();
    var envUv = document.getElementById('wizEnvUv');
    var envVenv = document.getElementById('wizEnvVenv');
    function selectEnv(el) {
      if (!el) return;
      var cards = _container.querySelectorAll('.checkbox-card');
      cards.forEach(function (c) { c.classList.remove('selected'); });
      el.classList.add('selected');
      var radio = el.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    }
    if (envUv) envUv.addEventListener('click', function () { selectEnv(envUv); });
    if (envVenv) envVenv.addEventListener('click', function () { selectEnv(envVenv); });
  }

  function attachStep2Events() {
    var cards = _container.querySelectorAll('.template-select-card');
    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        cards.forEach(function (c) { c.classList.remove('card-selected'); });
        card.classList.add('card-selected');
        _state.templateId = card.getAttribute('data-id');
        var tpl = getTemplate(_state.templateId);
        var detailsEl = document.getElementById('templateDetails');
        if (detailsEl) {
          detailsEl.innerHTML = renderTemplateDetails(tpl);
        }
      });
    });
  }

  function attachStep3Events() {
    var searchInput = document.getElementById('libSearch');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        _state.libraryFilter = this.value;
        var listEl = document.getElementById('libraryList');
        if (listEl) {
          var tpl = getTemplate(_state.templateId);
          if (tpl && tpl.libraries) {
            listEl.innerHTML = renderLibraryGroups(tpl.libraries);
            attachLibCheckboxEvents();
          }
        }
      });
    }
    var presetBtns = _container.querySelectorAll('.preset-btn');
    presetBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-preset'), 10);
        applyPreset(idx);
      });
    });
    attachLibCheckboxEvents();
  }

  function attachLibCheckboxEvents() {
    var cbs = _container.querySelectorAll('#libraryList input[type="checkbox"]');
    cbs.forEach(function (cb) {
      cb.addEventListener('change', function () {
        var label = cb.closest('.checkbox-card');
        if (cb.checked) {
          if (_state.selectedLibraries.indexOf(cb.value) === -1) {
            _state.selectedLibraries.push(cb.value);
          }
          if (label) label.classList.add('selected');
        } else {
          var idx = _state.selectedLibraries.indexOf(cb.value);
          if (idx !== -1) _state.selectedLibraries.splice(idx, 1);
          if (label) label.classList.remove('selected');
        }
      });
    });
  }

  function goNext() {
    if (!validateStep(_state.step)) return;
    saveStepData();
    if (_state.step === 2) {
      var tpl = getTemplate(_state.templateId);
      if (tpl && tpl.libraries && !_state.selectedLibraries.length) {
        _state.selectedLibraries = tpl.libraries.filter(function (l) { return l.checked; }).map(function (l) { return l.name; });
      }
    }
    _state.step++;
    renderWizard(_container);
  }

  function goPrev() {
    saveStepData();
    _state.step--;
    renderWizard(_container);
  }

  function writeProjectToHandle(handle, project) {
    var files = project.generatedFiles || {};
    var structure = project.structure || [];
    return (async function() {
      async function createDirs(items, parentHandle) {
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          if (item.type === 'dir') {
            var dirHandle = await parentHandle.getDirectoryHandle(item.name, { create: true });
            if (item.children) {
              await createDirs(item.children, dirHandle);
            }
          }
        }
      }
      await createDirs(structure, handle);
      var entries = Object.entries(files);
      for (var j = 0; j < entries.length; j++) {
        var filePath = entries[j][0];
        var content = entries[j][1];
        var parts = filePath.split('/');
        var fileName = parts.pop();
        var currentHandle = handle;
        for (var k = 0; k < parts.length; k++) {
          currentHandle = await currentHandle.getDirectoryHandle(parts[k], { create: true });
        }
        var fileHandle = await currentHandle.getFileHandle(fileName, { create: true });
        var writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
      }
    })();
  }

  function createProject() {
    saveStepData();
    if (!_state.name) {
      App.ui.showToast('Введите название проекта', 'error');
      return;
    }
    var project = App.projectManager.createProject({
      name: _state.name,
      description: _state.description,
      rootDir: _state.rootDir,
      pythonVersion: _state.pythonVersion,
      useUv: _state.useUv,
      templateId: _state.templateId || 'data-analysis',
      libraries: _state.selectedLibraries
    });
    if (project) {
      if (App.projectManager.generateProjectFiles) {
        App.projectManager.generateProjectFiles(project);
      }
      App.events.emit('project:created', { project: project });
      App.ui.showToast('Проект "' + _state.name + '" создан в браузере', 'success');

      // Создаём файлы на диске + виртуальное окружение
      function postJSON(url, data, onOk, onErr) {
        var x = new XMLHttpRequest();
        x.open('POST', url, true);
        x.setRequestHeader('Content-Type', 'application/json');
        x.onload = function () {
          try {
            var r = JSON.parse(x.responseText);
            if (r.success) { if (onOk) onOk(r); }
            else { if (onErr) onErr(r.error || 'неизвестная ошибка'); }
          } catch (e) { if (onErr) onErr('Ошибка ответа сервера'); }
        };
        x.onerror = function () { if (onErr) onErr('Сервер недоступен'); };
        x.send(JSON.stringify(data));
      }

      var payload = {
        name: _state.name,
        rootDir: _state.rootDir,
        files: project.generatedFiles || {},
        structure: project.structure || [],
        pythonVersion: _state.pythonVersion,
        useUv: _state.useUv,
        libraries: _state.selectedLibraries
      };

      // 1. Создаём файлы через сервер (если указан путь)
      if (_state.rootDir) {
        postJSON('/api/create-project', payload, function(res) {
          App.ui.showToast('Проект сохранён в ' + res.path, 'success');
          // 2. Сразу запускаем venv + pip install
          postJSON('/api/setup-env', payload, function(res2) {
            App.ui.showToast('Виртуальное окружение готово', 'success');
          }, function(err2) {
            App.ui.showToast('Окружение: ' + err2, 'warning');
          });
        }, function(err) {
          App.ui.showToast('Ошибка записи: ' + err, 'error');
        });
      }

      // 3. Если выбранная папка через Browse — дублируем файлы туда (FSA)
      if (_state.dirHandle) {
        writeProjectToHandle(_state.dirHandle, project).then(function() {
          App.ui.showToast('Файлы записаны в выбранную папку', 'success');
        }).catch(function(err) {
          App.ui.showToast('Ошибка записи в папку: ' + err.message, 'error');
        });
      }

      App.router.navigate('#dashboard');
    } else {
      App.ui.showToast('Ошибка при создании проекта', 'error');
    }
  }

  function attachEvents() {
    var nextBtn = document.getElementById('wizNextBtn');
    var prevBtn = document.getElementById('wizPrevBtn');
    var createBtn = document.getElementById('wizCreateBtn');
    if (nextBtn) nextBtn.addEventListener('click', goNext);
    if (prevBtn) prevBtn.addEventListener('click', goPrev);
    if (createBtn) createBtn.addEventListener('click', createProject);
    if (_state.step === 1) attachStep1Events();
    else if (_state.step === 2) attachStep2Events();
    else if (_state.step === 3) attachStep3Events();
  }

  function renderWizard(container) {
    _container = container;
    var renderers = [null, renderStep1, renderStep2, renderStep3, renderStep4];
    var html = '<div class="wizard">' + renderSteps() +
      '<div class="wizard-body">' +
        '<div class="wizard-step-content">' + renderers[_state.step]() + '</div>' +
        renderNav() +
      '</div></div>';
    container.innerHTML = html;
    attachEvents();
  }

  App.registerComponent({
    id: 'wizard',
    title: 'Новый проект',
    icon: 'fa-plus-circle',
    init: function () {},
    render: function (container) {
      resetState();
      renderWizard(container);
    },
    destroy: function () {}
  });
})();
