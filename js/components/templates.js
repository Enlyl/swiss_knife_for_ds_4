(function(){
App.registerComponent({
  id: 'templates',
  title: 'Шаблоны',
  icon: 'fa-cubes',
  init: function() { },
  render: function(container) { this._render(container); },
  destroy: function() { }
});

var _comp = App._components.templates;

_comp._getDefaultState = function() {
  return {
    searchQuery: '',
    difficultyFilter: 'all',
    selectedTemplateId: null
  };
};

_comp._render = function(container) {
  var self = this;
  var state = App.state.get('templates') || this._getDefaultState();

  container.innerHTML = '';

  var wrapper = document.createElement('div');
  wrapper.className = 'page-container';
  wrapper.innerHTML = '<h2 style="margin-bottom:8px;"><i class="fas fa-cubes"></i> Шаблоны проектов</h2>' +
    '<p class="text-muted" style="margin-bottom:20px;">Начните новый проект с готового шаблона под вашу задачу</p>';
  container.appendChild(wrapper);

  this._renderFilterBar(wrapper, state);
  this._renderGrid(wrapper, state);
};

_comp._renderFilterBar = function(container, state) {
  var self = this;

  var bar = document.createElement('div');
  bar.style.cssText = 'display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;align-items:center;';

  bar.innerHTML =
    '<div class="search-bar" style="flex:1;min-width:200px;">' +
      '<i class="fas fa-search search-icon"></i>' +
      '<input type="text" class="search-input" id="tplSearch" placeholder="Поиск шаблонов..." value="' + this._escapeHtml(state.searchQuery) + '">' +
    '</div>' +
    '<div class="btn-group" id="tplDifficultyFilter">' +
      '<button class="btn btn-sm ' + (state.difficultyFilter === 'all' ? 'active' : '') + '" data-filter="all">Все</button>' +
      '<button class="btn btn-sm ' + (state.difficultyFilter === 'beginner' ? 'active' : '') + '" data-filter="beginner">Начальный</button>' +
      '<button class="btn btn-sm ' + (state.difficultyFilter === 'intermediate' ? 'active' : '') + '" data-filter="intermediate">Средний</button>' +
      '<button class="btn btn-sm ' + (state.difficultyFilter === 'advanced' ? 'active' : '') + '" data-filter="advanced">Продвинутый</button>' +
    '</div>';

  container.appendChild(bar);

  var searchInput = bar.querySelector('#tplSearch');
  searchInput.addEventListener('input', function() {
    state.searchQuery = this.value;
    App.state.set('templates', state);
    self._renderGrid(container, state);
  });

  var filterBtns = bar.querySelectorAll('#tplDifficultyFilter .btn');
  filterBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      state.difficultyFilter = this.getAttribute('data-filter');
      App.state.set('templates', state);
      filterBtns.forEach(function(b) { b.classList.remove('active'); });
      this.classList.add('active');
      self._renderGrid(container, state);
    });
  });
};

_comp._renderGrid = function(container, state) {
  var self = this;
  var gridContainer = container.querySelector('.template-grid-container');
  if (!gridContainer) {
    gridContainer = document.createElement('div');
    gridContainer.className = 'template-grid-container';
    container.appendChild(gridContainer);
  }

  var templates = App.templateManager ? App.templateManager.getTemplates() : [];
  var filtered = this._filterTemplates(templates, state);

  if (filtered.length === 0) {
    gridContainer.innerHTML =
      '<div class="empty-state" style="padding:40px;text-align:center;">' +
        '<div style="font-size:48px;color:var(--text-muted);margin-bottom:16px;"><i class="fas fa-cubes"></i></div>' +
        '<h3>Шаблоны не найдены</h3>' +
        '<p class="text-muted">Попробуйте изменить параметры поиска или фильтр</p>' +
      '</div>';
    return;
  }

  var grid = document.createElement('div');
  grid.className = 'grid grid-3';

  filtered.forEach(function(tpl) {
    var card = document.createElement('div');
    card.className = 'card card-hoverable template-card';
    card.setAttribute('data-template-id', tpl.id);

    var icon = tpl.icon || 'fa-cube';
    var difficulty = tpl.difficulty || 'beginner';
    var difficultyLabels = { beginner: 'Начальный', intermediate: 'Средний', advanced: 'Продвинутый' };
    var diffLabel = difficultyLabels[difficulty] || difficulty;
    var difficultyClass = difficulty === 'beginner' ? 'badge-info' : (difficulty === 'intermediate' ? 'badge-warning' : 'badge-danger');

    var tagsHtml = '';
    if (tpl.tags && tpl.tags.length > 0) {
      tagsHtml = tpl.tags.slice(0, 3).map(function(t) { return '<span class="tag">' + self._escapeHtml(t) + '</span>'; }).join('');
      if (tpl.tags.length > 3) {
        tagsHtml += '<span class="tag">+' + (tpl.tags.length - 3) + '</span>';
      }
    }

    var libsCount = tpl.libraries ? tpl.libraries.length : 0;

    card.innerHTML =
      '<div style="font-size:32px;color:var(--accent);margin-bottom:12px;"><i class="fas ' + icon + '"></i></div>' +
      '<h3 style="margin-bottom:8px;">' + self._escapeHtml(tpl.name || tpl.id) + '</h3>' +
      '<p class="text-muted" style="margin-bottom:12px;font-size:0.9rem;">' + self._escapeHtml(tpl.description || '') + '</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">' +
        '<span class="badge ' + difficultyClass + '">' + diffLabel + '</span>' +
        '<span class="badge">' + libsCount + ' библиотек</span>' +
      '</div>' +
      '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:12px;">' + tagsHtml + '</div>' +
      '<button class="btn btn-sm btn-primary use-template-btn" data-id="' + self._escapeHtml(tpl.id) + '">' +
        '<i class="fas fa-arrow-right"></i> Использовать' +
      '</button>';

    card.querySelector('.use-template-btn').addEventListener('click', function() {
      var id = this.getAttribute('data-id');
      App.state.set('selectedTemplateId', id);
      App.router.navigate('#new-project');
    });

    grid.appendChild(card);
  });

  gridContainer.innerHTML = '';
  gridContainer.appendChild(grid);
};

_comp._filterTemplates = function(templates, state) {
  if (!templates || templates.length === 0) return [];

  return templates.filter(function(tpl) {
    if (state.difficultyFilter !== 'all' && tpl.difficulty !== state.difficultyFilter) return false;

    if (state.searchQuery) {
      var q = state.searchQuery.toLowerCase();
      var name = (tpl.name || tpl.id || '').toLowerCase();
      var desc = (tpl.description || '').toLowerCase();
      var tags = (tpl.tags || []).join(' ').toLowerCase();
      if (name.indexOf(q) === -1 && desc.indexOf(q) === -1 && tags.indexOf(q) === -1) return false;
    }

    return true;
  });
};

_comp._escapeHtml = function(str) {
  if (!str) return '';
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
};
})();
