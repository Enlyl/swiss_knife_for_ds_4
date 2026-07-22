(function () {
  'use strict';

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

  function getTemplateInfo(id) {
    if (!id || !App.templateManager) return { icon: 'fa-cube', color: 'var(--accent)', name: '' };
    var t = App.templateManager.getTemplate(id);
    return { icon: t && t.icon ? t.icon : 'fa-cube', color: t && t.color ? t.color : 'var(--accent)', name: t ? t.name : '' };
  }

  function statusLabel(s) {
    if (s === 'planning') return 'Планирование';
    if (s === 'active') return 'В работе';
    if (s === 'completed') return 'Завершён';
    return s || 'Планирование';
  }

  function statusClass(s) {
    if (s === 'completed') return 'badge-success';
    if (s === 'active') return 'badge-info';
    return 'badge-warning';
  }

  function renderProjectCard(p) {
    var tpl = getTemplateInfo(p.templateId);
    var progress = p.progress ? (p.progress.total || 0) : 0;
    return '<div class="card card-hoverable project-card" data-id="' + escHtml(p.id) + '">' +
      '<div class="project-card-header">' +
        '<div class="project-card-icon"><i class="fas ' + tpl.icon + '" style="color:' + tpl.color + '"></i></div>' +
        '<div class="project-card-name">' + escHtml(p.name) + '</div>' +
        '<span class="badge ' + statusClass(p.status) + '">' + statusLabel(p.status) + '</span>' +
      '</div>' +
      '<div class="project-card-desc">' + (p.description ? escHtml(p.description) : '<span style="color:var(--text-muted);font-style:italic">Нет описания</span>') + '</div>' +
      '<div class="project-card-progress">' +
        '<div class="progress-bar"><div class="progress-fill" style="width:' + progress + '%"></div></div>' +
        '<span class="text-muted">' + progress + '%</span>' +
      '</div>' +
      '<div class="project-card-footer">' +
        (p.rootDir ? '<span class="text-muted small" style="display:block;font-size:0.7rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%" title="' + escHtml(p.rootDir) + '"><i class="fas fa-folder" style="margin-right:3px"></i>' + escHtml(p.rootDir) + '</span>' : '') +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:4px">' +
        '<span class="text-muted small">Создан: ' + formatDate(p.createdAt) + '</span>' +
        '<div class="project-card-actions">' +
          '<button class="btn btn-sm btn-ghost open-project-btn" title="Открыть"><i class="fas fa-arrow-right"></i></button>' +
          '<button class="btn btn-sm btn-ghost delete-project-btn" title="Удалить"><i class="fas fa-trash"></i></button>' +
        '</div></div>' +
      '</div>' +
    '</div>';
  }

  function renderEmptyState() {
    return '<div class="card" id="projectsEmptyState">' +
      '<div class="empty-state" style="padding:60px 20px;text-align:center">' +
        '<div class="empty-state-icon" style="font-size:3rem;color:var(--text-muted);margin-bottom:12px"><i class="fas fa-folder-open"></i></div>' +
        '<div class="empty-state-title" style="font-size:1.2rem;font-weight:600;margin-bottom:6px">У вас пока нет проектов</div>' +
        '<div class="empty-state-text" style="color:var(--text-muted);margin-bottom:20px">Создайте первый проект с помощью мастера</div>' +
        '<button class="btn btn-primary" id="newProjectBtn"><i class="fas fa-plus-circle"></i> Создать проект</button>' +
      '</div>' +
    '</div>';
  }

  function renderProjects(projects, container) {
    var html = '<div class="page-content">' +
      '<div class="flex items-center justify-between mb-4" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">' +
        '<h1 style="font-size:1.5rem;margin:0">Мои проекты <span style="font-size:0.85rem;color:var(--text-muted);font-weight:400">(' + projects.length + ')</span></h1>' +
        '<div style="position:relative">' +
          '<i class="fas fa-search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-muted);z-index:1;pointer-events:none"></i>' +
          '<input type="text" class="input" id="projectSearch" placeholder="Поиск проектов..." style="padding-left:32px;width:220px" autocomplete="off">' +
        '</div>' +
      '</div>';

    if (!projects.length) {
      html += renderEmptyState();
    } else {
      html += '<div class="grid grid-3" id="projectGrid">';
      for (var i = 0; i < projects.length; i++) {
        html += renderProjectCard(projects[i]);
      }
      html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;
  }

  function attachGridEvents(container) {
    container.querySelectorAll('.project-card').forEach(function (card) {
      card.addEventListener('click', function (e) {
        if (e.target.closest('.project-card-actions')) return;
        var id = card.getAttribute('data-id');
        if (id) {
          if (App.projectManager) App.projectManager.setCurrentProject(id);
          App.router.navigate('#dashboard');
        }
      });
    });

    container.querySelectorAll('.open-project-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var card = btn.closest('.project-card');
        if (!card) return;
        var id = card.getAttribute('data-id');
        if (id) {
          if (App.projectManager) App.projectManager.setCurrentProject(id);
          App.router.navigate('#dashboard');
        }
      });
    });

    container.querySelectorAll('.delete-project-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var card = btn.closest('.project-card');
        if (!card) return;
        var id = card.getAttribute('data-id');
        if (id) confirmDeleteProject(id);
      });
    });
  }

  function filterProjects(term) {
    var all = App.projectManager.getAllProjects();
    var grid = document.getElementById('projectGrid');
    if (!grid) return;
    var filtered = all;
    if (term) {
      var t = term.toLowerCase();
      filtered = all.filter(function (p) {
        return (p.name && p.name.toLowerCase().indexOf(t) !== -1) ||
               (p.description && p.description.toLowerCase().indexOf(t) !== -1);
      });
    }
    if (!filtered.length && term) {
      grid.innerHTML = '<div style="grid-column:1/-1;padding:60px 20px;text-align:center;color:var(--text-muted)">' +
        '<div style="font-size:2rem;margin-bottom:8px"><i class="fas fa-search"></i></div>' +
        '<div style="font-weight:600;margin-bottom:4px">Ничего не найдено</div>' +
        '<div style="font-size:0.85rem">Попробуйте изменить поисковый запрос</div>' +
        '</div>';
      return;
    }
    grid.innerHTML = '';
    for (var i = 0; i < filtered.length; i++) {
      grid.innerHTML += renderProjectCard(filtered[i]);
    }
    attachGridEvents(grid);
  }

  function confirmDeleteProject(id) {
    var project = App.projectManager.getProject(id);
    if (!project) return;
    App.ui.showModal({
      title: 'Удаление проекта',
      body: '<p>Вы уверены, что хотите удалить проект <strong>' + escHtml(project.name) + '</strong>?</p><p style="color:var(--error);font-size:0.85rem">Это действие нельзя отменить.</p>',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      size: 'sm',
      onConfirm: function () {
        App.projectManager.deleteProject(id);
        App.events.emit('project:deleted', { id: id });
        App.ui.showToast('Проект "' + project.name + '" удалён', 'success');
        if (_container) renderProjects(App.projectManager.getAllProjects(), _container);
        attachAllEvents();
      },
      onCancel: function () {}
    });
  }

  function attachAllEvents() {
    var searchInput = document.getElementById('projectSearch');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        filterProjects(this.value.trim());
      });
    }

    var newBtn = document.getElementById('newProjectBtn');
    if (newBtn) {
      newBtn.addEventListener('click', function () {
        App.router.navigate('#new-project');
      });
    }

    var grid = document.getElementById('projectGrid');
    if (grid) attachGridEvents(grid);
  }

  /* ---- Component ---- */

  App.registerComponent({
    id: 'projects',
    title: 'Проекты',
    icon: 'fa-folder',
    init: function () {},
    render: function (container) {
      _container = container;
      var projects = App.projectManager ? App.projectManager.getAllProjects() : [];
      renderProjects(projects, container);
      attachAllEvents();
    },
    destroy: function () {
      _container = null;
    }
  });
})();
