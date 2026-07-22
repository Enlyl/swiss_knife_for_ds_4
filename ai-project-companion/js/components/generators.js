(function(){
App.registerComponent({
  id: 'generators',
  title: 'Генераторы',
  icon: 'fa-wand-magic-sparkles',
  init: function() { },
  render: function(container) { this._render(container); },
  destroy: function() { this._genWrapper = null; }
});

var _comp = App._components.generators;

_comp._getDefaultState = function() {
  return {
    selectedProjectId: null,
    activeTab: 'readme',
    tabs: [
      { id: 'readme',     label: 'README',           icon: 'fa-file-alt',     method: 'generateREADME' },
      { id: 'requirements', label: 'requirements.txt', icon: 'fa-list',        method: 'generateRequirements' },
      { id: 'pyproject',   label: 'pyproject.toml',    icon: 'fa-gear',        method: 'generatePyprojectToml' },
      { id: 'dockerfile',  label: 'Dockerfile',        icon: 'fa-docker',       method: 'generateDockerfile' },
      { id: 'github',      label: 'GitHub Actions',    icon: 'fa-github',       method: 'generateGitHubActions' },
      { id: 'vscode',      label: 'VS Code',           icon: 'fa-code',         method: 'generateVSCodeConfig' },
      { id: 'makefile',    label: 'Makefile',           icon: 'fa-hammer',       method: 'generateMakefile' }
    ]
  };
};

_comp._render = function(container) {
  var self = this;
  var state = App.state.get('generators') || this._getDefaultState();

  container.innerHTML = '';

  var wrapper = document.createElement('div');
  wrapper.className = 'page-container';
  wrapper.innerHTML = '<h2 style="margin-bottom:8px;"><i class="fas fa-wand-magic-sparkles"></i> Генераторы файлов проекта</h2>' +
    '<p class="text-muted" style="margin-bottom:20px;">Создавайте стандартные файлы для вашего Data Science проекта</p>';
  container.appendChild(wrapper);
  self._genWrapper = wrapper;

  this._renderProjectSelector(wrapper, state);
  this._renderTabBar(wrapper, state);
  this._renderContentArea(wrapper, state);
};

_comp._renderProjectSelector = function(container, state) {
  var self = this;
  var projects = App.projectManager ? App.projectManager.getAllProjects() : [];
  var group = document.createElement('div');
  group.style.cssText = 'margin-bottom:16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;';

  group.innerHTML = '<label style="font-weight:600;white-space:nowrap;"><i class="fas fa-folder"></i> Проект:</label>';

  var select = document.createElement('select');
  select.className = 'input';
  select.style.cssText = 'max-width:400px;flex:1;min-width:200px;';

  if (!projects || projects.length === 0) {
    select.innerHTML = '<option value="">— Нет проектов —</option>';
    select.disabled = true;
    group.innerHTML += '<span class="text-muted">Создайте проект, чтобы использовать генераторы</span>';
  } else {
    var placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '— Выберите проект —';
    select.appendChild(placeholder);

    projects.forEach(function(p) {
      var opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name || p.id;
      if (p.id === state.selectedProjectId) opt.selected = true;
      select.appendChild(opt);
    });

    select.addEventListener('change', function(e) {
      state.selectedProjectId = e.target.value || null;
      App.state.set('generators', state);
      self._updatePreview(state);
    });
  }

  group.appendChild(select);
  container.appendChild(group);
};

_comp._renderTabBar = function(container, state) {
  var self = this;
  var bar = document.createElement('div');
  bar.className = 'tabs';
  bar.style.cssText = 'margin-bottom:16px;display:flex;gap:4px;flex-wrap:wrap;';

  state.tabs.forEach(function(tab) {
    var btn = document.createElement('button');
    btn.className = 'btn btn-sm ' + (tab.id === state.activeTab ? 'btn-primary' : 'btn-ghost');
    btn.innerHTML = '<i class="fas ' + tab.icon + '"></i> ' + tab.label;
    btn.addEventListener('click', function() {
      state.activeTab = tab.id;
      App.state.set('generators', state);
      self._renderTabBar(self._genWrapper, state);
      self._updatePreview(state);
    });
    bar.appendChild(btn);
  });

  var existing = container.querySelector('.tabs');
  if (existing) {
    existing.replaceWith(bar);
  } else {
    container.appendChild(bar);
  }
};

_comp._renderContentArea = function(container, state) {
  var card = document.createElement('div');
  card.className = 'card';
  card.id = 'genCard';

  var activeTab = state.tabs.find(function(t) { return t.id === state.activeTab; }) || state.tabs[0];
  var fileName = activeTab.label;

  card.innerHTML =
    '<div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">' +
      '<h3><i class="fas ' + activeTab.icon + '"></i> <span id="genFileName">' + fileName + '</span></h3>' +
      '<div style="display:flex;gap:8px;">' +
        '<button class="btn btn-sm btn-ghost" id="genCopyBtn"><i class="fas fa-copy"></i> Копировать</button>' +
        '<button class="btn btn-sm btn-primary" id="genDownloadBtn"><i class="fas fa-download"></i> Скачать</button>' +
      '</div>' +
    '</div>' +
    '<div class="card-body" style="padding:0;">' +
      '<div class="code-block" style="border:none;border-radius:0;">' +
        '<div class="code-content" id="genPreview" style="max-height:60vh;overflow:auto;white-space:pre-wrap;font-family:var(--font-mono);padding:16px;line-height:1.5;"></div>' +
      '</div>' +
    '</div>';

  container.appendChild(card);

  var preview = card.querySelector('#genPreview');
  preview.textContent = '// Выберите проект для генерации файла';

  var copyBtn = card.querySelector('#genCopyBtn');
  copyBtn.addEventListener('click', function() {
    var text = preview.textContent;
    if (!text || text === '// Выберите проект для генерации файла') {
      App.ui.showToast('Нет содержимого для копирования', 'warning');
      return;
    }
    navigator.clipboard.writeText(text).then(function() {
      App.ui.showToast('Скопировано в буфер обмена', 'success');
    }).catch(function() {
      App.ui.showToast('Ошибка копирования', 'error');
    });
  });

  var downloadBtn = card.querySelector('#genDownloadBtn');
  downloadBtn.addEventListener('click', function() {
    var text = preview.textContent;
    if (!text || text === '// Выберите проект для генерации файла') {
      App.ui.showToast('Нет содержимого для скачивания', 'warning');
      return;
    }
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    App.ui.showToast('Файл скачан: ' + fileName, 'success');
  });

  if (state.selectedProjectId) {
    this._updatePreview(state);
  }
};

_comp._getProject = function(state) {
  if (!App.projectManager || !state.selectedProjectId) return null;
  var projects = App.projectManager.getAllProjects();
  return projects.find(function(p) { return p.id === state.selectedProjectId; }) || null;
};

_comp._updatePreview = function(state) {
  var preview = document.getElementById('genPreview');
  if (!preview) return;

  var project = this._getProject(state);
  if (!project) {
    preview.textContent = '// Выберите проект для генерации файла';
    return;
  }

  var activeTab = state.tabs.find(function(t) { return t.id === state.activeTab; }) || state.tabs[0];
  var fnName = activeTab.method;

  if (!App.fileGenerator || typeof App.fileGenerator[fnName] !== 'function') {
    preview.textContent = '// Метод ' + fnName + ' недоступен';
    return;
  }

  try {
    var result = App.fileGenerator[fnName](project);
    var text = '';
    if (typeof result === 'string') text = result;
    else if (result && typeof result === 'object') {
      var parts = [];
      for (var k in result) {
        if (result.hasOwnProperty(k)) parts.push('# ' + k + '\n' + result[k]);
      }
      text = parts.join('\n\n');
    }
    preview.textContent = text || '// Содержимое не сгенерировано';
  } catch (err) {
    preview.textContent = '// Ошибка генерации: ' + err.message;
    App.ui.showToast('Ошибка генерации: ' + err.message, 'error');
  }
};
})();
