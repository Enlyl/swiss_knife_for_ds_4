(function () {
  'use strict';

  function highlightPython(code) {
    return code
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/(#.*)/g, '<span class="token-comment">$1</span>')
      .replace(/(['"])(?:(?!\1|\\).|\\.)*\1/g, '<span class="token-string">$&</span>')
      .replace(/\b(def|class|import|from|return|if|else|elif|for|while|try|except|with|as|pass|None|True|False|and|or|not|in|is|lambda|yield|async|await)\b/g, '<span class="token-keyword">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="token-number">$1</span>');
  }

  function getProject() {
    var id = App.state.get('currentProjectId');
    if (!id) return null;
    return App.projectManager ? App.projectManager.getProject(id) : null;
  }

  function escHtml(str) {
    if (typeof str !== 'string') return '';
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function formatDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    var dd = String(d.getDate()).padStart(2, '0');
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var yyyy = d.getFullYear();
    return dd + '.' + mm + '.' + yyyy;
  }

  function getTemplateColor(templateId) {
    if (!App.templateManager) return 'var(--accent)';
    var t = App.templateManager.getTemplate(templateId);
    return t && t.color ? t.color : 'var(--accent)';
  }

  function getTemplateIcon(templateId) {
    if (!App.templateManager) return 'fa-cube';
    var t = App.templateManager.getTemplate(templateId);
    return t && t.icon ? t.icon : 'fa-cube';
  }

  function getTemplateName(templateId) {
    if (!App.templateManager) return '';
    var t = App.templateManager.getTemplate(templateId);
    return t ? t.name : '';
  }

  function getStatusLabel(status) {
    var labels = { planning: 'Планирование', active: 'В работе', completed: 'Завершён' };
    return labels[status] || status || '—';
  }

  function getStatusClass(status) {
    var classes = { planning: 'badge-warning', active: 'badge-info', completed: 'badge-success' };
    return classes[status] || 'badge';
  }

  function renderProjectSelector(selectedId) {
    var projects = App.projectManager ? App.projectManager.getAllProjects() : [];
    var html = '<div class="form-group" style="margin-bottom:20px">';
    html += '<label class="form-label">Проект</label>';
    html += '<select class="select" id="roadmapProjectSelect">';
    html += '<option value="">— Выберите проект —</option>';
    for (var i = 0; i < projects.length; i++) {
      var sel = projects[i].id === selectedId ? ' selected' : '';
      html += '<option value="' + projects[i].id + '"' + sel + '>' + escHtml(projects[i].name) + '</option>';
    }
    html += '</select></div>';
    return html;
  }

  function renderProgressCard(project) {
    var prog = project.progress || { roadmap: 0, setup: 0, total: 0 };
    var done = 0;
    var total = project.roadmap.length || 0;
    for (var i = 0; i < project.roadmap.length; i++) {
      if (project.roadmap[i].done) done++;
    }
    var templateIcon = getTemplateIcon(project.templateId);
    var templateColor = getTemplateColor(project.templateId);
    var templateName = getTemplateName(project.templateId);
    var statusLabel = getStatusLabel(project.status);
    var statusClass = getStatusClass(project.status);
    var html = '<div class="card" style="margin-bottom:16px">';
    html += '<div style="display:flex;align-items:flex-start;gap:20px;flex-wrap:wrap">';
    html += '<div style="flex:1;min-width:180px;display:flex;flex-direction:column;align-items:center;padding:4px 0">';
    html += '<div style="font-size:2.5rem;font-weight:700;color:var(--accent);line-height:1.1">' + prog.total + '%</div>';
    html += '<div class="progress-bar" style="max-width:260px;margin:10px 0;height:10px;width:100%"><div class="progress-fill" style="width:' + prog.total + '%"></div></div>';
    html += '<div style="font-size:0.85rem;color:var(--text-secondary)">Завершено: ' + done + ' из ' + total + ' шагов</div>';
    html += '</div>';
    html += '<div style="flex:1;min-width:160px">';
    html += '<div style="display:flex;flex-direction:column;gap:8px">';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;font-size:0.8rem"><span style="color:var(--text-secondary)">Roadmap</span><span style="font-weight:600;color:var(--accent)">' + prog.roadmap + '%</span></div>';
    html += '<div class="progress-bar" style="height:6px"><div class="progress-fill" style="width:' + prog.roadmap + '%"></div></div>';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;font-size:0.8rem"><span style="color:var(--text-secondary)">Настройка</span><span style="font-weight:600;color:var(--success)">' + prog.setup + '%</span></div>';
    html += '<div class="progress-bar" style="height:6px"><div class="progress-fill" style="width:' + prog.setup + '%;background:var(--success-gradient, var(--success))"></div></div>';
    html += '</div></div>';
    html += '<div style="min-width:120px">';
    html += '<div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">Статус</div>';
    html += '<span class="badge ' + statusClass + '" style="margin-bottom:8px">' + statusLabel + '</span>';
    html += '<div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">Шаблон</div>';
    html += '<div style="display:flex;align-items:center;gap:6px;font-size:0.85rem">';
    html += '<i class="fas ' + templateIcon + '" style="color:' + templateColor + '"></i>';
    html += '<span>' + escHtml(templateName) + '</span>';
    html += '</div>';
    html += '<div style="font-size:0.75rem;color:var(--text-muted);margin-top:8px;margin-bottom:4px">Создан</div>';
    html += '<div style="font-size:0.85rem">' + formatDate(project.createdAt) + '</div>';
    html += '</div></div></div>';
    return html;
  }

  function renderRecommendation(project) {
    var rec = null;
    if (App.aiService && typeof App.aiService.getNextBestAction === 'function') {
      try { rec = App.aiService.getNextBestAction(project); } catch (e) { rec = null; }
    }
    var explanation = '';
    if (rec && rec.action && App.aiService && typeof App.aiService.explainStep === 'function') {
      try { explanation = App.aiService.explainStep(rec.action, project.templateId); } catch (e) { explanation = ''; }
    }
    var analysis = null;
    if (App.aiService && typeof App.aiService.analyzeProject === 'function') {
      try { analysis = App.aiService.analyzeProject(project); } catch (e) { analysis = null; }
    }
    var html = '<div class="card" style="margin-bottom:16px;border-left:3px solid var(--purple);padding:16px 20px">';
    html += '<div style="display:flex;align-items:flex-start;gap:12px">';
    html += '<div style="font-size:1.5rem;flex-shrink:0;line-height:1;margin-top:2px">🎯</div>';
    html += '<div style="flex:1;min-width:0">';
    if (rec) {
      html += '<div style="font-weight:600;font-size:0.95rem;color:var(--text-primary);margin-bottom:4px">Следующий шаг: ' + escHtml(rec.action) + '</div>';
      html += '<div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:6px">' + escHtml(rec.description) + '</div>';
      if (rec.priority) {
        var priorityColors = { high: 'var(--error)', medium: 'var(--warning)', low: 'var(--text-muted)' };
        var pc = priorityColors[rec.priority] || 'var(--text-muted)';
        html += '<span class="badge" style="background:' + pc + '22;color:' + pc + ';font-size:0.6rem">' + rec.priority.toUpperCase() + '</span>';
      }
      if (rec.category) {
        var catLabels = { setup: 'Настройка', roadmap: 'Roadmap', completed: 'Завершено' };
        var catLabel = catLabels[rec.category] || rec.category;
        html += '<span class="badge badge-info" style="font-size:0.6rem;margin-left:6px">' + escHtml(catLabel) + '</span>';
      }
      if (explanation) {
        html += '<div style="margin-top:10px;padding:10px 12px;background:var(--bg-tertiary);border-radius:var(--radius);font-size:0.8rem;color:var(--text-secondary);line-height:1.5;border-left:2px solid var(--purple)">';
        html += '<div style="font-weight:500;color:var(--text-primary);margin-bottom:2px;font-size:0.75rem">Почему это важно:</div>';
        html += escHtml(explanation);
        html += '</div>';
      }
    } else {
      html += '<div style="font-weight:600;font-size:0.95rem;color:var(--text-primary);margin-bottom:4px">Все шаги выполнены</div>';
      html += '<div style="font-size:0.8rem;color:var(--text-secondary)">Отличная работа! Проект готов к следующему этапу.</div>';
    }
    html += '</div></div>';
    if (analysis && analysis.health) {
      var healthColors = { excellent: 'var(--success)', good: 'var(--accent)', bad: 'var(--error)' };
      var healthLabels = { excellent: 'Отличное', good: 'Хорошее', bad: 'Требует внимания' };
      var hc = healthColors[analysis.health] || 'var(--text-muted)';
      var hl = healthLabels[analysis.health] || analysis.health;
      html += '<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);display:flex;align-items:center;gap:12px;flex-wrap:wrap">';
      html += '<div style="display:flex;align-items:center;gap:6px;font-size:0.8rem"><span style="color:var(--text-muted)">Здоровье проекта:</span><span class="badge" style="background:' + hc + '22;color:' + hc + '">' + hl + '</span></div>';
      if (analysis.issues && analysis.issues.length) {
        html += '<div style="display:flex;align-items:center;gap:4px;font-size:0.8rem"><span style="color:var(--text-muted)">Замечания:</span><span style="color:var(--warning);font-weight:600">' + analysis.issues.length + '</span></div>';
      }
      if (analysis.suggestions && analysis.suggestions.length) {
        html += '<div style="display:flex;align-items:center;gap:4px;font-size:0.8rem"><span style="color:var(--text-muted)">Советы:</span><span style="color:var(--accent);font-weight:600">' + analysis.suggestions.length + '</span></div>';
      }
      html += '</div>';
      if (analysis.issues && analysis.issues.length) {
        html += '<div style="margin-top:8px">';
        for (var ii = 0; ii < Math.min(3, analysis.issues.length); ii++) {
          var iss = analysis.issues[ii];
          var sevColor = iss.severity === 'error' ? 'var(--error)' : iss.severity === 'warning' ? 'var(--warning)' : 'var(--text-muted)';
          html += '<div style="display:flex;align-items:flex-start;gap:6px;font-size:0.75rem;padding:3px 0;color:var(--text-secondary)">';
          html += '<i class="fas fa-' + (iss.severity === 'error' ? 'exclamation-circle' : iss.severity === 'warning' ? 'exclamation-triangle' : 'info-circle') + '" style="color:' + sevColor + ';margin-top:2px;flex-shrink:0"></i>';
          html += '<span>' + escHtml(iss.text) + '</span></div>';
        }
        html += '</div>';
      }
    }
    html += '</div>';
    return html;
  }

  function renderTimeline(project) {
    var roadmap = project.roadmap || [];
    var html = '<div class="roadmap">';
    var foundActive = false;
    for (var i = 0; i < roadmap.length; i++) {
      var step = roadmap[i];
      var isCompleted = step.done;
      var isActive = !isCompleted && !foundActive;
      if (isActive) foundActive = true;
      var itemClass = isCompleted ? 'roadmap-completed' : (isActive ? 'roadmap-active' : 'roadmap-pending');
      var icon = isCompleted ? 'fa-check-circle' : (isActive ? 'fa-chevron-right' : 'fa-circle');
      var iconColor = isCompleted ? 'var(--success)' : (isActive ? 'var(--accent)' : 'var(--text-muted)');
      var badgeClass = isCompleted ? 'badge-success' : (isActive ? 'badge-info' : 'badge');
      var badgeText = isCompleted ? 'Выполнено' : (isActive ? 'В процессе' : 'Ожидает');
      html += '<div class="roadmap-item ' + itemClass + '" data-step-idx="' + i + '">';
      html += '<div class="roadmap-node"><i class="fas ' + icon + '"></i></div>';
      html += '<div class="roadmap-content">';
      html += '<div class="roadmap-title">' + escHtml(step.title) + '</div>';
      html += '<div class="roadmap-description">' + escHtml(step.description) + '</div>';
      html += '<div class="roadmap-meta" style="margin-top:8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">';
      html += '<span class="badge ' + badgeClass + '">' + badgeText + '</span>';
      if (step.id) {
        html += '<span style="font-size:0.65rem;color:var(--text-muted)">' + escHtml(step.id) + '</span>';
      }
      html += '</div>';
      html += '<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">';
      if (!isCompleted) {
        html += '<button class="btn btn-sm btn-primary mark-step-btn" data-step="' + i + '"><i class="fas fa-check"></i> Отметить выполненным</button>';
      } else {
        html += '<button class="btn btn-sm btn-ghost unmark-step-btn" data-step="' + i + '"><i class="fas fa-undo"></i> Отменить</button>';
      }
      if (App.aiService && typeof App.aiService.explainStep === 'function') {
        html += '<button class="btn btn-sm btn-ghost explain-step-btn" data-step="' + i + '" data-title="' + escHtml(step.title) + '"><i class="fas fa-lightbulb"></i> Подробнее</button>';
      }
      html += '</div>';
      html += '</div></div>';
      if (i < roadmap.length - 1) {
        html += '<div class="roadmap-line"></div>';
      }
    }
    html += '</div>';
    if (!foundActive && roadmap.length > 0) {
      html += '<div style="margin-top:20px;padding:16px;background:var(--success-bg);border-radius:var(--radius);text-align:center">';
      html += '<i class="fas fa-trophy" style="color:var(--success);font-size:1.5rem;margin-bottom:8px"></i>';
      html += '<div style="font-weight:600;color:var(--success);font-size:1rem">Все шаги выполнены!</div>';
      html += '<div style="font-size:0.8rem;color:var(--text-secondary);margin-top:4px">Проект полностью завершён. Отличная работа!</div>';
      html += '</div>';
    }
    return html;
  }

  App.registerComponent({
    id: 'roadmap',
    title: 'Roadmap',
    icon: 'fa-map',
    init: function () {
      var self = this;
      this._listener = App.events.on('project:updated', function () {
        if (self._container) {
          self.render(self._container);
        }
      });
    },
    destroy: function () {
      if (this._listener) {
        this._listener();
        this._listener = null;
      }
      this._container = null;
    },
    render: function (container) {
      this._container = container;
      var project = getProject();
      if (!project) {
        container.innerHTML = '<div class="page-content">' +
          '<div class="empty-state">' +
          '<div class="empty-state-icon"><i class="fas fa-map"></i></div>' +
          '<div class="empty-state-title">Проект не выбран</div>' +
          '<div class="empty-state-text">Создайте проект, чтобы увидеть Roadmap с прогрессом и рекомендациями</div>' +
          '<button class="btn btn-primary" id="roadmapCreateProjectBtn"><i class="fas fa-plus-circle"></i> Создать проект</button>' +
          '</div></div>';
        var btn = container.querySelector('#roadmapCreateProjectBtn');
        if (btn) {
          btn.addEventListener('click', function () {
            App.router.navigate('#new-project');
          });
        }
        return;
      }
      var templateIcon = getTemplateIcon(project.templateId);
      var templateColor = getTemplateColor(project.templateId);
      var html = '<div class="page-content">';
      html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px;flex-wrap:wrap">';
      html += '<h1 style="font-size:1.5rem;margin:0;display:flex;align-items:center;gap:10px"><i class="fas ' + templateIcon + '" style="color:' + templateColor + '"></i>' + escHtml(project.name) + '</h1>';
      html += '<span class="badge ' + getStatusClass(project.status) + '" style="font-size:0.6rem">' + getStatusLabel(project.status) + '</span>';
      html += '</div>';
      html += renderProjectSelector(project.id);
      html += renderProgressCard(project);
      html += renderRecommendation(project);
      html += '<div class="card">';
      html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px">';
      html += '<div style="font-weight:600;font-size:1rem;color:var(--text-primary)"><i class="fas fa-list-check" style="margin-right:8px;color:var(--accent)"></i>План проекта (Roadmap)</div>';
      var roadmap = project.roadmap || [];
      if (roadmap.length > 0) {
        html += '<button class="btn btn-sm btn-ghost" id="scrollToActiveBtn" style="font-size:0.75rem"><i class="fas fa-arrow-down"></i> К активному шагу</button>';
      }
      html += '</div>';
      html += renderTimeline(project);
      html += '</div></div>';
      container.innerHTML = html;
      var sel = container.querySelector('#roadmapProjectSelect');
      if (sel) {
        sel.addEventListener('change', function () {
          var val = this.value;
          if (!val) return;
          if (App.projectManager) {
            App.projectManager.setCurrentProject(val);
          }
          App.state.set('currentProjectId', val);
          App.events.emit('project:updated');
          App.router.navigate('#roadmap');
        });
      }
      container.querySelectorAll('.mark-step-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var idx = parseInt(this.getAttribute('data-step'));
          var proj = getProject();
          if (!proj || !proj.roadmap || !proj.roadmap[idx]) return;
          proj.roadmap[idx].done = true;
          var allDone = true;
          for (var si = 0; si < proj.roadmap.length; si++) {
            if (!proj.roadmap[si].done) { allDone = false; break; }
          }
          if (allDone && proj.status !== 'completed') {
            proj.status = 'completed';
          } else if (proj.status === 'planning') {
            proj.status = 'active';
          }
          if (App.projectManager) {
            App.projectManager.calculateProgress(proj);
            App.projectManager._save();
          }
          App.ui.showToast('Шаг "' + proj.roadmap[idx].title + '" выполнен', 'success');
          var rec = null;
          if (App.aiService && typeof App.aiService.getNextBestAction === 'function') {
            try { rec = App.aiService.getNextBestAction(proj); } catch (e) { rec = null; }
          }
          if (rec && rec.action && rec.category !== 'completed') {
            setTimeout(function () {
              App.ui.showToast('Следующий шаг: ' + rec.action, 'info');
            }, 800);
          } else if (allDone) {
            setTimeout(function () {
              App.ui.showToast('Поздравляем! Все шаги roadmap выполнены!', 'success');
            }, 800);
          }
          App.events.emit('project:updated', { project: proj });
        });
      });
      container.querySelectorAll('.unmark-step-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var idx = parseInt(this.getAttribute('data-step'));
          var proj = getProject();
          if (!proj || !proj.roadmap || !proj.roadmap[idx]) return;
          proj.roadmap[idx].done = false;
          if (proj.status === 'completed') {
            proj.status = 'active';
          }
          if (App.projectManager) {
            App.projectManager.calculateProgress(proj);
            App.projectManager._save();
          }
          App.ui.showToast('Шаг "' + proj.roadmap[idx].title + '" возвращён в работу', 'warning');
          App.events.emit('project:updated', { project: proj });
        });
      });
      container.querySelectorAll('.explain-step-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var idx = parseInt(this.getAttribute('data-step'));
          var title = this.getAttribute('data-title');
          var proj = getProject();
          if (!proj) return;
          var explanation = '';
          if (App.aiService && typeof App.aiService.explainStep === 'function') {
            try { explanation = App.aiService.explainStep(title, proj.templateId); } catch (e) { explanation = ''; }
          }
          if (!explanation) {
            explanation = 'Этот шаг является частью roadmap проекта "' + escHtml(proj.name) + '". Следуйте описанию шага и используйте рекомендуемые библиотеки.';
          }
          App.ui.showModal({
            title: 'Подробнее о шаге: ' + escHtml(title),
            body: '<div style="line-height:1.6;font-size:0.9rem;color:var(--text-secondary)">' + escHtml(explanation) + '</div>',
            size: 'sm',
            confirmText: 'Понятно',
            showCancel: false
          });
        });
      });
      var scrollBtn = container.querySelector('#scrollToActiveBtn');
      if (scrollBtn) {
        scrollBtn.addEventListener('click', function () {
          var activeItem = container.querySelector('.roadmap-active');
          if (activeItem) {
            activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            var items = container.querySelectorAll('.roadmap-item');
            if (items.length) {
              items[items.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        });
      }
    }
  });
})();
