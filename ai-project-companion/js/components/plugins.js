(function(){
App.registerComponent({
  id: 'plugins',
  title: 'Плагины',
  icon: 'fa-puzzle-piece',
  init: function() { },
  render: function(container) { this._render(container); },
  destroy: function() { }
});

var _comp = App._components.plugins;

_comp._render = function(container) {
  var self = this;
  container.innerHTML = '';

  var wrapper = document.createElement('div');
  wrapper.className = 'page-container';
  container.appendChild(wrapper);

  this._renderHeader(wrapper);
  this._renderPluginList(wrapper);
  this._renderAvailableHooks(wrapper);
  this._renderDevelopmentSection(wrapper);
};

_comp._renderHeader = function(container) {
  var header = document.createElement('div');
  header.style.cssText = 'margin-bottom:24px;';
  header.innerHTML =
    '<h2 style="margin-bottom:8px;"><i class="fas fa-puzzle-piece"></i> Менеджер плагинов</h2>' +
    '<p class="text-muted">Расширяйте функциональность AI Project Companion с помощью плагинов. ' +
    'Плагины позволяют добавлять новые генераторы, анализаторы и интеграции.</p>';
  container.appendChild(header);
};

_comp._renderPluginList = function(container) {
  var pluginMap = App.plugins ? App.plugins.getAll() : {};
  var plugins = [];
  for (var key in pluginMap) {
    if (pluginMap.hasOwnProperty(key)) {
      var p = pluginMap[key];
      p.id = p.id || key;
      plugins.push(p);
    }
  }

  var section = document.createElement('div');
  section.style.cssText = 'margin-bottom:24px;';

  section.innerHTML = '<h3 style="margin-bottom:12px;"><i class="fas fa-plug"></i> Установленные плагины</h3>';

  if (plugins.length === 0) {
    section.innerHTML +=
      '<div class="card" style="padding:32px;text-align:center;">' +
        '<div style="font-size:48px;color:var(--text-muted);margin-bottom:16px;"><i class="fas fa-puzzle-piece"></i></div>' +
        '<h3 style="margin-bottom:8px;">Нет установленных плагинов</h3>' +
        '<p class="text-muted" style="margin-bottom:16px;">Плагины ещё не установлены. Используйте API плагинов для создания собственных расширений.</p>' +
        '<button class="btn btn-secondary" id="pluginsLearnMoreBtn"><i class="fas fa-book"></i> Как создать плагин</button>' +
      '</div>';

    section.querySelector('#pluginsLearnMoreBtn').addEventListener('click', function() {
      var devSection = container.querySelector('.plugin-dev-section');
      if (devSection) devSection.scrollIntoView({ behavior: 'smooth' });
    });
  } else {
    var list = document.createElement('div');
    list.style.cssText = 'display:flex;flex-direction:column;gap:8px;';

    plugins.forEach(function(plugin) {
      var card = document.createElement('div');
      card.className = 'card';
      card.innerHTML =
        '<div class="card-body" style="display:flex;align-items:center;gap:16px;">' +
          '<div style="font-size:24px;color:var(--accent);"><i class="fas ' + (plugin.icon || 'fa-puzzle-piece') + '"></i></div>' +
          '<div style="flex:1;">' +
            '<div style="font-weight:600;">' + (plugin.name || plugin.id || 'Без имени') + '</div>' +
            '<div class="text-muted" style="font-size:0.85rem;">' + (plugin.description || 'Нет описания') + '</div>' +
            '<div style="display:flex;gap:8px;margin-top:4px;">' +
              '<span class="badge">v' + (plugin.version || '1.0.0') + '</span>' +
              '<span class="badge badge-success">Активен</span>' +
            '</div>' +
          '</div>' +
          '<button class="btn btn-sm btn-secondary plugin-config-btn" data-id="' + (plugin.id || '') + '">Настроить</button>' +
        '</div>';

      card.querySelector('.plugin-config-btn').addEventListener('click', function() {
        var id = this.getAttribute('data-id');
        App.ui.showToast('Настройки плагина "' + (plugin.name || id) + '" откроются в следующем обновлении', 'info');
      });

      list.appendChild(card);
    });

    section.appendChild(list);
  }

  container.appendChild(section);
};

_comp._renderAvailableHooks = function(container) {
  var hooks = App.plugins ? App.plugins.getAvailableHooks ? App.plugins.getAvailableHooks() : [
    { name: 'onProjectCreate', description: 'Вызывается при создании нового проекта' },
    { name: 'onProjectOpen', description: 'Вызывается при открытии проекта' },
    { name: 'onFileGenerate', description: 'Вызывается при генерации файла' },
    { name: 'onTemplateApply', description: 'Вызывается при применении шаблона' },
    { name: 'onAnalysisStart', description: 'Вызывается перед началом анализа' },
    { name: 'onAnalysisComplete', description: 'Вызывается после завершения анализа' }
  ] : [
    { name: 'onProjectCreate', description: 'Вызывается при создании нового проекта' },
    { name: 'onProjectOpen', description: 'Вызывается при открытии проекта' },
    { name: 'onFileGenerate', description: 'Вызывается при генерации файла' },
    { name: 'onTemplateApply', description: 'Вызывается при применении шаблона' },
    { name: 'onAnalysisStart', description: 'Вызывается перед началом анализа' },
    { name: 'onAnalysisComplete', description: 'Вызывается после завершения анализа' }
  ];

  var section = document.createElement('div');
  section.style.cssText = 'margin-bottom:24px;';

  section.innerHTML = '<h3 style="margin-bottom:12px;"><i class="fas fa-link"></i> Доступные хуки</h3>' +
    '<p class="text-muted" style="margin-bottom:12px;">Плагины могут подписываться на следующие события:</p>';

  if (hooks && hooks.length > 0) {
    var table = document.createElement('div');
    table.style.cssText = 'display:grid;grid-template-columns:1fr 2fr;gap:4px 16px;';

    hooks.forEach(function(hook) {
      var nameEl = document.createElement('div');
      nameEl.style.cssText = 'font-family:var(--font-mono);font-size:0.9rem;padding:6px 8px;background:var(--bg-secondary);border-radius:4px;';
      nameEl.textContent = hook.name;

      var descEl = document.createElement('div');
      descEl.style.cssText = 'padding:6px 8px;font-size:0.9rem;';
      descEl.textContent = hook.description;

      table.appendChild(nameEl);
      table.appendChild(descEl);
    });

    section.appendChild(table);
  } else {
    section.innerHTML += '<p class="text-muted">Хуки не зарегистрированы</p>';
  }

  container.appendChild(section);
};

_comp._renderDevelopmentSection = function(container) {
  var section = document.createElement('div');
  section.className = 'plugin-dev-section';
  section.style.cssText = 'margin-bottom:24px;';

  section.innerHTML =
    '<h3 style="margin-bottom:12px;"><i class="fas fa-code"></i> Создание плагинов</h3>' +
    '<p class="text-muted" style="margin-bottom:12px;">Используйте следующий шаблон для создания собственного плагина:</p>' +
    '<div class="card"><div class="card-body" style="padding:16px;">' +
      '<pre style="font-family:var(--font-mono);font-size:0.85rem;line-height:1.6;overflow-x:auto;margin:0;"><code>// Пример структуры плагина\n' +
'App.plugins.register({\n' +
'  id: \'my-plugin\',\n' +
'  name: \'Мой плагин\',\n' +
'  version: \'1.0.0\',\n' +
'  description: \'Описание плагина\',\n' +
'  icon: \'fa-rocket\',\n' +
'  hooks: {\n' +
'    onProjectCreate: function(project) {\n' +
'      console.log(\'Проект создан:\', project);\n' +
'    },\n' +
'    onFileGenerate: function(fileName, content) {\n' +
'      console.log(\'Файл сгенерирован:\', fileName);\n' +
'    }\n' +
'  },\n' +
'  methods: {\n' +
'    myCustomMethod: function() {\n' +
'      return \'Данные от плагина\';\n' +
'    }\n' +
'  }\n' +
'});</code></pre>' +
    '</div></div>' +
    '<p class="text-muted" style="margin-top:8px;font-size:0.85rem;">' +
    'Загрузите плагин через отдельный скрипт или встроенный редактор. ' +
    'После регистрации плагин появится в списке выше.</p>';

  container.appendChild(section);
};
})();
