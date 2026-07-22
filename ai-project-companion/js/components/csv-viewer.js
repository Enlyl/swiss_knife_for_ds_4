(function () {
  'use strict';

  var state = {
    headers: [],
    rows: [],
    types: {},
    fileName: '',
    page: 0,
    pageSize: 25,
    search: '',
    sortCol: -1,
    sortAsc: true,
    filteredRows: []
  };

  var chartInstance = null;

  function parseCSV(text) {
    var lines = [];
    var current = '';
    var inQuotes = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (i + 1 < text.length && text[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += c;
        }
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        lines.push(current);
        current = '';
      } else if (c === '\n') {
        lines.push(current);
        current = '';
        lines.push('__ROW_END__');
      } else if (c === '\r') {
      } else {
        current += c;
      }
    }
    if (current) lines.push(current);

    var rows = [];
    var row = [];
    for (var j = 0; j < lines.length; j++) {
      if (lines[j] === '__ROW_END__') {
        if (row.length > 0) rows.push(row);
        row = [];
      } else {
        row.push(lines[j]);
      }
    }
    if (row.length > 0) rows.push(row);
    return rows;
  }

  function detectTypes(headers, rows) {
    var types = {};
    for (var i = 0; i < headers.length; i++) {
      types[headers[i]] = 'string';
      for (var r = 0; r < Math.min(rows.length, 100); r++) {
        var val = rows[r][i];
        if (val === undefined || val === null || val === '') continue;
        if (!isNaN(Number(val)) && val.trim() !== '') {
          types[headers[i]] = 'number';
        }
      }
    }
    return types;
  }

  function countMissing(rows) {
    var missing = 0;
    var emptyVals = { '': true, 'null': true, 'na': true, 'nan': true, 'none': true, 'undefined': true };
    for (var i = 0; i < rows.length; i++) {
      for (var j = 0; j < rows[i].length; j++) {
        var v = (rows[i][j] || '').toString().trim().toLowerCase();
        if (emptyVals[v]) missing++;
      }
    }
    return missing;
  }

  function estimateMemory(rows, cols) {
    var bytes = rows * cols * 8;
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  function escHtml(str) {
    if (typeof str !== 'string') return '';
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function loadData(text, fileName) {
    var parsed = parseCSV(text);
    if (parsed.length < 1) {
      App.ui.showToast('Файл пуст или имеет неверный формат', 'error');
      return;
    }
    state.headers = parsed[0];
    state.rows = parsed.slice(1);
    state.fileName = fileName || 'unknown.csv';
    state.types = detectTypes(state.headers, state.rows);
    state.search = '';
    state.sortCol = -1;
    state.sortAsc = true;
    state.page = 0;
    applyFilters();
  }

  function applyFilters() {
    var rows = state.rows;
    if (state.search) {
      var q = state.search.toLowerCase();
      rows = rows.filter(function (r) {
        for (var i = 0; i < r.length; i++) {
          if ((r[i] || '').toString().toLowerCase().indexOf(q) !== -1) return true;
        }
        return false;
      });
    }
    if (state.sortCol >= 0 && state.sortCol < state.headers.length) {
      var col = state.sortCol;
      var asc = state.sortAsc;
      rows = rows.slice().sort(function (a, b) {
        var va = (a[col] || '').toString();
        var vb = (b[col] || '').toString();
        var na = parseFloat(va);
        var nb = parseFloat(vb);
        if (!isNaN(na) && !isNaN(nb)) {
          return asc ? na - nb : nb - na;
        }
        return asc ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    }
    state.filteredRows = rows;
    if (state.pageSize > 0) {
      var maxPage = Math.max(0, Math.ceil(rows.length / state.pageSize) - 1);
      if (state.page > maxPage) state.page = maxPage;
    } else {
      state.page = 0;
    }
    renderTable();
    renderStats();
  }

  function renderUploadZone(container) {
    container.innerHTML =
      '<div class="card"><div class="card-body">' +
      '<div class="upload-zone" id="csvDropZone" style="text-align:center;padding:48px 24px;border:2px dashed var(--border);border-radius:var(--radius-lg);cursor:pointer;transition:var(--transition)">' +
      '<i class="fas fa-cloud-upload-alt" style="font-size:48px;color:var(--accent);margin-bottom:16px;"></i>' +
      '<h3>Перетащите CSV файл сюда</h3>' +
      '<p class="text-muted">или нажмите для выбора файла</p>' +
      '<input type="file" accept=".csv" id="csvFileInput" hidden>' +
      '<button class="btn btn-primary" id="csvSelectBtn">Выбрать файл</button>' +
      '</div></div></div>';
    attachUploadEvents(container);
  }

  function attachUploadEvents(container) {
    var dropZone = document.getElementById('csvDropZone');
    var fileInput = document.getElementById('csvFileInput');
    var selectBtn = document.getElementById('csvSelectBtn');
    if (!dropZone) return;

    if (selectBtn) {
      selectBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (fileInput) fileInput.click();
      });
    }
    dropZone.addEventListener('click', function () {
      if (fileInput) fileInput.click();
    });
    if (fileInput) {
      fileInput.addEventListener('change', function () {
        if (fileInput.files && fileInput.files[0]) {
          handleFile(fileInput.files[0]);
        }
      });
    }
    dropZone.addEventListener('dragover', function (e) {
      e.preventDefault();
      dropZone.style.borderColor = 'var(--accent)';
      dropZone.style.background = 'var(--accent-light)';
    });
    dropZone.addEventListener('dragleave', function () {
      dropZone.style.borderColor = 'var(--border)';
      dropZone.style.background = 'transparent';
    });
    dropZone.addEventListener('drop', function (e) {
      e.preventDefault();
      dropZone.style.borderColor = 'var(--border)';
      dropZone.style.background = 'transparent';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    });
  }

  function handleFile(file) {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      App.ui.showToast('Пожалуйста, выберите CSV файл', 'error');
      return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
      loadData(e.target.result, file.name);
      state.page = 0;
      var container = document.getElementById('appContent');
      if (container) renderDataView(container);
    };
    reader.readAsText(file);
  }

  function renderDataView(container) {
    var html = '';

    html += '<div class="card" style="margin-bottom:16px;"><div class="card-body" style="display:flex;justify-content:space-between;align-items:center;">' +
      '<div><i class="fas fa-file-csv" style="color:var(--accent);margin-right:8px;"></i> <strong id="csvFileName">' + escHtml(state.fileName) + '</strong> | Строк: <span id="csvRowCount">' + state.rows.length + '</span> | Колонок: <span id="csvColCount">' + state.headers.length + '</span></div>' +
      '<button class="btn btn-sm btn-secondary" id="csvNewFileBtn"><i class="fas fa-upload"></i> Новый файл</button>' +
      '</div></div>';

    var missingCount = countMissing(state.rows);
    var memEstimate = estimateMemory(state.rows.length, state.headers.length);
    html += '<div class="grid grid-4" style="margin-bottom:16px;">' +
      '<div class="card" style="text-align:center;padding:16px 12px;"><div style="font-size:1.5rem;font-weight:700;color:var(--accent)">' + state.rows.length + '</div><div style="font-size:0.8rem;color:var(--text-muted)">Всего строк</div></div>' +
      '<div class="card" style="text-align:center;padding:16px 12px;"><div style="font-size:1.5rem;font-weight:700;color:var(--success)">' + state.headers.length + '</div><div style="font-size:0.8rem;color:var(--text-muted)">Всего колонок</div></div>' +
      '<div class="card" style="text-align:center;padding:16px 12px;"><div style="font-size:1.5rem;font-weight:700;color:var(--warning)">' + missingCount + '</div><div style="font-size:0.8rem;color:var(--text-muted)">Пропущенных значений</div></div>' +
      '<div class="card" style="text-align:center;padding:16px 12px;"><div style="font-size:1.5rem;font-weight:700;color:var(--purple)">' + memEstimate + '</div><div style="font-size:0.8rem;color:var(--text-muted)">Оценка памяти</div></div>' +
      '</div>';

    html += '<div class="card"><div class="card-body">' +
      '<div style="display:flex;gap:12px;margin-bottom:12px;flex-wrap:wrap;align-items:center;">' +
      '<div class="search-bar" style="flex:1;min-width:200px;">' +
      '<i class="fas fa-search search-icon"></i>' +
      '<input type="text" class="search-input" id="csvSearch" placeholder="Поиск по всем колонкам..." value="' + escHtml(state.search) + '">' +
      '</div>' +
      '<select class="select" id="csvPageSize" style="width:auto;">' +
      '<option value="10"' + (state.pageSize === 10 ? ' selected' : '') + '>10 строк</option>' +
      '<option value="25"' + (state.pageSize === 25 ? ' selected' : '') + '>25 строк</option>' +
      '<option value="50"' + (state.pageSize === 50 ? ' selected' : '') + '>50 строк</option>' +
      '<option value="100"' + (state.pageSize === 100 ? ' selected' : '') + '>100 строк</option>' +
      '<option value="0"' + (state.pageSize === 0 ? ' selected' : '') + '>Все</option>' +
      '</select>' +
      '<span class="text-muted" id="csvPageInfo"></span>' +
      '<div style="display:flex;gap:4px;">' +
      '<button class="btn btn-icon btn-sm" id="csvPrevBtn"><i class="fas fa-chevron-left"></i></button>' +
      '<button class="btn btn-icon btn-sm" id="csvNextBtn"><i class="fas fa-chevron-right"></i></button>' +
      '</div>' +
      '</div>' +
      '<div style="overflow-x:auto;">' +
      '<table class="data-table" id="csvTable" style="width:100%;border-collapse:collapse;font-size:0.875rem;">' +
      '<thead id="csvThead"></thead>' +
      '<tbody id="csvTbody"></tbody>' +
      '</table>' +
      '</div>' +
      '</div></div>';

    var chartHtml = '<div class="card" style="margin-top:16px;"><div class="card-header" style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">' +
      '<h3 style="margin:0;font-size:1.1rem;"><i class="fas fa-chart-bar" style="margin-right:8px;"></i> Визуализация</h3></div><div class="card-body">' +
      '<div class="grid grid-4" style="margin-bottom:16px;">' +
      '<div class="form-group" style="margin-bottom:0;"><label class="form-label">Тип</label><select class="select" id="chartType">' +
      '<option value="bar">Столбчатая</option><option value="line">Линейная</option>' +
      '<option value="scatter">Точечная</option><option value="pie">Круговая</option>' +
      '</select></div>' +
      '<div class="form-group" style="margin-bottom:0;"><label class="form-label">Ось X</label><select class="select" id="chartX"></select></div>' +
      '<div class="form-group" style="margin-bottom:0;"><label class="form-label">Ось Y</label><select class="select" id="chartY"></select></div>' +
      '<div class="form-group" style="margin-bottom:0;"><label class="form-label">&nbsp;</label><button class="btn btn-primary" id="chartGoBtn" style="width:100%;">Построить</button></div>' +
      '</div>' +
      '<canvas id="csvChartCanvas" height="300" style="max-height:400px;"></canvas>' +
      '</div></div>';

    html += chartHtml;
    container.innerHTML = html;

    bindEvents(container);
    renderTable();
    renderStats();
    populateChartSelects();
  }

  function renderTable() {
    var thead = document.getElementById('csvThead');
    var tbody = document.getElementById('csvTbody');
    if (!thead || !tbody) return;

    var headerHtml = '<tr>';
    for (var i = 0; i < state.headers.length; i++) {
      var sortIcon = 'fa-sort';
      if (state.sortCol === i) {
        sortIcon = state.sortAsc ? 'fa-sort-up' : 'fa-sort-down';
      }
      headerHtml += '<th style="padding:10px 14px;text-align:left;font-weight:600;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.04em;color:var(--text-muted);background:var(--bg-secondary);border-bottom:1px solid var(--border);white-space:nowrap;cursor:pointer;user-select:none;" class="csv-sort-th" data-col="' + i + '">' +
        '<span style="display:inline-flex;align-items:center;gap:4px;">' + escHtml(state.headers[i]) + ' <i class="fas ' + sortIcon + '" style="font-size:0.65rem;color:var(--text-muted);"></i></span></th>';
    }
    headerHtml += '</tr>';
    thead.innerHTML = headerHtml;

    var displayRows = state.filteredRows;
    var total = displayRows.length;
    var start = 0;
    var end = total;
    if (state.pageSize > 0) {
      start = state.page * state.pageSize;
      end = Math.min(start + state.pageSize, total);
    }
    var pageRows = displayRows.slice(start, end);

    var bodyHtml = '';
    for (var r = 0; r < pageRows.length; r++) {
      bodyHtml += '<tr class="' + (r % 2 === 1 ? '' : '') + '" style="transition:background 0.1s;">';
      for (var c = 0; c < state.headers.length; c++) {
        var val = pageRows[r][c] !== undefined ? pageRows[r][c] : '';
        var cls = state.types[state.headers[c]] === 'number' ? '' : '';
        bodyHtml += '<td style="padding:10px 14px;border-bottom:1px solid var(--border);color:var(--text-secondary);' + (state.types[state.headers[c]] === 'number' ? 'text-align:right;font-family:var(--font-mono);' : '') + '">' + escHtml(val) + '</td>';
      }
      bodyHtml += '</tr>';
    }
    if (pageRows.length === 0) {
      bodyHtml += '<tr><td colspan="' + state.headers.length + '" style="padding:40px;text-align:center;color:var(--text-muted);">Нет данных</td></tr>';
    }
    tbody.innerHTML = bodyHtml;

    var pageInfo = document.getElementById('csvPageInfo');
    if (pageInfo) {
      var shownStart = total > 0 ? start + 1 : 0;
      pageInfo.textContent = shownStart + '-' + end + ' из ' + total;
    }

    thead.querySelectorAll('.csv-sort-th').forEach(function (th) {
      th.addEventListener('click', function () {
        var col = parseInt(th.getAttribute('data-col'), 10);
        if (state.sortCol === col) {
          state.sortAsc = !state.sortAsc;
        } else {
          state.sortCol = col;
          state.sortAsc = true;
        }
        state.page = 0;
        applyFilters();
      });
    });
  }

  function renderStats() {
    var rowCount = document.getElementById('csvRowCount');
    var colCount = document.getElementById('csvColCount');
    if (rowCount) rowCount.textContent = state.rows.length;
    if (colCount) colCount.textContent = state.headers.length;
  }

  function populateChartSelects() {
    var chartX = document.getElementById('chartX');
    var chartY = document.getElementById('chartY');
    if (!chartX || !chartY) return;
    chartX.innerHTML = '';
    chartY.innerHTML = '';
    for (var i = 0; i < state.headers.length; i++) {
      var opt1 = document.createElement('option');
      opt1.value = i;
      opt1.textContent = state.headers[i];
      chartX.appendChild(opt1);
      var opt2 = document.createElement('option');
      opt2.value = i;
      opt2.textContent = state.headers[i];
      chartY.appendChild(opt2);
    }
    if (state.headers.length > 1) {
      chartY.selectedIndex = 1;
    } else if (state.headers.length > 0) {
      chartY.selectedIndex = 0;
    }
  }

  function buildChart() {
    var chartType = document.getElementById('chartType');
    var chartX = document.getElementById('chartX');
    var chartY = document.getElementById('chartY');
    var canvas = document.getElementById('csvChartCanvas');
    if (!chartType || !chartX || !chartY || !canvas) return;

    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }

    var type = chartType.value;
    var xCol = parseInt(chartX.value, 10);
    var yCol = parseInt(chartY.value, 10);

    if (isNaN(xCol) || xCol < 0) {
      App.ui.showToast('Выберите колонку для оси X', 'warning');
      return;
    }

    var rows = state.filteredRows.length > 0 ? state.filteredRows : state.rows;
    var labels = [];
    var values = [];
    var xIsNum = state.types[state.headers[xCol]] === 'number';

    if (type === 'pie') {
      var counts = {};
      for (var i = 0; i < rows.length; i++) {
        var v = (rows[i][xCol] || '').toString();
        if (!counts[v]) counts[v] = 0;
        counts[v]++;
      }
      labels = Object.keys(counts);
      values = labels.map(function (k) { return counts[k]; });
    } else {
      for (var j = 0; j < rows.length; j++) {
        var xv = rows[j][xCol] !== undefined ? rows[j][xCol] : '';
        var yv = rows[j][yCol] !== undefined ? rows[j][yCol] : '';
        if (type === 'scatter') {
          var xn = parseFloat(xv);
          var yn = parseFloat(yv);
          if (!isNaN(xn) && !isNaN(yn)) {
            labels.push(xn);
            values.push(yn);
          }
        } else {
          labels.push(xIsNum ? parseFloat(xv) : xv);
          values.push(parseFloat(yv) || 0);
        }
      }
    }

    if (labels.length === 0) {
      App.ui.showToast('Нет данных для построения графика', 'warning');
      return;
    }

    var ctx = canvas.getContext('2d');
    var config = {
      type: type === 'scatter' ? 'scatter' : (type === 'pie' ? 'pie' : type),
      data: {
        labels: type === 'scatter' ? undefined : labels,
        datasets: [{
          label: type === 'pie' ? state.headers[xCol] : state.headers[yCol],
          data: type === 'scatter' ? labels.map(function (x, i) { return { x: x, y: values[i] }; }) : values,
          backgroundColor: type === 'pie' ? [
            '#58a6ff','#3fb950','#d29922','#f85149','#bc8cff','#f778ba','#f0883e','#39d2c0',
            '#79c0ff','#7ee787','#ffa657','#d2a8ff','#ff7b72','#a5d6ff','#8b949e'
          ] : 'rgba(88,166,255,0.7)',
          borderColor: type === 'pie' ? '#1c2128' : '#58a6ff',
          borderWidth: type === 'pie' ? 2 : (type === 'scatter' ? 0 : 2),
          pointRadius: type === 'scatter' ? 4 : undefined,
          fill: type !== 'scatter'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#8b949e' } },
          tooltip: { enabled: true }
        },
        scales: type !== 'pie' ? {
          x: {
            title: { display: true, text: state.headers[xCol], color: '#8b949e' },
            ticks: { color: '#6e7681' },
            grid: { color: 'rgba(48,54,61,0.5)' }
          },
          y: {
            title: { display: true, text: state.headers[yCol], color: '#8b949e' },
            ticks: { color: '#6e7681' },
            grid: { color: 'rgba(48,54,61,0.5)' }
          }
        } : undefined
      }
    };

    if (type === 'scatter') {
      config.options.scales.x.type = 'linear';
    }

    try {
      chartInstance = new Chart(ctx, config);
    } catch (e) {
      App.ui.showToast('Ошибка построения графика: ' + e.message, 'error');
    }
  }

  function bindEvents(container) {
    var searchInput = document.getElementById('csvSearch');
    var pageSize = document.getElementById('csvPageSize');
    var prevBtn = document.getElementById('csvPrevBtn');
    var nextBtn = document.getElementById('csvNextBtn');
    var newFileBtn = document.getElementById('csvNewFileBtn');
    var chartGoBtn = document.getElementById('chartGoBtn');

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        state.search = searchInput.value;
        state.page = 0;
        applyFilters();
      });
    }

    if (pageSize) {
      pageSize.addEventListener('change', function () {
        state.pageSize = parseInt(pageSize.value, 10);
        state.page = 0;
        applyFilters();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        if (state.page > 0) {
          state.page--;
          applyFilters();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        var total = state.filteredRows.length;
        var maxPage = Math.max(0, Math.ceil(total / (state.pageSize || total)) - 1);
        if (state.page < maxPage) {
          state.page++;
          applyFilters();
        }
      });
    }

    if (newFileBtn) {
      newFileBtn.addEventListener('click', function () {
        resetState();
        renderUploadZone(container);
      });
    }

    if (chartGoBtn) {
      chartGoBtn.addEventListener('click', function () {
        buildChart();
      });
    }

    var chartType = document.getElementById('chartType');
    var chartX = document.getElementById('chartX');
    if (chartType && chartX) {
      chartType.addEventListener('change', function () {
        var isPie = chartType.value === 'pie';
        var yLabel = document.querySelector('label[for="chartY"]');
        if (yLabel) yLabel.style.display = isPie ? 'none' : 'block';
        var ySel = document.getElementById('chartY');
        if (ySel) ySel.style.display = isPie ? 'none' : 'block';
      });
    }
  }

  function resetState() {
    state.headers = [];
    state.rows = [];
    state.types = {};
    state.fileName = '';
    state.page = 0;
    state.pageSize = 25;
    state.search = '';
    state.sortCol = -1;
    state.sortAsc = true;
    state.filteredRows = [];
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
  }

  App.registerComponent({
    id: 'csv-viewer',
    title: 'CSV Viewer',
    icon: 'fa-table',
    init: function () {},
    render: function (container) {
      if (state.rows.length > 0 && state.fileName) {
        renderDataView(container);
      } else {
        renderUploadZone(container);
      }
    },
    destroy: function () {
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
    }
  });
})();
