(function(){
App.registerComponent({
  id: 'settings',
  title: 'Настройки',
  icon: 'fa-cog',
  init: function() { },
  render: function(container) { this._render(container); },
  destroy: function() { }
});

var _comp = App._components.settings;

var AVATAR_STYLES = {
  gamer: [
    { icon: 'fa-ghost', label: 'Призрак' },
    { icon: 'fa-dragon', label: 'Дракон' },
    { icon: 'fa-crown', label: 'Корона' },
    { icon: 'fa-shield-halved', label: 'Щит' },
    { icon: 'fa-hat-wizard', label: 'Магия' },
  ],
  cosmic: [
    { icon: 'fa-rocket', label: 'Ракета' },
    { icon: 'fa-star', label: 'Звезда' },
    { icon: 'fa-meteor', label: 'Метеор' },
    { icon: 'fa-moon', label: 'Луна' },
    { icon: 'fa-sun', label: 'Солнце' },
  ],
  programmer: [
    { icon: 'fa-terminal', label: 'Терминал' },
    { icon: 'fa-code', label: 'Код' },
    { icon: 'fa-bug', label: 'Баги' },
    { icon: 'fa-server', label: 'Сервер' },
    { icon: 'fa-cloud', label: 'Облако' },
  ],
  retro: [
    { icon: 'fa-gamepad', label: 'Джойстик' },
    { icon: 'fa-record-vinyl', label: 'Кассета' },
    { icon: 'fa-floppy-disk', label: 'Дискета' },
    { icon: 'fa-phone', label: 'Телефон' },
    { icon: 'fa-camera-retro', label: 'Ретро камера' },
  ],
  techno: [
    { icon: 'fa-robot', label: 'Робот' },
    { icon: 'fa-microchip', label: 'Чип' },
    { icon: 'fa-brain', label: 'Мозг' },
    { icon: 'fa-qrcode', label: 'QR' },
    { icon: 'fa-fingerprint', label: 'Сканнер' },
  ],
};

var LOGO_STYLES = {
  gamer: [
    { icon: 'fa-dice-d6', label: 'Кубики' },
    { icon: 'fa-gamepad', label: 'Джойстик' },
    { icon: 'fa-trophy', label: 'Трофей' },
  ],
  cosmic: [
    { icon: 'fa-globe', label: 'Галактика' },
    { icon: 'fa-satellite', label: 'Спутник' },
    { icon: 'fa-shuttle-space', label: 'Шаттл' },
  ],
  programmer: [
    { icon: 'fa-laptop-code', label: 'Ноутбук' },
    { icon: 'fa-gears', label: 'Шестерни' },
    { icon: 'fa-database', label: 'База' },
  ],
  retro: [
    { icon: 'fa-compact-disc', label: 'Диск' },
    { icon: 'fa-headphones', label: 'Плеер' },
    { icon: 'fa-print', label: 'Печатная машинка' },
  ],
  techno: [
    { icon: 'fa-microchip', label: 'Чип' },
    { icon: 'fa-server', label: 'Процессор' },
    { icon: 'fa-bolt', label: 'Молния' },
  ],
};

var THEME_CATEGORIES = {
  gamer: { name: 'Gamer', icon: 'fa-gamepad', desc: 'Неон, сочные цвета, геймерская эстетика', accent: '#ff007a', accentLight: 'rgba(255,0,122,0.12)' },
  cosmic: { name: 'Cosmic', icon: 'fa-rocket', desc: 'Тёмный космос, звёзды, глубокий фиолетовый', accent: '#8b5cf6', accentLight: 'rgba(139,92,246,0.12)' },
  programmer: { name: 'Programmer', icon: 'fa-code', desc: 'Хакерский зелёный, терминальный стиль', accent: '#10b981', accentLight: 'rgba(16,185,129,0.10)' },
  retro: { name: 'Retro', icon: 'fa-cassette', desc: 'Тёплые тона, винтажное настроение', accent: '#f97316', accentLight: 'rgba(249,115,22,0.10)' },
  techno: { name: 'Techno', icon: 'fa-microchip', desc: 'Холодный синий, кибер-эстетика', accent: '#06b6d4', accentLight: 'rgba(6,182,212,0.10)' },
};

_comp._getDefaultSettings = function() {
  return {
    pythonVersion: '3.12',
    useUv: true,
    language: 'ru',
    avatar: 'fa-user',
    logo: 'fa-brain',
    themeCategory: ''
  };
};

_comp._render = function(container) {
  var self = this;
  var settings = App.state.get('settings') || this._getDefaultSettings();

  container.innerHTML = '';
  var wrapper = document.createElement('div');
  wrapper.className = 'page-content';
  wrapper.innerHTML = '<div class="page-header"><div><h2 class="page-header-title">Настройки</h2><p class="page-header-subtitle">Персонализируйте внешний вид и поведение приложения</p></div></div>';
  container.appendChild(wrapper);

  var avatarLogoWrap = document.createElement('div');
  avatarLogoWrap.style.cssText = 'display:flex;gap:20px;flex-wrap:wrap;margin-bottom:0;';
  this._renderAvatarSection(avatarLogoWrap, settings);
  this._renderLogoSection(avatarLogoWrap, settings);
  wrapper.appendChild(avatarLogoWrap);
  this._renderThemeSection(wrapper, settings);
  this._renderLanguageSection(wrapper, settings);
  this._renderDefaultSettings(wrapper, settings);
  this._renderStorageSection(wrapper);
  this._renderAboutSection(wrapper);
};

_comp._applyAvatar = function(icon) {
  var avatar = document.querySelector('.user-avatar i');
  if (avatar) avatar.className = 'fas ' + icon;
};

_comp._applyLogo = function(icon) {
  var logo = document.querySelector('.logo-icon i');
  if (logo) logo.className = 'fas ' + icon;
};

_comp._applyThemeCategory = function(category) {
  var html = document.documentElement;
  if (category) {
    html.setAttribute('data-theme-category', category);
  } else {
    html.removeAttribute('data-theme-category');
  }
};

_comp._renderAvatarLogo = function(container, settings, type) {
  var self = this;
  var isAvatar = type === 'avatar';
  var styles = isAvatar ? AVATAR_STYLES : LOGO_STYLES;
  var optClass = isAvatar ? 'opt-avatar' : 'opt-logo';
  var checkClass = isAvatar ? 'opt-check' : 'opt-check';
  var curKey = isAvatar ? 'avatar' : 'logo';
  var curVal = settings[curKey];
  var title = isAvatar ? 'Аватарка' : 'Логотип сайта';
  var icon = isAvatar ? 'fa-user-circle' : 'fa-pen-nib';
  var toastMsg = isAvatar ? 'Аватарка обновлена' : 'Логотип обновлён';

  var catsHtml = '';
  for (var cat in styles) {
    var catName = cat.charAt(0).toUpperCase() + cat.slice(1);
    var items = styles[cat];
    var itemsHtml = items.map(function(a) {
      var sel = curVal === a.icon;
      var sty = sel ? ' style="border-color:var(--accent);background:var(--accent-light);position:relative;"' : '';
      var chk = sel ? '<i class="fas fa-check-circle opt-check"></i>' : '';
      return '<div class="' + optClass + '"' + sty + ' data-key="' + curKey + '" data-icon="' + a.icon + '" title="' + a.label + '">' + chk + '<i class="fas ' + a.icon + '"></i></div>';
    }).join('');

    catsHtml +=
      '<div style="margin-bottom:10px;">' +
        '<div style="font-size:0.75rem;font-weight:600;margin-bottom:6px;color:var(--text-muted);text-align:center;letter-spacing:0.03em;text-transform:uppercase;">' + catName + '</div>' +
        '<div class="opt-grid">' + itemsHtml + '</div>' +
      '</div>';
  }

  var card = document.createElement('div');
  card.className = 'card settings-avatar-card';
  card.style.cssText = 'margin-bottom:20px;flex:1;min-width:280px;';
  card.innerHTML =
    '<div class="card-header" style="margin-bottom:14px;"><h3 style="font-size:0.95rem;"><i class="fas ' + icon + '"></i> ' + title + '</h3></div>' +
    '<div class="card-body">' + catsHtml + '</div>';

  container.appendChild(card);

  card.querySelectorAll('.' + optClass).forEach(function(el) {
    el.addEventListener('click', function() {
      var iconVal = this.getAttribute('data-icon');
      var key = this.getAttribute('data-key');
      settings[key] = iconVal;
      App.state.set('settings', settings);
      if (isAvatar) self._applyAvatar(iconVal);
      else self._applyLogo(iconVal);
      card.querySelectorAll('.' + optClass).forEach(function(o) {
        o.style.borderColor = '';
        o.style.background = '';
        o.style.position = '';
        var c = o.querySelector('.opt-check');
        if (c) c.remove();
      });
      this.style.borderColor = 'var(--accent)';
      this.style.background = 'var(--accent-light)';
      this.style.position = 'relative';
      var chk = document.createElement('i');
      chk.className = 'fas fa-check-circle opt-check';
      this.insertBefore(chk, this.firstChild);
      App.ui.showToast(App.LANG.get(toastMsg), 'success');
    });
  });
};

_comp._renderAvatarSection = function(container, settings) {
  this._renderAvatarLogo(container, settings, 'avatar');
};

_comp._renderLogoSection = function(container, settings) {
  this._renderAvatarLogo(container, settings, 'logo');
};

_comp._renderThemeSection = function(container, settings) {
  var self = this;
  var card = document.createElement('div');
  card.className = 'card';
  card.style.cssText = 'margin-bottom:20px;';

  var currentCat = settings.themeCategory || '';
  var catsHtml = '';
  for (var cat in THEME_CATEGORIES) {
    var t = THEME_CATEGORIES[cat];
    var sel = currentCat === cat ? ' style="border-color:var(--accent);background:var(--accent-light);box-shadow:0 0 0 2px var(--accent);"' : '';
    catsHtml +=
      '<div class="theme-cat-option"' + sel + ' data-cat="' + cat + '" style="padding:14px;border:2px solid var(--border);border-radius:var(--radius);cursor:pointer;transition:var(--transition);display:flex;align-items:center;gap:12px;' + (sel ? '' : '') + '">' +
        '<div style="width:40px;height:40px;border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;background:' + t.accentLight + ';color:' + t.accent + ';font-size:1.1rem;flex-shrink:0;"><i class="fas ' + t.icon + '"></i></div>' +
        '<div style="flex:1;"><div style="font-weight:600;font-size:0.9rem;color:var(--text-primary);">' + t.name + '</div><div style="font-size:0.8rem;color:var(--text-muted);">' + t.desc + '</div></div>' +
        (currentCat === cat ? '<i class="fas fa-check-circle" style="color:var(--accent);"></i>' : '') +
      '</div>';
  }

  card.innerHTML =
    '<div class="card-header"><h3><i class="fas fa-palette"></i> Тема оформления</h3></div>' +
    '<div class="card-body">' +
      '<div style="display:flex;flex-direction:column;gap:8px;">' +
        '<div class="theme-cat-option" data-cat="" style="padding:14px;border:2px solid ' + (!currentCat ? 'var(--accent)' : 'var(--border)') + ';border-radius:var(--radius);cursor:pointer;transition:var(--transition);display:flex;align-items:center;gap:12px;' + (!currentCat ? 'background:var(--accent-light);' : '') + '">' +
          '<div style="width:40px;height:40px;border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;background:var(--bg-tertiary);color:var(--text-secondary);font-size:1.1rem;flex-shrink:0;"><i class="fas fa-circle-half-stroke"></i></div>' +
          '<div style="flex:1;"><div style="font-weight:600;font-size:0.9rem;color:var(--text-primary);">Стандартная</div><div style="font-size:0.8rem;color:var(--text-muted);">Базовая тема приложения</div></div>' +
          (!currentCat ? '<i class="fas fa-check-circle" style="color:var(--accent);"></i>' : '') +
        '</div>' +
        catsHtml +
      '</div>' +
    '</div>';

  container.appendChild(card);

  card.querySelectorAll('.theme-cat-option').forEach(function(el) {
    el.addEventListener('click', function() {
      var cat = this.getAttribute('data-cat');
      settings.themeCategory = cat;
      App.state.set('settings', settings);
      self._applyThemeCategory(cat);
      card.querySelectorAll('.theme-cat-option').forEach(function(o) {
        o.style.borderColor = 'var(--border)';
        o.style.background = '';
        var check = o.querySelector('.fa-check-circle');
        if (check) check.remove();
      });
      this.style.borderColor = 'var(--accent)';
      this.style.background = 'var(--accent-light)';
      var i = document.createElement('i');
      i.className = 'fas fa-check-circle';
      i.style.cssText = 'color:var(--accent);';
      if (!this.querySelector('.fa-check-circle')) this.appendChild(i);
      App.ui.showToast('Тема: ' + (cat ? THEME_CATEGORIES[cat].name : 'Стандартная'), 'success');
    });
  });
};

_comp._renderLanguageSection = function(container, settings) {
  var self = this;
  var card = document.createElement('div');
  card.className = 'card';
  card.style.cssText = 'margin-bottom:20px;';

  var lang = settings.language || 'ru';

  card.innerHTML =
    '<div class="card-header"><h3><i class="fas fa-language"></i> Язык</h3></div>' +
    '<div class="card-body">' +
      '<div style="display:flex;gap:12px;flex-wrap:wrap;">' +
        '<div class="lang-option" data-lang="ru" style="padding:12px 16px;border:2px solid ' + (lang === 'ru' ? 'var(--accent)' : 'var(--border)') + ';border-radius:var(--radius);cursor:pointer;transition:var(--transition);display:flex;align-items:center;gap:10px;flex:1;min-width:160px;' + (lang === 'ru' ? 'background:var(--accent-light);' : '') + '">' +
          '<span style="font-size:1.5rem;">🇷🇺</span>' +
          '<div><div style="font-weight:600;font-size:0.9rem;color:var(--text-primary);">Русский</div><div style="font-size:0.8rem;color:var(--text-muted);">Язык интерфейса</div></div>' +
          (lang === 'ru' ? '<i class="fas fa-check-circle" style="color:var(--accent);margin-left:auto;"></i>' : '') +
        '</div>' +
        '<div class="lang-option" data-lang="en" style="padding:12px 16px;border:2px solid ' + (lang === 'en' ? 'var(--accent)' : 'var(--border)') + ';border-radius:var(--radius);cursor:pointer;transition:var(--transition);display:flex;align-items:center;gap:10px;flex:1;min-width:160px;' + (lang === 'en' ? 'background:var(--accent-light);' : '') + '">' +
          '<span style="font-size:1.5rem;">🇬🇧</span>' +
          '<div><div style="font-weight:600;font-size:0.9rem;color:var(--text-primary);">English</div><div style="font-size:0.8rem;color:var(--text-muted);">Interface language</div></div>' +
          (lang === 'en' ? '<i class="fas fa-check-circle" style="color:var(--accent);margin-left:auto;"></i>' : '') +
        '</div>' +
      '</div>' +
    '</div>';

  container.appendChild(card);

  card.querySelectorAll('.lang-option').forEach(function(el) {
    el.addEventListener('click', function() {
      var langVal = this.getAttribute('data-lang');
      settings.language = langVal;
      App.state.set('settings', settings);
      App.LANG.apply();
      card.querySelectorAll('.lang-option').forEach(function(o) {
        o.style.borderColor = 'var(--border)';
        o.style.background = '';
        var check = o.querySelector('.fa-check-circle');
        if (check) check.remove();
      });
      this.style.borderColor = 'var(--accent)';
      this.style.background = 'var(--accent-light)';
      var i = document.createElement('i');
      i.className = 'fas fa-check-circle';
      i.style.cssText = 'color:var(--accent);margin-left:auto;';
      this.appendChild(i);
      App.ui.showToast(App.LANG.get('Язык') + ': ' + (langVal === 'ru' ? App.LANG.get('Русский') : 'English'), 'success');
    });
  });
};

_comp._renderDefaultSettings = function(container, settings) {
  var self = this;
  var card = document.createElement('div');
  card.className = 'card';
  card.style.cssText = 'margin-bottom:20px;';

  card.innerHTML =
    '<div class="card-header"><h3><i class="fas fa-sliders-h"></i> Настройки по умолчанию</h3></div>' +
    '<div class="card-body">' +
      '<div style="display:flex;gap:24px;flex-wrap:wrap;">' +
        '<div style="min-width:200px;">' +
          '<label style="display:block;font-weight:600;margin-bottom:6px;">Версия Python</label>' +
          '<select class="input" id="settingsPythonVersion">' +
            '<option value="3.9"' + (settings.pythonVersion === '3.9' ? ' selected' : '') + '>Python 3.9</option>' +
            '<option value="3.10"' + (settings.pythonVersion === '3.10' ? ' selected' : '') + '>Python 3.10</option>' +
            '<option value="3.11"' + (settings.pythonVersion === '3.11' ? ' selected' : '') + '>Python 3.11</option>' +
            '<option value="3.12"' + (settings.pythonVersion === '3.12' ? ' selected' : '') + '>Python 3.12</option>' +
            '<option value="3.13"' + (settings.pythonVersion === '3.13' ? ' selected' : '') + '>Python 3.13</option>' +
          '</select>' +
        '</div>' +
        '<div style="min-width:200px;">' +
          '<label style="display:block;font-weight:600;margin-bottom:6px;">Менеджер окружения</label>' +
          '<div style="display:flex;gap:12px;align-items:center;padding-top:4px;">' +
            '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;">' +
              '<input type="radio" name="envManager" value="uv"' + (settings.useUv ? ' checked' : '') + '> uv' +
            '</label>' +
            '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;">' +
              '<input type="radio" name="envManager" value="venv"' + (!settings.useUv ? ' checked' : '') + '> venv' +
            '</label>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  container.appendChild(card);

  card.querySelector('#settingsPythonVersion').addEventListener('change', function() {
    settings.pythonVersion = this.value;
    App.state.set('settings', settings);
    App.ui.showToast('Версия Python сохранена: ' + this.value, 'success');
  });

  var radios = card.querySelectorAll('input[name="envManager"]');
  radios.forEach(function(radio) {
    radio.addEventListener('change', function() {
      settings.useUv = this.value === 'uv';
      App.state.set('settings', settings);
      App.ui.showToast('Менеджер окружения: ' + (settings.useUv ? 'uv' : 'venv'), 'success');
    });
  });
};

_comp._renderStorageSection = function(container) {
  var self = this;
  var card = document.createElement('div');
  card.className = 'card';
  card.style.cssText = 'margin-bottom:20px;';

  var usedSpace = this._calculateStorageUsed();

  card.innerHTML =
    '<div class="card-header"><h3><i class="fas fa-database"></i> Хранилище</h3></div>' +
    '<div class="card-body">' +
      '<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:16px;">' +
        '<div style="font-size:36px;color:var(--accent);"><i class="fas fa-database"></i></div>' +
        '<div>' +
          '<div style="font-weight:600;">Использовано: <span id="settingsStorageUsed">' + usedSpace + ' КБ</span></div>' +
          '<div class="text-muted" style="font-size:0.85rem;">Данные приложения в локальном хранилище</div>' +
        '</div>' +
      '</div>' +
      '<button class="btn btn-danger" id="settingsClearData">' +
        '<i class="fas fa-trash-alt"></i> Очистить все данные' +
      '</button>' +
    '</div>';

  container.appendChild(card);

  card.querySelector('#settingsClearData').addEventListener('click', function() {
    var confirmed = confirm('Вы уверены, что хотите очистить все данные? Это действие нельзя отменить.');
    if (confirmed) {
      localStorage.clear();
      var usedEl = document.getElementById('settingsStorageUsed');
      if (usedEl) usedEl.textContent = '0 КБ';
      App.ui.showToast('Все данные очищены', 'success');
    }
  });
};

_comp._renderAboutSection = function(container) {
  var card = document.createElement('div');
  card.className = 'card';
  card.style.cssText = 'margin-bottom:20px;';

  card.innerHTML =
    '<div class="card-header"><h3><i class="fas fa-info-circle"></i> О программе</h3></div>' +
    '<div class="card-body">' +
      '<div style="display:flex;gap:24px;flex-wrap:wrap;">' +
        '<div style="flex:1;min-width:200px;">' +
          '<table style="width:100%;border-collapse:collapse;">' +
            '<tr><td style="padding:6px 12px 6px 0;font-weight:600;white-space:nowrap;">Название</td><td>AI Project Companion</td></tr>' +
            '<tr><td style="padding:6px 12px 6px 0;font-weight:600;white-space:nowrap;">Версия</td><td>1.0.0</td></tr>' +
            '<tr><td style="padding:6px 12px 6px 0;font-weight:600;white-space:nowrap;">Описание</td><td>Data Science Project Assistant</td></tr>' +
            '<tr><td style="padding:6px 12px 6px 0;font-weight:600;white-space:nowrap;">Технологии</td><td>HTML5, CSS3, JavaScript, Chart.js, Font Awesome 6</td></tr>' +
            '<tr><td style="padding:6px 12px 6px 0;font-weight:600;white-space:nowrap;">Хранилище</td><td>localStorage</td></tr>' +
          '</table>' +
        '</div>' +
      '</div>' +
    '</div>';

  container.appendChild(card);
};

_comp._calculateStorageUsed = function() {
  var total = 0;
  for (var key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += (key.length + (localStorage[key] || '').length) * 2;
    }
  }
  return (total / 1024).toFixed(1);
};
})();
