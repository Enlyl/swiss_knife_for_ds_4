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

  function getFileIcon(name, type) {
    if (type === 'dir') return 'fa-folder';
    var ext = name.split('.').pop().toLowerCase();
    if (ext === 'py') return 'fa-file-code';
    if (ext === 'csv' || ext === 'tsv' || ext === 'xlsx' || ext === 'xls') return 'fa-file-csv';
    if (ext === 'json' || ext === 'xml' || ext === 'yaml' || ext === 'yml' || ext === 'toml') return 'fa-file-lines';
    if (ext === 'md' || ext === 'txt') return 'fa-file-lines';
    if (ext === 'ipynb') return 'fa-file-code';
    if (ext === 'png' || ext === 'jpg' || ext === 'svg') return 'fa-file-image';
    return 'fa-file-lines';
  }

  function mergeGeneratedFiles(structure, generatedFiles) {
    var tree = [];
    var dirMap = {};

    function addToMap(items, prefix) {
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var path = prefix ? prefix + '/' + item.name : item.name;
        if (item.type === 'dir') {
          dirMap[path] = true;
          if (item.children) addToMap(item.children, path);
        }
      }
    }
    addToMap(structure, '');

    for (var key in generatedFiles) {
      if (!generatedFiles.hasOwnProperty(key)) continue;
      var parts = key.split('/');
      if (parts.length === 1) {
        var found = false;
        for (var i = 0; i < structure.length; i++) {
          if (structure[i].name === key) { found = true; break; }
        }
        if (!found) {
          structure.push({ name: key, type: 'file' });
        }
      }
    }

    for (var key2 in generatedFiles) {
      if (!generatedFiles.hasOwnProperty(key2)) continue;
      var parts2 = key2.split('/');
      if (parts2.length > 1) {
        var dirPath = parts2.slice(0, -1).join('/');
        var fileName = parts2[parts2.length - 1];
        if (!dirMap[dirPath]) {
          var segments = parts2.slice(0, -1);
          var current = structure;
          var currentPath = '';
          for (var s = 0; s < segments.length; s++) {
            var seg = segments[s];
            var parentPath = currentPath;
            currentPath = currentPath ? currentPath + '/' + seg : seg;
            var existing = null;
            for (var j = 0; j < current.length; j++) {
              if (current[j].name === seg && current[j].type === 'dir') {
                existing = current[j];
                break;
              }
            }
            if (!existing) {
              var newDir = { name: seg, type: 'dir', children: [] };
              current.push(newDir);
              dirMap[currentPath] = true;
              existing = newDir;
            }
            if (existing.children) {
              current = existing.children;
            } else {
              existing.children = [];
              current = existing.children;
            }
          }
          current.push({ name: fileName, type: 'file' });
        }
      }
    }

    return structure;
  }

  function renderFileTree(items, level, parentPath) {
    if (!items || !items.length) return '<div style="padding:8px 0;font-size:0.85rem;color:var(--text-muted)">Нет файлов</div>';
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var fullPath = parentPath ? parentPath + '/' + item.name : item.name;
      var padding = level * 16 + 8;
      if (item.type === 'dir') {
        html += '<div class="tree-item tree-folder" data-path="' + fullPath + '" style="display:flex;align-items:center;gap:6px;padding:4px ' + padding + 'px 4px 8px;cursor:pointer;border-radius:var(--radius-sm);transition:var(--transition);font-size:0.85rem">';
        html += '<i class="fas fa-folder" style="width:16px;text-align:center;color:var(--warning);flex-shrink:0"></i>';
        html += '<span>' + escHtml(item.name) + '</span>';
        html += '</div>';
        var children = item.children || [];
        html += '<div class="tree-children" style="display:none">';
        html += renderFileTree(children, level + 1, fullPath);
        html += '</div>';
      } else {
        var fileIcon = getFileIcon(item.name, 'file');
        var iconColor = fileIcon === 'fa-file-code' ? 'var(--accent)' : fileIcon === 'fa-file-csv' ? 'var(--success)' : 'var(--text-muted)';
        html += '<div class="tree-item tree-file" data-path="' + fullPath + '" data-file="' + fullPath + '" style="display:flex;align-items:center;gap:6px;padding:4px ' + padding + 'px 4px 8px;cursor:pointer;border-radius:var(--radius-sm);transition:var(--transition);font-size:0.85rem">';
        html += '<i class="fas ' + fileIcon + '" style="width:16px;text-align:center;color:' + iconColor + ';flex-shrink:0"></i>';
        html += '<span>' + escHtml(item.name) + '</span>';
        html += '</div>';
      }
    }
    return html;
  }

  function renderProjectSelector(selectedId) {
    var projects = App.projectManager ? App.projectManager.getAllProjects() : [];
    var html = '<div class="form-group" style="margin-bottom:16px">';
    html += '<select class="select" id="inspectorProjectSelect">';
    html += '<option value="">— Выберите проект —</option>';
    for (var i = 0; i < projects.length; i++) {
      var sel = projects[i].id === selectedId ? ' selected' : '';
      html += '<option value="' + projects[i].id + '"' + sel + '>' + escHtml(projects[i].name) + '</option>';
    }
    html += '</select></div>';
    return html;
  }

  function renderDepsTab(project) {
    var template = App.templateManager ? App.templateManager.getTemplate(project.templateId) : null;
    var libs = template && template.libraries ? template.libraries : [];
    if (!libs.length) {
      var projectLibs = project.libraries || [];
      for (var i = 0; i < projectLibs.length; i++) {
        libs.push({ name: projectLibs[i], description: '', category: 'project', checked: true, popular: false, required: false });
      }
    }
    var html = '<div style="padding:8px 0">';
    if (!libs.length) {
      html += '<div style="font-size:0.85rem;color:var(--text-muted);padding:20px 0;text-align:center">Нет зависимостей</div>';
    } else {
      var categories = {};
      for (var j = 0; j < libs.length; j++) {
        var l = libs[j];
        var cat = l.category || 'other';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(l);
      }
      var catLabels = { core: 'Основные', viz: 'Визуализация', ml: 'ML', dl: 'DL', nlp: 'NLP', cv: 'CV', ts: 'Time Series', recsys: 'Рекомендации', mlops: 'MLOps', agents: 'Агенты', web: 'Веб', net: 'Сеть', io: 'Ввод/Вывод', tools: 'Инструменты', llm: 'LLM', project: 'Проект', other: 'Прочее' };
      for (var catKey in categories) {
        if (categories.hasOwnProperty(catKey)) {
          html += '<div style="font-size:0.75rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em;margin:12px 0 6px 0">' + (catLabels[catKey] || catKey) + '</div>';
          var catLibs = categories[catKey];
          for (var k = 0; k < catLibs.length; k++) {
            var lib = catLibs[k];
            html += '<span class="tag tag-sm" style="margin:2px 4px 2px 0;' + (lib.required ? 'border-color:var(--accent);color:var(--accent)' : '') + '">';
            if (lib.popular) html += '<i class="fas fa-star" style="font-size:0.55rem;color:var(--warning);margin-right:3px"></i>';
            html += escHtml(lib.name) + '</span>';
          }
        }
      }
    }
    html += '</div>';
    return html;
  }

  function renderConfigTab(project) {
    var files = project.generatedFiles || {};
    var configKeys = [];
    for (var key in files) {
      if (files.hasOwnProperty(key)) {
        if (key === 'pyproject.toml' || key === '.gitignore' || key === 'requirements.txt' || key === '.env.example' || key === 'Makefile') {
          configKeys.push(key);
        }
      }
    }
    if (!configKeys.length) {
      for (var fk in files) {
        if (files.hasOwnProperty(fk)) configKeys.push(fk);
      }
    }
    var html = '<div style="padding:8px 0">';
    if (!configKeys.length) {
      html += '<div style="font-size:0.85rem;color:var(--text-muted);padding:20px 0;text-align:center">Нет сгенерированных конфигов. Создайте проект с шаблоном.</div>';
    } else {
      for (var i = 0; i < configKeys.length; i++) {
        var name = configKeys[i];
        var content = files[name] || '';
        html += '<div style="margin-bottom:12px">';
        html += '<div style="font-weight:600;font-size:0.85rem;color:var(--text-primary);margin-bottom:4px"><i class="fas fa-file-lines" style="margin-right:6px;color:var(--text-muted)"></i>' + escHtml(name) + '</div>';
        html += '<div class="code-block" style="max-height:200px;overflow:auto;font-size:0.75rem"><div class="code-content">' + highlightPython(escHtml(content)) + '</div></div>';
        html += '</div>';
      }
    }
    html += '</div>';
    return html;
  }

  function renderTestsTab(project) {
    var structure = project.structure || [];
    var generatedFiles = project.generatedFiles || {};
    var testItems = [];
    function findTests(items, path) {
      for (var i = 0; i < items.length; i++) {
        var p = path ? path + '/' + items[i].name : items[i].name;
        if (items[i].type === 'dir') {
          if (items[i].name === 'tests') {
            testItems.push({ name: p, type: 'dir', children: items[i].children || [] });
          }
          findTests(items[i].children || [], p);
        }
      }
    }
    findTests(structure, '');
    for (var key in generatedFiles) {
      if (generatedFiles.hasOwnProperty(key) && key.indexOf('test') !== -1) {
        testItems.push({ name: key, type: 'file' });
      }
    }
    var html = '<div style="padding:8px 0">';
    if (!testItems.length) {
      html += '<div style="font-size:0.85rem;color:var(--text-muted);padding:20px 0;text-align:center">Нет тестов в структуре проекта</div>';
    } else {
      for (var i = 0; i < testItems.length; i++) {
        var ti = testItems[i];
        if (ti.type === 'dir') {
          html += '<div style="margin-bottom:8px">';
          html += '<div style="font-weight:600;font-size:0.85rem;color:var(--text-primary);margin-bottom:4px"><i class="fas fa-folder-open" style="margin-right:6px;color:var(--warning)"></i>' + escHtml(ti.name) + '</div>';
          function listFiles(items, level) {
            var h = '';
            for (var j = 0; j < items.length; j++) {
              var pad = level * 16 + 16;
              var ic = items[j].type === 'dir' ? 'fa-folder' : 'fa-file-code';
              var icColor = items[j].type === 'dir' ? 'var(--warning)' : 'var(--accent)';
              h += '<div style="padding:3px ' + pad + 'px 3px 8px;font-size:0.8rem;color:var(--text-secondary)"><i class="fas ' + ic + '" style="width:14px;margin-right:6px;color:' + icColor + ';font-size:0.7rem"></i>' + escHtml(items[j].name) + '</div>';
              if (items[j].children) h += listFiles(items[j].children, level + 1);
            }
            return h;
          }
          html += listFiles(ti.children || [], 0);
          html += '</div>';
        } else {
          html += '<div style="padding:3px 8px;font-size:0.8rem;color:var(--text-secondary)"><i class="fas fa-file-code" style="width:14px;margin-right:6px;color:var(--accent);font-size:0.7rem"></i>' + escHtml(ti.name) + '</div>';
        }
      }
    }
    html += '</div>';
    return html;
  }

  function renderFileContent(project, filePath, fileName) {
    var files = project.generatedFiles || {};
    var content = files[filePath] || files[fileName] || null;
    if (!content) {
      for (var key in files) {
        if (files.hasOwnProperty(key) && key === filePath) {
          content = files[key];
          break;
        }
      }
    }
    if (!content && filePath) {
      var parts = filePath.split('/');
      var fname = parts[parts.length - 1];
      for (var k in files) {
        if (files.hasOwnProperty(k) && k.indexOf(fname) !== -1) {
          content = files[k];
          break;
        }
      }
    }
    var breadcrumb = 'Проект';
    if (filePath) {
      var parts = filePath.split('/');
      for (var i = 0; i < parts.length; i++) {
        breadcrumb += ' > ' + parts[i];
      }
    }
    var html = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border)">';
    html += '<div style="font-size:0.8rem;color:var(--text-muted)">' + escHtml(breadcrumb) + '</div>';
    html += '</div>';
    if (content === null || content === undefined) {
      html += '<div class="empty-state" style="padding:40px 0">';
      html += '<div class="empty-state-icon" style="width:48px;height:48px;font-size:1.2rem"><i class="fas fa-file"></i></div>';
      html += '<div class="empty-state-title" style="font-size:1rem">Выберите файл для просмотра</div>';
      html += '<div class="empty-state-text">Нажмите на файл в дереве слева</div>';
      html += '</div>';
    } else {
      var isPython = fileName && fileName.endsWith('.py');
      var highlighted = isPython ? highlightPython(escHtml(content)) : escHtml(content);
      var lines = content.split('\n');
      var displayName = filePath ? filePath.split('/').pop() : (fileName || '');
      html += '<div class="code-block">';
      html += '<div class="code-header"><span class="code-lang"><i class="fas fa-code"></i> ' + escHtml(displayName) + '</span><div class="code-actions"><button class="btn btn-sm btn-ghost copy-file-btn" style="font-size:0.7rem"><i class="fas fa-copy"></i> Копировать</button></div></div>';
      html += '<div class="code-content" style="counter-reset:line">';
      for (var j = 0; j < lines.length; j++) {
        var lineNum = j + 1;
        var lineContent = isPython ? highlightPython(escHtml(lines[j])) : escHtml(lines[j]);
        html += '<div class="code-line" style="display:flex"><span style="width:32px;flex-shrink:0;color:var(--text-muted);user-select:none;text-align:right;margin-right:12px;font-size:0.7rem">' + lineNum + '</span><span>' + lineContent + '</span></div>';
      }
      html += '</div></div>';
    }
    return html;
  }

  App.registerComponent({
    id: 'inspector',
    title: 'Инспектор',
    icon: 'fa-search',
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
        var projects = App.projectManager ? App.projectManager.getAllProjects() : [];
        if (projects.length === 0) {
          container.innerHTML = '<div class="page-content">' +
            '<div class="empty-state">' +
            '<div class="empty-state-icon"><i class="fas fa-search"></i></div>' +
            '<div class="empty-state-title">Нет проектов</div>' +
            '<div class="empty-state-text">Создайте проект через <strong>Новый проект</strong> в сайдбаре, затем возвращайтесь сюда для инспекции</div>' +
            '</div></div>';
        } else {
          container.innerHTML = '<div class="page-content" style="padding:40px 20px">' +
            '<div style="max-width:480px;margin:0 auto">' +
            '<div style="text-align:center;margin-bottom:24px">' +
            '<div style="font-size:2.5rem;color:var(--accent);margin-bottom:12px"><i class="fas fa-search"></i></div>' +
            '<h2 style="font-size:1.2rem;margin-bottom:4px">Выберите проект</h2>' +
            '<p style="color:var(--text-secondary);font-size:0.9rem">Выберите проект из списка, чтобы инспектировать его файлы, зависимости и конфигурацию</p>' +
            '</div>' +
            renderProjectSelector('') +
            '</div></div>';
          var sel = container.querySelector('#inspectorProjectSelect');
          if (sel) {
            sel.addEventListener('change', function () {
              var val = this.value;
              if (!val) return;
              if (App.projectManager) App.projectManager.setCurrentProject(val);
              App.state.set('currentProjectId', val);
              App.events.emit('project:updated');
              App.router.navigate('#inspector');
            });
          }
        }
        return;
      }
      var structure = App.projectManager ? App.projectManager.getProjectStructure(project).slice() : [];
      if (project.generatedFiles) {
        structure = mergeGeneratedFiles(structure, project.generatedFiles);
      }
      var html = '<div class="page-content" style="display:flex;flex-direction:column;height:100%;padding:0">';
      html += '<div style="padding:16px 20px 0 20px">';
      html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">';
      html += '<h1 style="font-size:1.3rem;margin:0"><i class="fas fa-search" style="color:var(--accent);margin-right:8px"></i>Инспектор</h1>';
      html += '<div style="flex:1;max-width:300px">' + renderProjectSelector(project.id) + '</div>';
      html += '</div></div>';
      html += '<div class="split-view" style="flex:1;display:flex;border-top:1px solid var(--border);overflow:hidden">';
      html += '<div class="split-left" id="inspectorLeft" style="flex:0 0 35%;display:flex;flex-direction:column;padding:0;overflow:hidden">';
      html += '<div class="tabs" style="display:flex;flex-direction:column;height:100%">';
      html += '<div class="tab-header">';
      html += '<button class="tab active" data-tab="files"><i class="fas fa-folder-tree"></i> Файлы</button>';
      html += '<button class="tab" data-tab="deps"><i class="fas fa-cubes"></i> Зависимости</button>';
      html += '<button class="tab" data-tab="config"><i class="fas fa-cog"></i> Конфиг</button>';
      html += '<button class="tab" data-tab="tests"><i class="fas fa-vial"></i> Тесты</button>';
      html += '</div>';
      html += '<div class="tab-panel active" data-panel="files" style="flex:1;overflow-y:auto;padding:8px 12px">';
      html += renderFileTree(structure, 0, '');
      html += '</div>';
      html += '<div class="tab-panel" data-panel="deps" style="flex:1;overflow-y:auto;padding:8px 16px;display:none">';
      html += renderDepsTab(project);
      html += '</div>';
      html += '<div class="tab-panel" data-panel="config" style="flex:1;overflow-y:auto;padding:8px 16px;display:none">';
      html += renderConfigTab(project);
      html += '</div>';
      html += '<div class="tab-panel" data-panel="tests" style="flex:1;overflow-y:auto;padding:8px 16px;display:none">';
      html += renderTestsTab(project);
      html += '</div>';
      html += '</div></div>';
      html += '<div class="split-divider" id="inspectorDivider" style="flex:0 0 5px;cursor:col-resize;background:var(--border);border:none;margin:0;position:relative;z-index:10"></div>';
      html += '<div class="split-right" style="flex:1;padding:16px 20px;overflow-y:auto;min-width:0" id="inspectorFileViewer">';
      html += renderFileContent(project, null, null);
      html += '</div></div></div>';
      container.innerHTML = html;

      var sel = container.querySelector('#inspectorProjectSelect');
      if (sel) {
        sel.addEventListener('change', function () {
          var val = this.value;
          if (!val) return;
          if (App.projectManager) App.projectManager.setCurrentProject(val);
          App.state.set('currentProjectId', val);
          App.events.emit('project:updated');
          App.router.navigate('#inspector');
        });
      }
      container.querySelectorAll('.tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
          var tabName = this.getAttribute('data-tab');
          container.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
          this.classList.add('active');
          container.querySelectorAll('.tab-panel').forEach(function (p) {
            p.style.display = 'none';
          });
          var panel = container.querySelector('.tab-panel[data-panel="' + tabName + '"]');
          if (panel) panel.style.display = '';
        });
      });
      container.querySelectorAll('.tree-folder').forEach(function (folder) {
        folder.addEventListener('click', function () {
          var children = this.nextElementSibling;
          if (!children || !children.classList.contains('tree-children')) return;
          var isVisible = children.style.display !== 'none';
          children.style.display = isVisible ? 'none' : '';
          var icon = this.querySelector('.fas');
          if (icon) {
            icon.className = 'fas ' + (isVisible ? 'fa-folder' : 'fa-folder-open');
          }
        });
      });
      container.querySelectorAll('.tree-file').forEach(function (fileEl) {
        fileEl.addEventListener('click', function () {
          var filePath = this.getAttribute('data-path');
          var fileName = this.getAttribute('data-file');
          container.querySelectorAll('.tree-file').forEach(function (f) {
            f.style.background = '';
          });
          this.style.background = 'var(--bg-active)';
          var proj = getProject();
          var viewer = container.querySelector('#inspectorFileViewer');
          if (proj && viewer) {
            viewer.innerHTML = renderFileContent(proj, filePath, fileName);
            var copyBtn = viewer.querySelector('.copy-file-btn');
            if (copyBtn) {
              copyBtn.addEventListener('click', function () {
                var files = proj.generatedFiles || {};
                var content = files[filePath] || files[fileName] || '';
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(content).then(function () {
                    App.ui.showToast('Содержимое скопировано', 'success');
                  }).catch(function () {
                    App.ui.showToast('Ошибка копирования', 'error');
                  });
                } else {
                  var ta = document.createElement('textarea');
                  ta.value = content;
                  document.body.appendChild(ta);
                  ta.select();
                  document.execCommand('copy');
                  document.body.removeChild(ta);
                  App.ui.showToast('Содержимое скопировано', 'success');
                }
              });
            }
          }
        });
      });

      var leftPanel = container.querySelector('#inspectorLeft');
      var divider = container.querySelector('#inspectorDivider');
      var splitView = divider ? divider.parentElement : null;
      if (divider && leftPanel && splitView) {
        divider.addEventListener('mousedown', function (e) {
          e.preventDefault();
          var startX = e.clientX;
          var startWidth = leftPanel.getBoundingClientRect().width;
          var totalWidth = splitView.getBoundingClientRect().width;
          function onMove(ev) {
            var delta = ev.clientX - startX;
            var pct = ((startWidth + delta) / totalWidth) * 100;
            if (pct < 15) pct = 15;
            if (pct > 70) pct = 70;
            leftPanel.style.flex = '0 0 ' + pct + '%';
          }
          function onUp() {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
          }
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
          document.body.style.cursor = 'col-resize';
          document.body.style.userSelect = 'none';
        });
      }
    }
  });
})();
