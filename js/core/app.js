/**
 * AI Project Companion — Core Application Engine
 * Central nervous system: plugins, router, theme, events, state, components, UI
 */
(function () {
  'use strict';

  /* ---- Constants ---- */

  var STORAGE_PREFIX = 'apc_';
  var STORAGE_THEME = STORAGE_PREFIX + 'theme';
  var STORAGE_STATE = STORAGE_PREFIX + 'state';

  var NAV_ITEMS = [
    { id: 'dashboard', icon: 'fa-th-large', label: 'Главная', route: '#dashboard' },
    { id: 'projects', icon: 'fa-folder', label: 'Проекты', route: '#projects' },
    { id: 'new-project', icon: 'fa-plus-circle', label: 'Новый проект', route: '#new-project' },
    { type: 'divider' },
    { id: 'inspector', icon: 'fa-search', label: 'Инспектор', route: '#inspector' },
    { id: 'csv-viewer', icon: 'fa-table', label: 'CSV Viewer', route: '#csv-viewer' },
    { id: 'code-viewer', icon: 'fa-code', label: 'Code Viewer', route: '#code-viewer' },
    { type: 'divider' },
    { id: 'generators', icon: 'fa-wand-magic-sparkles', label: 'Генераторы', route: '#generators' },
    { id: 'templates', icon: 'fa-cubes', label: 'Шаблоны', route: '#templates' },
    { type: 'divider' },
    { id: 'plugins', icon: 'fa-puzzle-piece', label: 'Плагины', route: '#plugins' },
  ];

  var ROUTE_MAP = {
    '#dashboard': 'dashboard',
    '#projects': 'projects',
    '#new-project': 'wizard',
    '#inspector': 'inspector',
    '#csv-viewer': 'csv-viewer',
    '#code-viewer': 'code-viewer',
    '#generators': 'generators',
    '#templates': 'templates',
    '#plugins': 'plugins',
    '#settings': 'settings',
  };

  var BUILT_IN_COMPONENTS = [
    { id: 'dashboard' },
    { id: 'projects' },
    { id: 'wizard' },
    { id: 'inspector' },
    { id: 'csv-viewer' },
    { id: 'code-viewer' },
    { id: 'generators' },
    { id: 'templates' },
    { id: 'plugins' },
    { id: 'settings' },
  ];

  var TOAST_ICONS = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle',
  };

  var TOAST_TITLES = {
    success: 'Готово',
    error: 'Ошибка',
    warning: 'Предупреждение',
    info: 'Информация',
  };

  var LANG = {
    _current: 'ru',
    _dicts: {
      ru: {},
      en: {
        'Главная': 'Dashboard',
        'Проекты': 'Projects',
        'Новый проект': 'New Project',
        'Инспектор': 'Inspector',
        'CSV Viewer': 'CSV Viewer',
        'Code Viewer': 'Code Viewer',
        'Генераторы': 'Generators',
        'Шаблоны': 'Templates',
        'Плагины': 'Plugins',
        'Roadmap': 'Roadmap',
        'Готово': 'Done',
        'Ошибка': 'Error',
        'Предупреждение': 'Warning',
        'Информация': 'Info',
        'Plugins:': 'Плагины:',
        'Поиск команд, шаблонов, библиотек...': 'Search commands, templates, libraries...',
        'Search commands, templates, libraries...': 'Search commands, templates, libraries...',
        'AI Assistant': 'AI Assistant',
        'Toggle theme': 'Toggle theme',
        'Toggle sidebar': 'Toggle sidebar',
        'Настройки': 'Settings',
        'Персонализируйте внешний вид и поведение приложения': 'Customize the look and behavior of the application',
        'Аватарка': 'Avatar',
        'Логотип сайта': 'Site Logo',
        'Тема оформления': 'Theme',
        'Стандартная': 'Default',
        'Базовая тема приложения': 'Default application theme',
        'Язык': 'Language',
        'Язык интерфейса': 'Interface language',
        'Русский': 'Russian',
        'English': 'English',
        'Настройки по умолчанию': 'Default Settings',
        'Версия Python': 'Python Version',
        'Менеджер окружения': 'Environment Manager',
        'Хранилище': 'Storage',
        'Использовано:': 'Used:',
        'Данные приложения в локальном хранилище': 'Application data in local storage',
        'Очистить все данные': 'Clear All Data',
        'Вы уверены, что хотите очистить все данные? Это действие нельзя отменить.': 'Are you sure you want to clear all data? This action cannot be undone.',
        'Все данные очищены': 'All data cleared',
        'О программе': 'About',
        'Название': 'Name',
        'Версия': 'Version',
        'Описание': 'Description',
        'Технологии': 'Technologies',
        'Хранилище': 'Storage',
        'Аватарка обновлена': 'Avatar updated',
        'Логотип обновлён': 'Logo updated',
        'Тема:': 'Theme:',
        'КБ': 'KB',
        'Настройки': 'Settings',
        'Данные приложения в локальном хранилище': 'Application data in local storage',
        'Тема оформления': 'Theme',
        'Призрак': 'Ghost',
        'Дракон': 'Dragon',
        'Корона': 'Crown',
        'Щит': 'Shield',
        'Магия': 'Magic',
        'Ракета': 'Rocket',
        'Звезда': 'Star',
        'Метеор': 'Meteor',
        'Луна': 'Moon',
        'Солнце': 'Sun',
        'Терминал': 'Terminal',
        'Код': 'Code',
        'Баги': 'Bugs',
        'Сервер': 'Server',
        'Облако': 'Cloud',
        'Джойстик': 'Joystick',
        'Кассета': 'Cassette',
        'Дискета': 'Floppy Disk',
        'Телефон': 'Phone',
        'Ретро камера': 'Retro Camera',
        'Робот': 'Robot',
        'Чип': 'Chip',
        'Мозг': 'Brain',
        'QR': 'QR',
        'Сканнер': 'Scanner',
        'Кубики': 'Dice',
        'Трофей': 'Trophy',
        'Галактика': 'Galaxy',
        'Спутник': 'Satellite',
        'Шаттл': 'Shuttle',
        'Ноутбук': 'Laptop',
        'Шестерни': 'Gears',
        'База': 'Database',
        'Диск': 'Disc',
        'Плеер': 'Player',
        'Печатная машинка': 'Typewriter',
        'Чип': 'Chip',
        'Процессор': 'Processor',
        'Молния': 'Lightning',
        'Неон, сочные цвета, геймерская эстетика': 'Neon, vibrant colors, gaming aesthetic',
        'Тёмный космос, звёзды, глубокий фиолетовый': 'Dark space, stars, deep purple',
        'Хакерский зелёный, терминальный стиль': 'Hacker green, terminal style',
        'Тёплые тона, винтажное настроение': 'Warm tones, vintage mood',
        'Холодный синий, кибер-эстетика': 'Cold blue, cyber aesthetic',
        'Версия Python сохранена:': 'Python version saved:',
        'Менеджер окружения:': 'Environment:',
      },
    },
    get: function (str) {
      if (!str) return str;
      var lang = App.state.get('settings.language') || 'ru';
      if (lang === 'ru') return str;
      var dict = this._dicts.en;
      return dict[str] !== undefined ? dict[str] : str;
    },
    apply: function (noReRender) {
      var lang = App.state.get('settings.language') || 'ru';
      this._current = lang;
      document.documentElement.lang = lang === 'en' ? 'en' : 'ru';
      App._buildSidebar();
      App._translateShell();
      if (!noReRender) {
        var cur = App.router.currentRoute;
        if (cur && App.router._routes[cur]) {
          App.router._routes[cur](getEl('appContent'), App.router.currentParams);
        }
      }
    },
  };

  /* ---- Helper functions ---- */

  function getEl(id) {
    return document.getElementById(id);
  }

  function qs(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function qsa(sel, ctx) {
    return (ctx || document).querySelectorAll(sel);
  }

  function safeFn(fn) {
    if (typeof fn === 'function') return fn;
    return function () {};
  }

  function resolveDotPath(obj, path, defaultVal) {
    if (!path || typeof path !== 'string') return defaultVal;
    var keys = path.split('.');
    var cur = obj;
    for (var i = 0; i < keys.length; i++) {
      if (cur == null || typeof cur !== 'object') return defaultVal;
      cur = cur[keys[i]];
    }
    return cur !== undefined ? cur : defaultVal;
  }

  function setDotPath(obj, path, val) {
    var keys = path.split('.');
    var cur = obj;
    for (var i = 0; i < keys.length - 1; i++) {
      if (!cur[keys[i]] || typeof cur[keys[i]] !== 'object') cur[keys[i]] = {};
      cur = cur[keys[i]];
    }
    cur[keys[keys.length - 1]] = val;
  }

  function debounce(fn, ms) {
    var timer = null;
    return function () {
      var ctx = this, args = arguments;
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(ctx, args);
        timer = null;
      }, ms);
    };
  }

  function escHtml(str) {
    if (typeof str !== 'string') return '';
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function now() {
    return Date.now();
  }

  /* ============================================================
     App Object
     ============================================================ */

  var App = {
    version: '1.0.0',
    initialized: false,

    /* ---- Plugin System ---- */

    plugins: {
      _registry: {},

      register: function (id, plugin) {
        if (!id || !plugin) {
          console.warn('[App.plugins] register requires id and plugin object');
          return;
        }
        if (this._registry[id]) {
          console.warn('[App.plugins] Plugin "' + id + '" already registered, overwriting');
        }
        this._registry[id] = plugin;
        if (typeof plugin.init === 'function') {
          try {
            plugin.init(App);
          } catch (e) {
            console.error('[App.plugins] Error initializing plugin "' + id + '":', e);
          }
        }
        App.events.emit('plugin:registered', { id: id, plugin: plugin });
        App._updatePluginStatus();
      },

      unregister: function (id) {
        if (!this._registry[id]) return;
        delete this._registry[id];
        App.events.emit('plugin:unregistered', { id: id });
        App._updatePluginStatus();
      },

      get: function (id) {
        return this._registry[id] || null;
      },

      getAll: function () {
        var result = {};
        for (var key in this._registry) {
          if (this._registry.hasOwnProperty(key)) {
            result[key] = this._registry[key];
          }
        }
        return result;
      },

      applyHook: function (hookName) {
        var args = Array.prototype.slice.call(arguments, 1);
        var results = [];
        for (var key in this._registry) {
          if (!this._registry.hasOwnProperty(key)) continue;
          var plugin = this._registry[key];
          if (plugin.hooks && typeof plugin.hooks[hookName] === 'function') {
            try {
              var r = plugin.hooks[hookName].apply(plugin, args);
              results.push(r);
            } catch (e) {
              console.error('[App.plugins] Error in hook "' + hookName + '" of plugin "' + key + '":', e);
            }
          }
        }
        return results;
      },

      hasHook: function (hookName) {
        for (var key in this._registry) {
          if (!this._registry.hasOwnProperty(key)) continue;
          var plugin = this._registry[key];
          if (plugin.hooks && typeof plugin.hooks[hookName] === 'function') {
            return true;
          }
        }
        return false;
      },
    },

    /* ---- Router ---- */

    router: {
      _routes: {},
      _currentRoute: '',
      _currentParams: {},
      _isStarted: false,
      _boundHashChange: null,

      register: function (path, handler) {
        if (!path) return;
        this._routes[path] = safeFn(handler);
      },

      navigate: function (path) {
        if (typeof path !== 'string') return;
        if (!path.startsWith('#')) path = '#' + path;
        var hash = path.substring(1);
        if (window.location.hash !== hash) {
          window.location.hash = hash;
        } else {
          this._processHash(hash);
        }
      },

      get currentRoute() {
        return this._currentRoute;
      },

      get currentParams() {
        var p = this._currentParams;
        return {
          path: p.path,
          hash: p.hash,
          query: p.query,
          raw: p.raw,
        };
      },

      start: function () {
        if (this._isStarted) return;
        this._isStarted = true;
        var self = this;
        this._boundHashChange = function () {
          self._processHash(window.location.hash);
        };
        window.addEventListener('hashchange', this._boundHashChange);
        var initialHash = window.location.hash || '#dashboard';
        if (!initialHash.startsWith('#')) initialHash = '#' + initialHash;
        this._processHash(initialHash);
      },

      _resolve: function (path) {
        if (!path || typeof path !== 'string') return { handler: null, params: {} };
        var cleanPath = path.startsWith('#') ? path : '#' + path;
        var handler = this._routes[cleanPath] || null;
        var params = {};
        if (!handler) {
          for (var route in this._routes) {
            if (!this._routes.hasOwnProperty(route)) continue;
            var match = this._matchPattern(route, cleanPath);
            if (match) {
              handler = this._routes[route];
              params = match;
              break;
            }
          }
        }
        return { handler: handler, params: params };
      },

      _matchPattern: function (pattern, path) {
        var patParts = pattern.split('/');
        var pathParts = path.split('/');
        if (patParts.length !== pathParts.length) return null;
        var params = {};
        for (var i = 0; i < patParts.length; i++) {
          if (patParts[i].startsWith(':')) {
            params[patParts[i].substring(1)] = decodeURIComponent(pathParts[i]);
          } else if (patParts[i] !== pathParts[i]) {
            return null;
          }
        }
        return params;
      },

      _processHash: function (hash) {
        if (!hash) hash = '#dashboard';
        if (!hash.startsWith('#')) hash = '#' + hash;
        var resolved = this._resolve(hash);
        var params = resolved.params || {};
        var handler = resolved.handler;
        this._currentRoute = hash;
        var qIdx = hash.indexOf('?');
        var query = {};
        if (qIdx !== -1) {
          var qs = hash.substring(qIdx + 1).split('&');
          for (var i = 0; i < qs.length; i++) {
            var pair = qs[i].split('=');
            if (pair[0]) query[decodeURIComponent(pair[0])] = pair[1] ? decodeURIComponent(pair[1]) : '';
          }
        }
        this._currentParams = {
          path: hash,
          hash: qIdx !== -1 ? hash.substring(0, qIdx) : hash,
          query: query,
          raw: hash,
        };
        if (handler) {
          try {
            handler(getEl('appContent'), params);
          } catch (e) {
            console.error('[App.router] Error handling route "' + hash + '":', e);
          }
        } else {
          console.warn('[App.router] No handler for route:', hash);
        }
        App.events.emit('route:change', { route: hash, params: params });
        App._updateSidebarActive(hash);
      },
    },

    /* ---- Theme Manager ---- */

    themeManager: {
      _current: 'dark',

      get current() {
        return this._current;
      },

      init: function () {
        var stored;
        try {
          stored = localStorage.getItem(STORAGE_THEME);
        } catch (e) {
          stored = null;
        }
        var theme = stored || 'dark';
        this._current = theme;
        this._applyTheme(theme);
      },

      toggle: function () {
        var newTheme = this._current === 'dark' ? 'light' : 'dark';
        this.set(newTheme);
      },

      set: function (theme) {
        if (theme !== 'dark' && theme !== 'light') return;
        this._current = theme;
        this._applyTheme(theme);
        try {
          localStorage.setItem(STORAGE_THEME, theme);
        } catch (e) {}
        var toggleBtn = getEl('themeToggle');
        if (toggleBtn) {
          var icon = qs('i', toggleBtn);
          if (icon) {
            icon.className = 'fas ' + (theme === 'dark' ? 'fa-moon' : 'fa-sun');
          }
        }
        App.events.emit('theme:change', { theme: theme });
      },

      _applyTheme: function (theme) {
        var html = document.documentElement;
        html.classList.remove('theme-dark', 'theme-light');
        html.classList.add('theme-' + theme);
      },
    },

    /* ---- Event Bus ---- */

    events: {
      _listeners: {},

      on: function (event, callback) {
        if (!event || typeof callback !== 'function') return function () {};
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(callback);
        var self = this;
        return function () {
          self.off(event, callback);
        };
      },

      off: function (event, callback) {
        if (!this._listeners[event]) return;
        if (!callback) {
          delete this._listeners[event];
          return;
        }
        this._listeners[event] = this._listeners[event].filter(function (fn) {
          return fn !== callback;
        });
        if (this._listeners[event].length === 0) delete this._listeners[event];
      },

      emit: function (event, data) {
        if (!this._listeners[event]) return;
        var args = data !== undefined ? data : {};
        var list = this._listeners[event].slice();
        for (var i = 0; i < list.length; i++) {
          try {
            list[i](args);
          } catch (e) {
            console.error('[App.events] Error in handler for "' + event + '":', e);
          }
        }
      },

      once: function (event, callback) {
        var self = this;
        var wrapper = function (data) {
          callback(data);
          self.off(event, wrapper);
        };
        this.on(event, wrapper);
      },

      clear: function () {
        this._listeners = {};
      },
    },

    /* ---- State Manager ---- */

    state: {
      _data: {},
      _subscribers: {},

      get: function (key, defaultVal) {
        if (!key) return defaultVal;
        return resolveDotPath(this._data, key, defaultVal);
      },

      set: function (key, val) {
        if (!key) return;
        var prev = this.get(key);
        setDotPath(this._data, key, val);
        App.events && App.events.emit('state:change:' + key, { key: key, value: val, previous: prev });
        App.events && App.events.emit('state:change', { key: key, value: val, previous: prev });
        this._notify(key, val, prev);
        this.persist();
      },

      subscribe: function (key, callback) {
        if (!key || typeof callback !== 'function') return;
        if (!this._subscribers[key]) this._subscribers[key] = [];
        this._subscribers[key].push(callback);
      },

      unsubscribe: function (key, callback) {
        if (!this._subscribers[key]) return;
        if (!callback) {
          delete this._subscribers[key];
          return;
        }
        this._subscribers[key] = this._subscribers[key].filter(function (fn) {
          return fn !== callback;
        });
        if (this._subscribers[key].length === 0) delete this._subscribers[key];
      },

      getAll: function () {
        return this._data;
      },

      reset: function () {
        this._data = {};
        this._subscribers = {};
      },

      persist: function () {
        try {
          localStorage.setItem(STORAGE_STATE, JSON.stringify(this._data));
        } catch (e) {
          console.warn('[App.state] Could not persist state:', e);
        }
      },

      load: function () {
        try {
          var stored = localStorage.getItem(STORAGE_STATE);
          if (stored) {
            var parsed = JSON.parse(stored);
            if (parsed && typeof parsed === 'object') {
              this._data = parsed;
            }
          }
        } catch (e) {
          console.warn('[App.state] Could not load state:', e);
        }
      },

      _notify: function (key, val, prev) {
        var subs = this._subscribers[key];
        if (!subs) return;
        var list = subs.slice();
        for (var i = 0; i < list.length; i++) {
          try {
            list[i](val, prev);
          } catch (e) {
            console.error('[App.state] Error in subscriber for "' + key + '":', e);
          }
        }
      },
    },

    /* ---- Component System ---- */

    _components: {},

    registerComponent: function (component) {
      if (!component || !component.id) {
        console.warn('[App] registerComponent requires an object with an id');
        return;
      }
      this._components[component.id] = component;
      App.events && App.events.emit('component:registered', { id: component.id });
    },

    getComponent: function (id) {
      return this._components[id] || null;
    },

    renderComponent: function (id, container) {
      var comp = this._components[id];
      if (!comp) {
        if (container) {
          container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i class="fas fa-cube"></i></div><div class="empty-state-title">Component Not Found</div><div class="empty-state-text">The component "' + escHtml(id) + '" is not registered.</div></div>';
        }
        return;
      }
      if (container) {
        container.innerHTML = '<div class="loading-container" style="display:flex;align-items:center;justify-content:center;padding:60px 0"><div class="loading-spinner loading-spinner-lg"></div></div>';
      }
      var renderFn = safeFn(comp.render);
      var initFn = safeFn(comp.init);
      try {
        if (comp._initialized !== true) {
          initFn.call(comp, comp);
          comp._initialized = true;
        }
        if (container) {
          renderFn.call(comp, container);
        }
      } catch (e) {
        console.error('[App] Error rendering component "' + id + '":', e);
        if (container) {
          container.innerHTML = '<div class="empty-state"><div class="empty-state-icon" style="color:var(--error)"><i class="fas fa-exclamation-triangle"></i></div><div class="empty-state-title">Render Error</div><div class="empty-state-text">' + escHtml(e.message) + '</div></div>';
        }
      }
    },

    /* ---- UI Helpers ---- */

    ui: {
      _toastTimer: null,

      showToast: function (message, type, duration) {
        var msg = message || '';
        var t = type || 'info';
        var dur = typeof duration === 'number' ? duration : 4000;
        var container = getEl('toastContainer');
        if (!container) return;
        var icon = TOAST_ICONS[t] || TOAST_ICONS.info;
        var title = TOAST_TITLES[t] || 'Информация';
        var toast = document.createElement('div');
        toast.className = 'toast toast-' + t;
        toast.innerHTML = '<div class="toast-icon"><i class="fas ' + icon + '"></i></div><div class="toast-content"><div class="toast-title">' + escHtml(title) + '</div><div class="toast-message">' + escHtml(msg) + '</div></div><button class="toast-close" aria-label="Close">&times;</button><div class="toast-progress"></div>';
        var closeBtn = qs('.toast-close', toast);
        if (closeBtn) {
          closeBtn.addEventListener('click', function () {
            App.ui._dismissToast(toast);
          });
        }
        while (container.children.length >= 3) {
          var first = container.children[0];
          if (first && first.parentNode) first.parentNode.removeChild(first);
        }
        container.appendChild(toast);
        if (dur > 0) {
          var progress = qs('.toast-progress', toast);
          if (progress) {
            progress.style.animationDuration = dur + 'ms';
          }
          setTimeout(function () {
            App.ui._dismissToast(toast);
          }, dur);
        }
      },

      _dismissToast: function (toast) {
        if (!toast || toast.classList.contains('removing')) return;
        toast.classList.add('removing');
        setTimeout(function () {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
      },

      showModal: function (options) {
        var opts = options || {};
        var overlay = getEl('modalOverlay');
        var modal = getEl('modal');
        var titleEl = getEl('modalTitle');
        var bodyEl = getEl('modalBody');
        var footerEl = getEl('modalFooter');
        var closeBtn = getEl('modalClose');
        var cancelBtn = getEl('modalCancel');
        var confirmBtn = getEl('modalConfirm');
        if (!overlay || !modal) return;
        if (titleEl) titleEl.textContent = opts.title || 'Modal';
        if (bodyEl) {
          if (typeof opts.body === 'string') {
            bodyEl.innerHTML = opts.body;
          } else if (opts.body && opts.body.nodeType === 1) {
            bodyEl.innerHTML = '';
            bodyEl.appendChild(opts.body);
          } else {
            bodyEl.innerHTML = '';
          }
        }
        if (footerEl) {
          if (opts.footer) {
            footerEl.innerHTML = opts.footer;
          } else {
            var showConfirm = opts.showConfirm !== false;
            var showCancel = opts.showCancel !== false;
            footerEl.innerHTML = '';
            if (showCancel) {
              var cBtn = document.createElement('button');
              cBtn.className = 'btn btn-secondary';
              cBtn.textContent = opts.cancelText || 'Cancel';
              cBtn.id = 'modalCancel';
              footerEl.appendChild(cBtn);
            }
            if (showConfirm) {
              var cfBtn = document.createElement('button');
              cfBtn.className = 'btn btn-primary';
              cfBtn.textContent = opts.confirmText || 'Confirm';
              cfBtn.id = 'modalConfirm';
              footerEl.appendChild(cfBtn);
            }
            cancelBtn = getEl('modalCancel');
            confirmBtn = getEl('modalConfirm');
          }
        }
        modal.className = 'modal';
        var size = opts.size || '';
        if (size === 'sm') modal.classList.add('modal-sm');
        else if (size === 'lg') modal.classList.add('modal-lg');
        else if (size === 'xl') modal.classList.add('modal-xl');
        overlay.classList.add('open');
        App._modalResolve = null;
        App._modalReject = null;
        var cleanup = function () {
          overlay.classList.remove('open');
          if (closeBtn) closeBtn.removeEventListener('click', onClose);
          if (cancelBtn) cancelBtn.removeEventListener('click', onCancel);
          if (confirmBtn) confirmBtn.removeEventListener('click', onConfirm);
          document.removeEventListener('keydown', onKeydown);
        };
        var self = this;
        function onClose() {
          cleanup();
          if (typeof opts.onCancel === 'function') opts.onCancel();
          if (App._modalReject) App._modalReject(false);
        }
        function onCancel() {
          cleanup();
          if (typeof opts.onCancel === 'function') opts.onCancel();
          if (App._modalReject) App._modalReject(false);
        }
        function onConfirm() {
          cleanup();
          if (typeof opts.onConfirm === 'function') opts.onConfirm();
          if (App._modalResolve) App._modalResolve(true);
        }
        function onKeydown(e) {
          if (e.key === 'Escape') onCancel();
          if (e.key === 'Enter') onConfirm();
        }
        if (closeBtn) closeBtn.addEventListener('click', onClose);
        if (cancelBtn) cancelBtn.addEventListener('click', onCancel);
        if (confirmBtn) confirmBtn.addEventListener('click', onConfirm);
        document.addEventListener('keydown', onKeydown);
        overlay.addEventListener('click', function (e) {
          if (e.target === overlay) onCancel();
        });
      },

      hideModal: function () {
        var overlay = getEl('modalOverlay');
        if (overlay) overlay.classList.remove('open');
      },

      showConfirm: function (message) {
        return new Promise(function (resolve, reject) {
          App._modalResolve = resolve;
          App._modalReject = reject;
          App.ui.showModal({
            title: 'Confirm',
            body: '<p>' + escHtml(message || 'Are you sure?') + '</p>',
            confirmText: 'Confirm',
            cancelText: 'Cancel',
            showConfirm: true,
            showCancel: true,
            size: 'sm',
            onConfirm: function () { resolve(true); },
            onCancel: function () { resolve(false); },
          });
        });
      },

      showLoading: function (show) {
        var existing = getEl('appLoadingOverlay');
        if (show) {
          if (existing) return;
          var overlay = document.createElement('div');
          overlay.id = 'appLoadingOverlay';
          overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:var(--overlay);z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px';
          overlay.innerHTML = '<div class="loading-spinner loading-spinner-lg"></div><div style="color:var(--text-secondary);font-size:0.9rem">Загрузка...</div>';
          document.body.appendChild(overlay);
        } else {
          if (existing) {
            existing.style.opacity = '0';
            existing.style.transition = 'opacity 0.3s ease';
            setTimeout(function () {
              if (existing.parentNode) existing.parentNode.removeChild(existing);
            }, 300);
          }
        }
      },

      showPanel: function (id) {
        var el = getEl(id);
        if (el) el.classList.add('open');
      },

      hidePanel: function (id) {
        var el = getEl(id);
        if (el) el.classList.remove('open');
      },
    },

    /* ---- Initialization ---- */

    init: function () {
      if (this.initialized) return;
      try {
        this.state.load();
        this.themeManager.init();
        this._applySettingsState();
        LANG.apply(true);
        this._registerRoutes();
        this._registerBuiltInComponents();
        this._attachEventHandlers();
        this.router.start();
        this.initialized = true;
        this._updatePluginStatus();
        this._updateVersion();
        this.events.emit('app:ready');
        this._loadExternalPlugins();
      } catch (e) {
        console.error('[App.init] Initialization failed:', e);
      }
    },

    _buildSidebar: function () {
      var nav = getEl('sidebarNav');
      if (!nav) return;
      nav.innerHTML = '';
      for (var i = 0; i < NAV_ITEMS.length; i++) {
        var item = NAV_ITEMS[i];
        if (item.type === 'divider') {
          var div = document.createElement('div');
          div.className = 'sidebar-divider';
          nav.appendChild(div);
        } else {
          var a = document.createElement('a');
          a.className = 'nav-link';
          a.setAttribute('data-route', item.route || '#');
          a.href = item.route || '#';
          a.innerHTML = '<span class="sidebar-icon"><i class="fas ' + (item.icon || 'fa-circle') + '"></i></span><span class="sidebar-label">' + escHtml(LANG.get(item.label || item.id)) + '</span>';
          (function (route) {
            a.addEventListener('click', function (e) {
              e.preventDefault();
              App.router.navigate(route);
            });
          })(item.route || '#');
          nav.appendChild(a);
        }
      }
    },

    _registerRoutes: function () {
      var self = this;
      for (var path in ROUTE_MAP) {
        if (!ROUTE_MAP.hasOwnProperty(path)) continue;
        (function (routePath, compId) {
          self.router.register(routePath, function (container, params) {
            self.renderComponent(compId, container);
          });
        })(path, ROUTE_MAP[path]);
      }
    },

    _registerBuiltInComponents: function () {
      for (var i = 0; i < BUILT_IN_COMPONENTS.length; i++) {
        var comp = BUILT_IN_COMPONENTS[i];
        if (this._components[comp.id]) continue;
        this.registerComponent({
          id: comp.id,
          _initialized: false,
          init: function () {},
          render: function (container) {
            var id = this.id;
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i class="fas ' + (this._icon || 'fa-cube') + '"></i></div><div class="empty-state-title">' + escHtml(this._label || id) + '</div><div class="empty-state-text">Компонент загружается...</div></div>';
          },
          destroy: function () {},
          _icon: comp.icon,
          _label: comp.label,
        });
      }
    },

    _attachEventHandlers: function () {
      this._setupThemeToggle();
      this._setupSidebarToggle();
      this._setupAIAssistant();
      this._setupGlobalSearch();
      this._setupMobileOverlay();
      this._setupUserMenu();
    },

    _setupThemeToggle: function () {
      var btn = getEl('themeToggle');
      if (!btn) return;
      var self = this;
      btn.addEventListener('click', function () {
        self.themeManager.toggle();
        self.events.emit('ui:themeToggled', { theme: self.themeManager.current });
      });
    },

    _setupSidebarToggle: function () {
      var btn = getEl('sidebarToggle');
      var sidebar = getEl('sidebar');
      var overlay = getEl('sidebarOverlay');
      var container = getEl('app');
      if (!btn || !sidebar) return;
      btn.addEventListener('click', function () {
        if (window.innerWidth < 1024) {
          sidebar.classList.toggle('open');
          if (overlay) overlay.classList.toggle('open');
        } else {
          container.classList.toggle('sidebar-collapsed');
        }
      });
    },

    _setupAIAssistant: function () {
      var openBtn = getEl('aiAssistantBtn');
      var closeBtn = getEl('aiPanelClose');
      var sendBtn = getEl('aiSendBtn');
      var input = getEl('aiInput');
      var panel = getEl('aiPanel');
      if (!panel) return;
      if (openBtn) {
        openBtn.addEventListener('click', function () {
          panel.classList.toggle('open');
          if (panel.classList.contains('open') && input) {
            input.focus();
          }
        });
      }
      if (closeBtn) {
        closeBtn.addEventListener('click', function () {
          panel.classList.remove('open');
        });
      }
      if (sendBtn && input) {
        var self = this;
        sendBtn.addEventListener('click', function () {
          self._handleAISend(input);
        });
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            self._handleAISend(input);
          }
        });
      }
    },

    _handleAISend: function (input) {
      var text = input.value.trim();
      if (!text) return;
      var messages = getEl('aiMessages');
      if (messages) {
        var userMsg = document.createElement('div');
        userMsg.className = 'ai-message ai-message-user';
        userMsg.innerHTML = '<div class="ai-message-avatar"><i class="fas fa-user"></i></div><div class="ai-message-bubble">' + escHtml(text) + '</div>';
        messages.appendChild(userMsg);
        messages.scrollTop = messages.scrollHeight;
      }
      input.value = '';
      var self = this;
      setTimeout(function () {
        var responseText = 'Спасибо за ваш вопрос! AI-ассистент обрабатывает информацию.';
        if (messages) {
          var resp = document.createElement('div');
          resp.className = 'ai-message ai-message-assistant';
          if (App.aiService && App.aiService.ask) {
            try { responseText = App.aiService.ask(text, {}); } catch(e) { responseText = 'Спасибо за ваш вопрос! AI-ассистент обрабатывает информацию.'; }
          }
          resp.innerHTML = '<div class="ai-message-avatar"><i class="fas fa-robot"></i></div><div class="ai-message-bubble">' + escHtml(responseText) + '</div>';
          messages.appendChild(resp);
          messages.scrollTop = messages.scrollHeight;
        }
        self.events.emit('ai:message', { role: 'user', content: text });
        self.events.emit('ai:response', { role: 'assistant', content: responseText });
      }, 500);
    },

    _setupGlobalSearch: function () {
      var input = getEl('globalSearch');
      var results = getEl('searchResults');
      if (!input || !results) return;
      var self = this;
      var doSearch = debounce(function () {
        var query = input.value.trim().toLowerCase();
        if (!query) {
          results.classList.remove('open');
          results.innerHTML = '';
          return;
        }
        var items = [];
        for (var i = 0; i < NAV_ITEMS.length; i++) {
          var item = NAV_ITEMS[i];
          if (item.type === 'divider') continue;
          if ((item.label && item.label.toLowerCase().indexOf(query) !== -1) ||
              (item.id && item.id.toLowerCase().indexOf(query) !== -1)) {
            items.push(item);
          }
        }
        if (items.length === 0) {
          results.innerHTML = '<div class="search-result-item" style="cursor:default;color:var(--text-muted)">No results found</div>';
        } else {
          var html = '';
          for (var j = 0; j < items.length; j++) {
            html += '<div class="search-result-item" data-route="' + (items[j].route || '') + '"><span class="search-result-icon"><i class="fas ' + (items[j].icon || 'fa-circle') + '"></i></span><div><div class="search-result-text">' + escHtml(items[j].label || items[j].id) + '</div><div class="search-result-desc">' + escHtml(items[j].route || '') + '</div></div></div>';
          }
          results.innerHTML = html;
          qsa('.search-result-item', results).forEach(function (el) {
            el.addEventListener('click', function () {
              var route = el.getAttribute('data-route');
              if (route) {
                self.router.navigate(route);
                results.classList.remove('open');
                input.value = '';
              }
            });
          });
        }
        results.classList.add('open');
      }, 200);
      input.addEventListener('input', doSearch);
      input.addEventListener('focus', function () {
        if (input.value.trim()) doSearch();
      });
      document.addEventListener('click', function (e) {
        if (!results.contains(e.target) && e.target !== input) {
          results.classList.remove('open');
        }
      });
      document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          input.focus();
        }
        if (e.key === 'Escape') {
          results.classList.remove('open');
          input.blur();
        }
      });
    },

    _setupMobileOverlay: function () {
      var overlay = getEl('sidebarOverlay');
      var sidebar = getEl('sidebar');
      if (!overlay) return;
      overlay.addEventListener('click', function () {
        if (sidebar) sidebar.classList.remove('open');
        overlay.classList.remove('open');
      });
    },

    _setupUserMenu: function () {
      var avatar = qs('.user-avatar');
      if (!avatar) return;
      avatar.addEventListener('click', function () {
        if (window.location.hash === '#settings') {
          avatar.classList.remove('active');
          App.router.navigate('#dashboard');
        } else {
          avatar.classList.add('active');
          App.router.navigate('#settings');
        }
      });
    },

    _updateSidebarActive: function (hash) {
      var items = qsa('.nav-link');
      for (var i = 0; i < items.length; i++) {
        var route = items[i].getAttribute('data-route');
        items[i].classList.toggle('active', route === hash);
      }
    },

    _updatePluginStatus: function () {
      var el = getEl('pluginStatus');
      if (!el) return;
      var count = 0;
      for (var k in this.plugins._registry) {
        if (this.plugins._registry.hasOwnProperty(k)) count++;
      }
      var span = qs('span', el);
      if (span) span.textContent = 'Плагины: ' + count;
    },

    _updateVersion: function () {
      var el = getEl('appVersion');
      if (!el) return;
      var span = qs('span', el);
      if (span) span.textContent = 'v' + this.version;
    },

    _applySettingsState: function () {
      var settings = this.state.get('settings');
      if (!settings) return;
      if (settings.avatar) {
        var avatar = qs('.user-avatar i');
        if (avatar) avatar.className = 'fas ' + settings.avatar;
      }
      if (settings.logo) {
        var logo = qs('.logo-icon i');
        if (logo) logo.className = 'fas ' + settings.logo;
      }
      if (settings.themeCategory) {
        document.documentElement.setAttribute('data-theme-category', settings.themeCategory);
      }
    },

    _translateShell: function () {
      var searchInput = getEl('globalSearch');
      if (searchInput) searchInput.placeholder = LANG.get('Поиск команд, шаблонов, библиотек...');
      var aiTitle = qs('.ai-panel-header span');
      if (aiTitle) aiTitle.innerHTML = '<i class="fas fa-robot"></i> ' + LANG.get('AI Assistant');
      var sidebarToggle = getEl('sidebarToggle');
      if (sidebarToggle) sidebarToggle.title = LANG.get('Toggle sidebar');
      var themeToggle = getEl('themeToggle');
      if (themeToggle) themeToggle.title = LANG.get('Toggle theme');
      var aiBtn = getEl('aiAssistantBtn');
      if (aiBtn) aiBtn.title = LANG.get('AI Assistant');
      var userAvatar = qs('.user-avatar');
      if (userAvatar) userAvatar.title = LANG.get('Настройки');
      var pluginStatus = qs('#pluginStatus span');
      if (pluginStatus) pluginStatus.textContent = LANG.get('Плагины') + ': ' + (App.plugins ? Object.keys(App.plugins._registry).length : 0);
    },

    _loadExternalPlugins: function () {
      var external = window.__plugins;
      if (!external || typeof external !== 'object') return;
      for (var id in external) {
        if (external.hasOwnProperty(id)) {
          try {
            this.plugins.register(id, external[id]);
          } catch (e) {
            console.error('[App] Failed to load external plugin "' + id + '":', e);
          }
        }
      }
    },
  };

  App.LANG = LANG;

  window.App = App;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { App.init(); });
  } else {
    App.init();
  }
})();
