(function () {
  'use strict';

  var tips = [
    'Используйте виртуальное окружение (venv или uv) для изоляции зависимостей проекта.',
    'Начинайте с простой baseline-модели, затем постепенно усложняйте.',
    'Регулярно коммитьте код в Git — это сохранит историю изменений.',
    'Документируйте свои данные и код — будущий вы скажете спасибо.',
    'Feature engineering важнее выбора модели. Уделите этому 70% времени.',
    'Используйте .gitignore чтобы не коммитить venv, __pycache__ и .env.',
    'Проверяйте данные на пропуски и выбросы перед обучением модели.',
    'Для больших данных попробуйте Polars — он в 10-50 раз быстрее pandas.',
    'MLflow помогает отслеживать эксперименты и версионировать модели.',
    'Data drift — главный враг моделей в продакшне. Мониторинг обязателен.',
  ];

  var tipsIndex = Math.floor(Math.random() * Math.max(0, tips.length - 3));

  function getStats() {
    var projects = App.projectManager ? App.projectManager.getAllProjects() : [];
    var templates = App.templateManager ? App.templateManager.getTemplates() : [];
    var completedTasks = 0;
    for (var i = 0; i < projects.length; i++) {
      var p = projects[i];
      if (p.roadmap) {
        for (var j = 0; j < p.roadmap.length; j++) {
          if (p.roadmap[j].done) completedTasks++;
        }
      }
    }
    return { projects: projects, templates: templates, completedTasks: completedTasks };
  }

  function renderTips() {
    var html = '';
    for (var i = 0; i < 3; i++) {
      var idx = (tipsIndex + i) % tips.length;
      var colors = ['accent', 'success', 'warning'];
      html += '<div class="card card-compact" style="border-left:3px solid var(--' + colors[i] + ');display:flex;align-items:flex-start;gap:12px;cursor:default">' +
        '<div style="color:var(--' + colors[i] + ');font-size:1.1rem;flex-shrink:0;margin-top:2px"><i class="fas fa-lightbulb"></i></div>' +
        '<div style="font-size:0.85rem;color:var(--text-secondary);line-height:1.5">' + tips[idx] + '</div>' +
        '</div>';
    }
    return html;
  }

  function getTemplateIcon(templateId) {
    if (!App.templateManager) return 'fa-cube';
    var t = App.templateManager.getTemplate(templateId);
    return t && t.icon ? t.icon : 'fa-cube';
  }

  function getTemplateColor(templateId) {
    if (!App.templateManager) return 'var(--accent)';
    var t = App.templateManager.getTemplate(templateId);
    return t && t.color ? t.color : 'var(--accent)';
  }

  function formatDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    var dd = String(d.getDate()).padStart(2, '0');
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var yyyy = d.getFullYear();
    return dd + '.' + mm + '.' + yyyy;
  }

  App.registerComponent({
    id: 'dashboard',
    title: 'Dashboard',
    icon: 'fa-th-large',

    init: function () {
      var self = this;
      this._listener = App.events.on('project:created', function () {
        self._needsRefresh = true;
      });
    },

    destroy: function () {
      if (this._listener) {
        this._listener();
        this._listener = null;
      }
      if (this._refreshTimer) {
        clearTimeout(this._refreshTimer);
        this._refreshTimer = null;
      }
    },

    render: function (container) {
      var stats = getStats();
      var projects = stats.projects;
      var templates = stats.templates;

      var html = '<div class="page-content">';

      /* ---- Welcome Section ---- */
      html += '<div class="mb-6">' +
        '<h1 style="font-size:1.8rem;margin-bottom:4px">Добро пожаловать в AI Project Companion!</h1>' +
        '<p style="font-size:1rem;color:var(--text-secondary);margin-bottom:24px">Ваш интеллектуальный помощник для Data Science проектов</p>' +
        '<div class="grid grid-3" style="gap:16px">' +
        '<div class="card stat-card" style="text-align:center;padding:24px 16px">' +
        '<div class="stat-icon" style="font-size:1.8rem;color:var(--accent);margin-bottom:8px"><i class="fas fa-folder-open"></i></div>' +
        '<div class="stat-value" style="font-size:1.8rem;font-weight:700;color:var(--text-primary)">' + projects.length + '</div>' +
        '<div class="stat-label" style="font-size:0.85rem;color:var(--text-muted)">Активных проектов</div>' +
        '</div>' +
        '<div class="card stat-card" style="text-align:center;padding:24px 16px">' +
        '<div class="stat-icon" style="font-size:1.8rem;color:var(--success);margin-bottom:8px"><i class="fas fa-cubes"></i></div>' +
        '<div class="stat-value" style="font-size:1.8rem;font-weight:700;color:var(--text-primary)">' + templates.length + '</div>' +
        '<div class="stat-label" style="font-size:0.85rem;color:var(--text-muted)">Доступно шаблонов</div>' +
        '</div>' +
        '<div class="card stat-card" style="text-align:center;padding:24px 16px">' +
        '<div class="stat-icon" style="font-size:1.8rem;color:var(--warning);margin-bottom:8px"><i class="fas fa-check-circle"></i></div>' +
        '<div class="stat-value" style="font-size:1.8rem;font-weight:700;color:var(--text-primary)">' + stats.completedTasks + '</div>' +
        '<div class="stat-label" style="font-size:0.85rem;color:var(--text-muted)">Выполнено задач</div>' +
        '</div>' +
        '</div>' +
        '</div>';

      /* ---- Quick Actions ---- */
      html += '<div class="mb-6">' +
        '<div class="grid grid-4">' +
        '<div class="card card-hoverable" data-action="new-project" style="cursor:pointer">' +
        '<div class="card-icon" style="background:var(--accent-light);color:var(--accent)"><i class="fas fa-plus-circle"></i></div>' +
        '<div class="card-title" style="margin-bottom:4px">Новый проект</div>' +
        '<div class="card-body" style="font-size:0.8rem">Создайте новый Data Science проект с помощью мастера</div>' +
        '</div>' +
        '<div class="card card-hoverable" data-action="templates" style="cursor:pointer">' +
        '<div class="card-icon" style="background:rgba(63,185,80,0.15);color:var(--success)"><i class="fas fa-cubes"></i></div>' +
        '<div class="card-title" style="margin-bottom:4px">Шаблоны</div>' +
        '<div class="card-body" style="font-size:0.8rem">Выберите готовый шаблон для вашей задачи</div>' +
        '</div>' +
        '<div class="card card-hoverable" data-action="csv-viewer" style="cursor:pointer">' +
        '<div class="card-icon" style="background:rgba(210,153,34,0.15);color:var(--warning)"><i class="fas fa-table"></i></div>' +
        '<div class="card-title" style="margin-bottom:4px">CSV Viewer</div>' +
        '<div class="card-body" style="font-size:0.8rem">Просмотрите и проанализируйте CSV файлы</div>' +
        '</div>' +
        '<div class="card card-hoverable" data-action="ai-assistant" style="cursor:pointer">' +
        '<div class="card-icon" style="background:rgba(188,140,255,0.15);color:var(--purple)"><i class="fas fa-robot"></i></div>' +
        '<div class="card-title" style="margin-bottom:4px">AI Помощник</div>' +
        '<div class="card-body" style="font-size:0.8rem">Получите рекомендации по вашему проекту</div>' +
        '</div>' +
        '</div>' +
        '</div>';

      /* ---- Recent Projects ---- */
      html += '<div class="mb-6">' +
        '<h2 style="font-size:1.2rem;margin-bottom:12px">Недавние проекты</h2>';

      if (projects.length === 0) {
        html += '<div class="card">' +
          '<div class="empty-state" style="padding:40px 20px">' +
          '<div class="empty-state-icon"><i class="fas fa-folder-open"></i></div>' +
          '<div class="empty-state-title">У вас пока нет проектов</div>' +
          '<div class="empty-state-text">Создайте первый!</div>' +
          '<button class="btn btn-primary" data-action="new-project"><i class="fas fa-plus-circle"></i> Создать проект</button>' +
          '</div>' +
          '</div>';
      } else {
        html += '<div class="card" style="padding:0;overflow:hidden">';
        for (var i = 0; i < Math.min(5, projects.length); i++) {
          var p = projects[i];
          var progress = p.progress ? p.progress.total || 0 : 0;
          var color = getTemplateColor(p.templateId);
          var icon = getTemplateIcon(p.templateId);
          var statusLabel = p.status === 'planning' ? 'Планирование' : p.status === 'active' ? 'В работе' : p.status === 'completed' ? 'Завершён' : p.status;
          var statusClass = p.status === 'completed' ? 'badge-success' : p.status === 'active' ? 'badge-info' : 'badge-warning';
          html += '<div class="project-row" data-project-id="' + p.id + '" style="display:flex;align-items:center;gap:12px;padding:14px 20px;cursor:pointer;transition:var(--transition);border-bottom:' + (i < projects.length - 1 && i < 4 ? '1px solid var(--border)' : 'none') + '">' +
            '<div style="width:36px;height:36px;border-radius:var(--radius);display:flex;align-items:center;justify-content:center;background:rgba(' + hexToRgb(color) + ',0.15);color:' + color + ';flex-shrink:0"><i class="fas ' + icon + '"></i></div>' +
            '<div style="flex:1;min-width:0">' +
            '<div style="font-weight:600;font-size:0.9rem;color:var(--text-primary);margin-bottom:2px" class="truncate">' + escHtml(p.name) + '</div>' +
            '<div style="display:flex;align-items:center;gap:8px;font-size:0.75rem;color:var(--text-muted)">' +
            '<span class="badge ' + statusClass + '" style="font-size:0.6rem">' + statusLabel + '</span>' +
            '<span>' + formatDate(p.createdAt) + '</span>' +
            '</div>' +
            '</div>' +
            '<div style="width:120px">' +
            '<div style="display:flex;justify-content:space-between;font-size:0.7rem;color:var(--text-muted);margin-bottom:4px"><span>Прогресс</span><span>' + progress + '%</span></div>' +
            '<div class="progress-bar" style="height:6px"><div class="progress-fill" style="width:' + progress + '%"></div></div>' +
            '</div>' +
            '</div>';
        }
        html += '</div>';
      }

      html += '</div>';

      /* ---- AI Tips ---- */
      html += '<div class="mb-6">' +
        '<h2 style="font-size:1.2rem;margin-bottom:12px">Советы AI <span style="font-size:0.75rem;color:var(--text-muted);font-weight:400">(обновляются каждый визит)</span></h2>' +
        '<div class="flex flex-col gap-2">' + renderTips() + '</div>' +
        '</div>';

      /* ---- Getting Started - Onboarding Steps ---- */
      var steps = [
        { icon: 'fa-plus-circle', label: 'Создать проект', desc: 'Задайте название и выберите Python версию', done: false, action: 'new-project', color: 'var(--accent)' },
        { icon: 'fa-cubes', label: 'Выбрать шаблон', desc: 'Готовая структура под вашу задачу', done: false, action: 'templates', color: 'var(--purple)' },
        { icon: 'fa-book', label: 'Настроить библиотеки', desc: 'Подберите зависимости для проекта', done: false, action: 'new-project', color: 'var(--success)' },
        { icon: 'fa-terminal', label: 'Запустить окружение', desc: 'Активируйте виртуальное окружение', done: false, action: 'new-project', color: 'var(--orange)' },
      ];
      var doneCount = steps.filter(function(s) { return s.done; }).length;
      var pct = Math.round(doneCount / steps.length * 100);

      html += '<div class="mb-6">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">' +
          '<h2 style="font-size:1.2rem;font-weight:700;">Начните здесь</h2>' +
          '<div style="display:flex;align-items:center;gap:10px;">' +
            '<span class="text-muted" style="font-size:0.85rem;">' + doneCount + ' из ' + steps.length + ' шагов</span>' +
            '<div class="progress-bar" style="width:120px;height:6px;"><div class="progress-fill" style="width:' + pct + '%;height:100%;"></div></div>' +
          '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;">';

      for (var si = 0; si < steps.length; si++) {
        var s = steps[si];
        var doneClass = s.done ? 'onboarding-step-done' : 'onboarding-step';
        var actionAttr = s.done ? '' : ' data-action="' + s.action + '"';
        var extraStyle = s.done ? 'opacity:0.6;pointer-events:none;' : 'cursor:pointer;';
        html +=
          '<div' + actionAttr + ' class="card ' + doneClass + '" style="padding:16px;' + extraStyle + '">' +
            '<div style="display:flex;align-items:flex-start;gap:14px;">' +
              '<div style="width:40px;height:40px;border-radius:10px;background:' + (s.done ? 'var(--success-bg)' : s.color + '20') + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1.1rem;color:' + (s.done ? 'var(--success)' : s.color) + ';">' +
                (s.done ? '<i class="fas fa-check-circle"></i>' : '<i class="fas ' + s.icon + '"></i>') +
              '</div>' +
              '<div style="flex:1;min-width:0;">' +
                '<div style="font-weight:600;font-size:0.95rem;margin-bottom:2px;color:' + (s.done ? 'var(--text-muted)' : 'var(--text-primary)') + ';">' + s.label + '</div>' +
                '<div style="font-size:0.82rem;color:var(--text-muted);">' + s.desc + '</div>' +
              '</div>' +
              (s.done ? '<span class="badge badge-success" style="flex-shrink:0;margin-top:2px;">Готово</span>' : '<span style="flex-shrink:0;font-size:0.75rem;color:var(--accent);margin-top:4px;white-space:nowrap;">Начать →</span>') +
            '</div>' +
          '</div>';
      }

      html += '</div></div>';

      html += '</div>';

      container.innerHTML = html;

      /* ---- Attach Events ---- */
      container.querySelectorAll('[data-action]').forEach(function (el) {
        el.addEventListener('click', function () {
          var action = el.getAttribute('data-action');
          if (action === 'new-project') {
            App.router.navigate('#new-project');
          } else if (action === 'templates') {
            App.router.navigate('#templates');
          } else if (action === 'csv-viewer') {
            App.router.navigate('#csv-viewer');
          } else if (action === 'ai-assistant') {
            var panel = document.getElementById('aiPanel');
            if (panel) {
              panel.classList.toggle('open');
              var input = document.getElementById('aiInput');
              if (panel.classList.contains('open') && input) {
                input.focus();
              }
            }
          }
        });
      });

      container.querySelectorAll('.project-row').forEach(function (el) {
        el.addEventListener('click', function () {
          var id = el.getAttribute('data-project-id');
          if (id) {
            if (App.projectManager) {
              App.projectManager.setCurrentProject(id);
            }
            App.router.navigate('#dashboard');
          }
        });
      });
    }
  });

  /* ---- Helpers ---- */

  function hexToRgb(hex) {
    if (!hex || hex.indexOf('var') === 0) return '88,88,88';
    var c = hex.replace('#', '');
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    var big = parseInt(c, 16);
    var r = (big >> 16) & 255;
    var g = (big >> 8) & 255;
    var b = big & 255;
    return r + ',' + g + ',' + b;
  }

  function escHtml(str) {
    if (typeof str !== 'string') return '';
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }
})();
