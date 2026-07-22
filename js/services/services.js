/* ==========================================================================
   services.js — AI Project Companion Services
   Все службы прикрепляются к window.App (создаётся в js/core/app.js)
   ========================================================================== */

/* ==========================================================================
   1. App.projectManager — Управление проектами
   ========================================================================== */
(function () {
  if (!window.App) return;

  App.projectManager = {
    _projects: [],
    _currentProjectId: null,

    // ---------------------------------------------------------------
    // CRUD
    // ---------------------------------------------------------------

    createProject: function (data) {
      var now = new Date().toISOString();
      var project = {
        id: 'proj_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        name: data.name || 'Без имени',
        description: data.description || '',
        rootDir: data.rootDir || '',
        templateId: data.templateId || 'data-analysis',
        libraries: data.libraries || [],
        pythonVersion: data.pythonVersion || '3.12',
        useUv: data.useUv !== undefined ? data.useUv : true,
        createdAt: now,
        updatedAt: now,
        status: 'planning',
        roadmap: [],
        progress: { roadmap: 0, setup: 0, total: 0 },
        envConfig: {
          python: data.pythonVersion || '3.12',
          uv: data.useUv !== undefined ? data.useUv : true,
          packages: data.libraries || [],
          extras: []
        },
        generatedFiles: {},
        structure: []
      };

      var template = App.templateManager
        ? App.templateManager.getTemplate(project.templateId)
        : null;

      if (template) {
        project.roadmap = JSON.parse(JSON.stringify(template.roadmap));
        project.structure = JSON.parse(JSON.stringify(template.structure));
        if (!project.libraries.length) {
          project.libraries = template.libraries
            .filter(function (l) { return l.checked; })
            .map(function (l) { return l.name; });
          project.envConfig.packages = project.libraries.slice();
        }
      }

      this._projects.push(project);
      this._currentProjectId = project.id;
      this._save();
      return project;
    },

    updateProject: function (id, data) {
      var project = this.getProject(id);
      if (!project) return null;
      var keys = Object.keys(data);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key === 'id' || key === 'createdAt') continue;
        project[key] = data[key];
      }
      project.updatedAt = new Date().toISOString();
      this._save();
      return project;
    },

    deleteProject: function (id) {
      var idx = -1;
      for (var i = 0; i < this._projects.length; i++) {
        if (this._projects[i].id === id) { idx = i; break; }
      }
      if (idx === -1) return false;
      this._projects.splice(idx, 1);
      if (this._currentProjectId === id) {
        this._currentProjectId = this._projects.length
          ? this._projects[0].id
          : null;
      }
      this._save();
      return true;
    },

    getProject: function (id) {
      for (var i = 0; i < this._projects.length; i++) {
        if (this._projects[i].id === id) return this._projects[i];
      }
      return null;
    },

    getAllProjects: function () {
      return this._projects.slice();
    },

    getCurrentProject: function () {
      if (!this._currentProjectId) return null;
      return this.getProject(this._currentProjectId);
    },

    setCurrentProject: function (id) {
      if (this.getProject(id)) {
        this._currentProjectId = id;
        return true;
      }
      return false;
    },

    // ---------------------------------------------------------------
    // Генерация файлов проекта
    // ---------------------------------------------------------------

    generateProjectFiles: function (project) {
      if (!project) return {};
      var fileGen = App.fileGenerator;
      if (!fileGen) return {};

      var files = {};
      var readme = fileGen.generateREADME(project);
      if (readme) files['README.md'] = readme;

      var pyproject = fileGen.generatePyprojectToml(project);
      if (pyproject) files['pyproject.toml'] = pyproject;

      var req = fileGen.generateRequirements(project);
      if (req) files['requirements.txt'] = req;

      var gitignore = fileGen.generateGitignore(project);
      if (gitignore) files['.gitignore'] = gitignore;

      var envExample = fileGen.generateEnvExample(project);
      if (envExample) files['.env.example'] = envExample;

      var makefile = fileGen.generateMakefile(project);
      if (makefile) files['Makefile'] = makefile;

      var docker = fileGen.generateDockerfile(project);
      if (docker) files['Dockerfile'] = docker;

      var dc = fileGen.generateDockerCompose(project);
      if (dc) files['docker-compose.yml'] = dc;

      var ghActions = fileGen.generateGitHubActions(project);
      if (ghActions) files['.github/workflows/ci.yml'] = ghActions;

      var vsc = fileGen.generateVSCodeConfig(project);
      if (vsc) {
        if (vsc.settings) files['.vscode/settings.json'] = vsc.settings;
        if (vsc.launch) files['.vscode/launch.json'] = vsc.launch;
      }

      project.generatedFiles = files;
      project.updatedAt = new Date().toISOString();
      this._save();
      return files;
    },

    getProjectStructure: function (project) {
      if (!project || !project.structure) return [];
      return project.structure.slice();
    },

    // ---------------------------------------------------------------
    // Прогресс
    // ---------------------------------------------------------------

    calculateProgress: function (project) {
      if (!project) return { roadmap: 0, setup: 0, total: 0 };
      var roadmapDone = 0;
      var totalRoadmap = project.roadmap.length || 1;
      for (var i = 0; i < project.roadmap.length; i++) {
        if (project.roadmap[i].done) roadmapDone++;
      }
      var setupScore = project.generatedFiles
        ? Object.keys(project.generatedFiles).length / 10
        : 0;
      if (setupScore > 1) setupScore = 1;
      var rProgress = Math.round((roadmapDone / totalRoadmap) * 100);
      var sProgress = Math.round(setupScore * 100);
      project.progress = {
        roadmap: rProgress,
        setup: sProgress,
        total: Math.round((rProgress + sProgress) / 2)
      };
      return project.progress;
    },

    // ---------------------------------------------------------------
    // Персистентность (localStorage)
    // ---------------------------------------------------------------

    _save: function () {
      try {
        var data = {
          projects: this._projects,
          currentId: this._currentProjectId
        };
        localStorage.setItem('apc_projects', JSON.stringify(data));
      } catch (e) { /* ignore */ }
    },

    loadFromStorage: function () {
      try {
        var raw = localStorage.getItem('apc_projects');
        if (!raw) return;
        var data = JSON.parse(raw);
        if (data.projects) this._projects = data.projects;
        if (data.currentId) this._currentProjectId = data.currentId;
      } catch (e) { /* ignore */ }
    }
  };

  // Пробуем загрузить сохранённые проекты
  if (App.projectManager.loadFromStorage) {
    App.projectManager.loadFromStorage();
  }
})();

/* ==========================================================================
   2. App.templateManager — Управление шаблонами
   ========================================================================== */
(function () {
  if (!window.App) return;

  // ---------------------------------------------------------------
  // Вспомогательная функция для создания библиотеки
  // ---------------------------------------------------------------
  function lib(name, desc, category, checked, popular, required) {
    return {
      name: name,
      version: 'latest',
      description: desc || '',
      category: category || 'core',
      checked: checked !== undefined ? checked : true,
      popular: popular !== undefined ? popular : true,
      required: required !== undefined ? required : false
    };
  }

  App.templateManager = {
    _templates: [],

    getTemplates: function () {
      if (!this._templates.length) this._initTemplates();
      return this._templates.slice();
    },

    getTemplate: function (id) {
      if (!this._templates.length) this._initTemplates();
      for (var i = 0; i < this._templates.length; i++) {
        if (this._templates[i].id === id) return this._templates[i];
      }
      return null;
    },

    getCategories: function () {
      if (!this._templates.length) this._initTemplates();
      var cats = {};
      for (var i = 0; i < this._templates.length; i++) {
        var t = this._templates[i];
        if (!cats[t.category]) cats[t.category] = [];
        cats[t.category].push(t);
      }
      return cats;
    },

    // ---------------------------------------------------------------
    // Инициализация встроенных шаблонов
    // ---------------------------------------------------------------
    _initTemplates: function () {
      var self = this;

      // ---- 1. Data Analysis ----
      this._templates.push({
        id: 'data-analysis',
        name: 'Data Analysis',
        icon: 'fa-chart-bar',
        level: 'beginner',
        iconText: 'DA',
        color: '#4CAF50',
        description: 'Базовый анализ данных: загрузка, очистка, визуализация и отчёты',
        category: 'Анализ данных',
        libraries: [
          lib('pandas', 'Обработка табличных данных', 'core', true, true, true),
          lib('numpy', 'Численные вычисления и массивы', 'core', true, true, true),
          lib('matplotlib', 'Базовая визуализация', 'viz', true, true, false),
          lib('seaborn', 'Статистическая визуализация', 'viz', true, true, false),
          lib('scipy', 'Научные вычисления', 'core', true, false, false),
          lib('jupyter', 'Интерактивные блокноты', 'tools', true, true, false),
          lib('openpyxl', 'Работа с Excel .xlsx', 'io', true, false, false),
          lib('xlrd', 'Работа с Excel .xls', 'io', false, false, false)
        ],
        presets: ['Минимальный', 'Полный стек', 'С ML'],
        structure: [
          { name: 'data', type: 'dir', children: [
            { name: 'raw', type: 'dir', children: [] },
            { name: 'processed', type: 'dir', children: [] }
          ]},
          { name: 'notebooks', type: 'dir', children: [] },
          { name: 'src', type: 'dir', children: [
            { name: '__init__.py', type: 'file' },
            { name: 'data_loader.py', type: 'file' },
            { name: 'cleaning.py', type: 'file' },
            { name: 'visualization.py', type: 'file' }
          ]},
          { name: 'tests', type: 'dir', children: [
            { name: '__init__.py', type: 'file' }
          ]},
          { name: 'outputs', type: 'dir', children: [
            { name: 'figures', type: 'dir', children: [] },
            { name: 'reports', type: 'dir', children: [] }
          ]}
        ],
        roadmap: [
          { id: 'da-1', title: 'Настройка окружения', description: 'Установка Python и библиотек', done: false },
          { id: 'da-2', title: 'Загрузка данных', description: 'Импорт данных из CSV, Excel, БД', done: false },
          { id: 'da-3', title: 'Очистка данных', description: 'Обработка пропусков, дубликатов, выбросов', done: false },
          { id: 'da-4', title: 'Разведочный анализ (EDA)', description: 'Статистики, распределения, корреляции', done: false },
          { id: 'da-5', title: 'Визуализация', description: 'Построение графиков и дашбордов', done: false },
          { id: 'da-6', title: 'Отчёт', description: 'Формирование выводов и презентация результатов', done: false }
        ]
      });

      // ---- 2. Machine Learning ----
      this._templates.push({
        id: 'machine-learning',
        name: 'Machine Learning',
        icon: 'fa-robot',
        level: 'intermediate',
        iconText: 'ML',
        color: '#2196F3',
        description: 'Полный цикл ML: от подготовки данных до развёртывания модели',
        category: 'Машинное обучение',
        libraries: [
          lib('pandas', 'Обработка табличных данных', 'core', true, true, true),
          lib('numpy', 'Численные вычисления', 'core', true, true, true),
          lib('scikit-learn', 'Классические алгоритмы ML', 'ml', true, true, true),
          lib('matplotlib', 'Базовая визуализация', 'viz', true, true, false),
          lib('seaborn', 'Статистическая визуализация', 'viz', true, true, false),
          lib('xgboost', 'Градиентный бустинг (XGBoost)', 'ml', true, true, false),
          lib('lightgbm', 'Градиентный бустинг (LightGBM)', 'ml', true, false, false),
          lib('optuna', 'Гиперпараметрическая оптимизация', 'ml', true, false, false),
          lib('mlflow', 'Эксперименты и логирование', 'mlops', true, true, false),
          lib('shap', 'Объяснение моделей (SHAP)', 'ml', true, false, false)
        ],
        presets: ['Быстрый старт', 'Продакшн', 'Соревнования'],
        structure: [
          { name: 'data', type: 'dir', children: [
            { name: 'raw', type: 'dir', children: [] },
            { name: 'processed', type: 'dir', children: [] },
            { name: 'external', type: 'dir', children: [] }
          ]},
          { name: 'notebooks', type: 'dir', children: [
            { name: '01-eda.ipynb', type: 'file' },
            { name: '02-feature-engineering.ipynb', type: 'file' },
            { name: '03-modeling.ipynb', type: 'file' }
          ]},
          { name: 'src', type: 'dir', children: [
            { name: '__init__.py', type: 'file' },
            { name: 'data', type: 'dir', children: [
              { name: '__init__.py', type: 'file' },
              { name: 'loader.py', type: 'file' },
              { name: 'preprocessing.py', type: 'file' }
            ]},
            { name: 'features', type: 'dir', children: [
              { name: '__init__.py', type: 'file' },
              { name: 'build_features.py', type: 'file' }
            ]},
            { name: 'models', type: 'dir', children: [
              { name: '__init__.py', type: 'file' },
              { name: 'train.py', type: 'file' },
              { name: 'predict.py', type: 'file' },
              { name: 'evaluate.py', type: 'file' }
            ]}
          ]},
          { name: 'models', type: 'dir', children: [] },
          { name: 'tests', type: 'dir', children: [
            { name: '__init__.py', type: 'file' },
            { name: 'test_data.py', type: 'file' },
            { name: 'test_models.py', type: 'file' }
          ]},
          { name: 'configs', type: 'dir', children: [
            { name: 'config.yaml', type: 'file' },
            { name: 'params.yaml', type: 'file' }
          ]},
          { name: 'experiments', type: 'dir', children: [] }
        ],
        roadmap: [
          { id: 'ml-1', title: 'Настройка окружения', description: 'Установка Python, CUDA (если нужно), библиотек', done: false },
          { id: 'ml-2', title: 'Подготовка данных', description: 'Сбор, очистка, разметка, split на train/test', done: false },
          { id: 'ml-3', title: 'Разведочный анализ', description: 'Визуализация, поиск инсайтов, корреляции', done: false },
          { id: 'ml-4', title: 'Инжиниринг признаков', description: 'Создание, отбор, трансформация признаков', done: false },
          { id: 'ml-5', title: 'Обучение модели', description: 'Выбор алгоритма, тренировка, валидация', done: false },
          { id: 'ml-6', title: 'Настройка гиперпараметров', description: 'GridSearch, Optuna, Ray Tune', done: false },
          { id: 'ml-7', title: 'Оценка качества', description: 'Метрики, confusion matrix, ROC-AUC, SHAP', done: false },
          { id: 'ml-8', title: 'Развёртывание', description: 'Экспорт, API, мониторинг', done: false }
        ]
      });

      // ---- 3. NLP ----
      this._templates.push({
        id: 'nlp',
        name: 'NLP',
        icon: 'fa-language',
        level: 'intermediate',
        iconText: 'NLP',
        color: '#9C27B0',
        description: 'Обработка естественного языка: трансформеры, токенизация, LLM',
        category: 'Машинное обучение',
        libraries: [
          lib('transformers', 'Модели трансформеров (Hugging Face)', 'nlp', true, true, true),
          lib('datasets', 'Датасеты Hugging Face', 'nlp', true, true, false),
          lib('tokenizers', 'Быстрая токенизация', 'nlp', true, true, false),
          lib('torch', 'PyTorch — фреймворк глубокого обучения', 'dl', true, true, true),
          lib('pandas', 'Обработка табличных данных', 'core', true, true, false),
          lib('numpy', 'Численные вычисления', 'core', true, true, false),
          lib('scikit-learn', 'Метрики и вспомогательные ML', 'ml', true, true, false),
          lib('nltk', 'Классическая NLP (токены, стемминг)', 'nlp', true, false, false),
          lib('spacy', 'Индустриальная NLP (пайплайны)', 'nlp', true, true, false),
          lib('huggingface-hub', 'Хабы моделей и датасетов', 'nlp', true, false, false)
        ],
        presets: ['Базовый', 'Трансформеры', 'Продакшн'],
        structure: [
          { name: 'data', type: 'dir', children: [
            { name: 'raw', type: 'dir', children: [] },
            { name: 'processed', type: 'dir', children: [] }
          ]},
          { name: 'notebooks', type: 'dir', children: [] },
          { name: 'src', type: 'dir', children: [
            { name: '__init__.py', type: 'file' },
            { name: 'preprocessing.py', type: 'file' },
            { name: 'tokenization.py', type: 'file' },
            { name: 'model.py', type: 'file' },
            { name: 'evaluation.py', type: 'file' }
          ]},
          { name: 'models', type: 'dir', children: [] },
          { name: 'tests', type: 'dir', children: [
            { name: '__init__.py', type: 'file' }
          ]},
          { name: 'configs', type: 'dir', children: [
            { name: 'config.yaml', type: 'file' }
          ]},
          { name: 'experiments', type: 'dir', children: [] }
        ],
        roadmap: [
          { id: 'nlp-1', title: 'Настройка окружения', description: 'Установка PyTorch и библиотек NLP', done: false },
          { id: 'nlp-2', title: 'Сбор данных', description: 'Загрузка текстовых датасетов, парсинг', done: false },
          { id: 'nlp-3', title: 'Предобработка текста', description: 'Очистка, лемматизация, стемминг', done: false },
          { id: 'nlp-4', title: 'Токенизация', description: 'Разбиение на токены, BPE, WordPiece', done: false },
          { id: 'nlp-5', title: 'Выбор модели', description: 'BERT, RoBERTa, GPT, T5 и т.д.', done: false },
          { id: 'nlp-6', title: 'Тонкая настройка', description: 'Fine-tuning на своей задаче', done: false },
          { id: 'nlp-7', title: 'Оценка', description: 'Accuracy, F1, BLEU, ROUGE, Perplexity', done: false },
          { id: 'nlp-8', title: 'Развёртывание', description: 'Экспорт, ONNX, API, инференс', done: false }
        ]
      });

      // ---- 4. Computer Vision ----
      this._templates.push({
        id: 'computer-vision',
        name: 'Computer Vision',
        icon: 'fa-eye',
        level: 'advanced',
        iconText: 'CV',
        color: '#FF9800',
        description: 'Компьютерное зрение: классификация, детекция, сегментация',
        category: 'Глубокое обучение',
        libraries: [
          lib('torch', 'PyTorch', 'dl', true, true, true),
          lib('torchvision', 'Модели и датасеты CV', 'cv', true, true, true),
          lib('opencv-python', 'Обработка изображений (OpenCV)', 'cv', true, true, false),
          lib('pandas', 'Обработка табличных данных', 'core', true, true, false),
          lib('numpy', 'Численные вычисления', 'core', true, true, false),
          lib('matplotlib', 'Визуализация', 'viz', true, true, false),
          lib('albumentations', 'Аугментация изображений', 'cv', true, true, false),
          lib('pillow', 'Работа с изображениями (PIL)', 'cv', true, true, false),
          lib('scikit-learn', 'Вспомогательные ML', 'ml', true, false, false),
          lib('tensorboard', 'Визуализация обучения', 'tools', true, false, false)
        ],
        presets: ['Классификация', 'Детекция', 'Сегментация'],
        structure: [
          { name: 'data', type: 'dir', children: [
            { name: 'images', type: 'dir', children: [] },
            { name: 'annotations', type: 'dir', children: [] }
          ]},
          { name: 'notebooks', type: 'dir', children: [] },
          { name: 'src', type: 'dir', children: [
            { name: '__init__.py', type: 'file' },
            { name: 'dataset.py', type: 'file' },
            { name: 'transforms.py', type: 'file' },
            { name: 'model.py', type: 'file' },
            { name: 'train.py', type: 'file' },
            { name: 'utils.py', type: 'file' }
          ]},
          { name: 'models', type: 'dir', children: [] },
          { name: 'tests', type: 'dir', children: [
            { name: '__init__.py', type: 'file' }
          ]},
          { name: 'configs', type: 'dir', children: [
            { name: 'config.yaml', type: 'file' }
          ]},
          { name: 'experiments', type: 'dir', children: [] }
        ],
        roadmap: [
          { id: 'cv-1', title: 'Настройка окружения', description: 'Установка PyTorch, CUDA, OpenCV', done: false },
          { id: 'cv-2', title: 'Загрузка данных', description: 'Загрузка изображений, аннотаций', done: false },
          { id: 'cv-3', title: 'Аугментация', description: 'Повороты, обрезки, нормализация, Albumentations', done: false },
          { id: 'cv-4', title: 'Выбор архитектуры', description: 'ResNet, YOLO, U-Net, ViT', done: false },
          { id: 'cv-5', title: 'Обучение', description: 'Train loop, LR scheduler, checkpointing', done: false },
          { id: 'cv-6', title: 'Оценка', description: 'mAP, IoU, Precision/Recall, F1', done: false },
          { id: 'cv-7', title: 'Экспорт', description: 'TorchScript, ONNX, TensorRT', done: false },
          { id: 'cv-8', title: 'Развёртывание', description: 'API, Docker, edge devices', done: false }
        ]
      });

      // ---- 5. Kaggle ----
      this._templates.push({
        id: 'kaggle',
        name: 'Kaggle Competition',
        icon: 'fa-trophy',
        level: 'intermediate',
        iconText: 'KG',
        color: '#F44336',
        description: 'Структура для участия в соревнованиях Kaggle',
        category: 'Соревнования',
        libraries: [
          lib('pandas', 'Обработка табличных данных', 'core', true, true, true),
          lib('numpy', 'Численные вычисления', 'core', true, true, true),
          lib('scikit-learn', 'Классические ML алгоритмы', 'ml', true, true, true),
          lib('xgboost', 'XGBoost', 'ml', true, true, false),
          lib('lightgbm', 'LightGBM', 'ml', true, true, false),
          lib('matplotlib', 'Визуализация', 'viz', true, true, false),
          lib('seaborn', 'Статистическая визуализация', 'viz', true, true, false),
          lib('optuna', 'Гиперпараметрическая оптимизация', 'ml', true, false, false),
          lib('catboost', 'CatBoost', 'ml', true, false, false),
          lib('shap', 'SHAP для объяснения', 'ml', true, false, false)
        ],
        presets: ['Табличные данные', 'NLP', 'Изображения'],
        structure: [
          { name: 'data', type: 'dir', children: [
            { name: 'raw', type: 'dir', children: [] },
            { name: 'processed', type: 'dir', children: [] }
          ]},
          { name: 'notebooks', type: 'dir', children: [
            { name: '01-eda.ipynb', type: 'file' },
            { name: '02-features.ipynb', type: 'file' },
            { name: '03-model.ipynb', type: 'file' }
          ]},
          { name: 'src', type: 'dir', children: [
            { name: '__init__.py', type: 'file' },
            { name: 'features.py', type: 'file' },
            { name: 'models.py', type: 'file' },
            { name: 'ensemble.py', type: 'file' }
          ]},
          { name: 'submissions', type: 'dir', children: [] },
          { name: 'tests', type: 'dir', children: [
            { name: '__init__.py', type: 'file' }
          ]},
          { name: 'configs', type: 'dir', children: [
            { name: 'params.yaml', type: 'file' }
          ]}
        ],
        roadmap: [
          { id: 'kg-1', title: 'Понять задачу', description: 'Изучить описание, метрику, данные', done: false },
          { id: 'kg-2', title: 'Разведочный анализ', description: 'Визуализация, статистики, пропуски', done: false },
          { id: 'kg-3', title: 'Инжиниринг признаков', description: 'Создание новых признаков, кодирование', done: false },
          { id: 'kg-4', title: 'Моделирование', description: 'Базовые модели, ансамбли, бустинг', done: false },
          { id: 'kg-5', title: 'Ансамблирование', description: 'Blending, stacking, voting', done: false },
          { id: 'kg-6', title: 'Отправка', description: 'Формирование сабмишна, анализ лидерборда', done: false }
        ]
      });

      // ---- 6. AI Agents ----
      this._templates.push({
        id: 'ai-agents',
        name: 'AI Agents',
        icon: 'fa-brain',
        level: 'advanced',
        iconText: 'AG',
        color: '#607D8B',
        description: 'Разработка AI-агентов: инструменты, оркестрация, мониторинг',
        category: 'AI/ML',
        libraries: [
          lib('google-adk', 'Agent Development Kit от Google', 'agents', true, true, false),
          lib('langchain', 'Фреймворк для LLM-приложений', 'agents', true, true, false),
          lib('openai', 'OpenAI API клиент', 'llm', true, true, false),
          lib('pandas', 'Обработка данных', 'core', true, true, false),
          lib('numpy', 'Численные вычисления', 'core', true, true, false),
          lib('pydantic', 'Валидация данных и типов', 'core', true, true, true),
          lib('httpx', 'HTTP-клиент', 'net', true, false, false),
          lib('python-dotenv', 'Загрузка .env', 'tools', true, true, false),
          lib('tenacity', 'Повторные попытки (retries)', 'tools', true, false, false),
          lib('loguru', 'Логирование', 'tools', true, false, false)
        ],
        presets: ['Чат-бот', 'Инструменты', 'Мультиагент'],
        structure: [
          { name: 'agents', type: 'dir', children: [
            { name: '__init__.py', type: 'file' },
            { name: 'base_agent.py', type: 'file' },
            { name: 'tools', type: 'dir', children: [
              { name: '__init__.py', type: 'file' },
              { name: 'web_search.py', type: 'file' },
              { name: 'calculator.py', type: 'file' }
            ]}
          ]},
          { name: 'tools', type: 'dir', children: [
            { name: '__init__.py', type: 'file' }
          ]},
          { name: 'data', type: 'dir', children: [] },
          { name: 'configs', type: 'dir', children: [
            { name: 'config.yaml', type: 'file' },
            { name: 'agents.yaml', type: 'file' }
          ]},
          { name: 'tests', type: 'dir', children: [
            { name: '__init__.py', type: 'file' },
            { name: 'test_agent.py', type: 'file' }
          ]},
          { name: 'docs', type: 'dir', children: [
            { name: 'architecture.md', type: 'file' }
          ]}
        ],
        roadmap: [
          { id: 'ag-1', title: 'Проектирование агента', description: 'Определение цели, инструментов, архитектуры', done: false },
          { id: 'ag-2', title: 'Определение инструментов', description: 'Создание функций и инструментов агента', done: false },
          { id: 'ag-3', title: 'Реализация', description: 'Кодирование логики агента', done: false },
          { id: 'ag-4', title: 'Тестирование', description: 'Модульные и интеграционные тесты', done: false },
          { id: 'ag-5', title: 'Развёртывание', description: 'Деплой агента на сервер', done: false },
          { id: 'ag-6', title: 'Мониторинг', description: 'Логирование, трассировка, метрики', done: false }
        ]
      });

      // ---- 7. Dashboard ----
      this._templates.push({
        id: 'dashboard',
        name: 'Dashboard',
        icon: 'fa-chart-pie',
        level: 'beginner',
        iconText: 'DB',
        color: '#00BCD4',
        description: 'Веб-дашборды на Streamlit и Plotly',
        category: 'Визуализация',
        libraries: [
          lib('streamlit', 'Фреймворк для дашбордов', 'viz', true, true, true),
          lib('pandas', 'Обработка данных', 'core', true, true, false),
          lib('numpy', 'Численные вычисления', 'core', true, true, false),
          lib('plotly', 'Интерактивные графики', 'viz', true, true, false),
          lib('matplotlib', 'Статические графики', 'viz', true, false, false),
          lib('altair', 'Декларативная визуализация', 'viz', true, false, false),
          lib('python-dotenv', 'Загрузка .env', 'tools', true, false, false)
        ],
        presets: ['Analytics', 'Real-time', 'Multi-page'],
        structure: [
          { name: 'app', type: 'dir', children: [
            { name: '__init__.py', type: 'file' },
            { name: 'main.py', type: 'file' },
            { name: 'pages', type: 'dir', children: [
              { name: '__init__.py', type: 'file' },
              { name: 'overview.py', type: 'file' },
              { name: 'details.py', type: 'file' }
            ]},
            { name: 'components', type: 'dir', children: [
              { name: '__init__.py', type: 'file' },
              { name: 'charts.py', type: 'file' },
              { name: 'filters.py', type: 'file' }
            ]}
          ]},
          { name: 'data', type: 'dir', children: [] },
          { name: 'assets', type: 'dir', children: [
            { name: 'style.css', type: 'file' }
          ]},
          { name: 'configs', type: 'dir', children: [
            { name: 'config.yaml', type: 'file' }
          ]},
          { name: 'tests', type: 'dir', children: [
            { name: '__init__.py', type: 'file' }
          ]}
        ],
        roadmap: [
          { id: 'db-1', title: 'Настройка окружения', description: 'Установка Streamlit и библиотек', done: false },
          { id: 'db-2', title: 'Загрузка данных', description: 'Подключение к источнику данных', done: false },
          { id: 'db-3', title: 'Разметка страниц', description: 'Структура дашборда, layout', done: false },
          { id: 'db-4', title: 'Визуализация', description: 'Графики, таблицы, фильтры', done: false },
          { id: 'db-5', title: 'Интерактивность', description: 'Виджеты, обновление, callback', done: false },
          { id: 'db-6', title: 'Развёртывание', description: 'Streamlit Cloud, Docker, Sharing', done: false }
        ]
      });

      // ---- 8. FastAPI Service ----
      this._templates.push({
        id: 'fastapi',
        name: 'FastAPI Service',
        icon: 'fa-server',
        level: 'intermediate',
        iconText: 'FA',
        color: '#795548',
        description: 'REST API сервис на FastAPI для ML моделей',
        category: 'Бэкенд',
        libraries: [
          lib('fastapi', 'Современный веб-фреймворк', 'web', true, true, true),
          lib('uvicorn', 'ASGI-сервер', 'web', true, true, true),
          lib('pydantic', 'Валидация данных', 'core', true, true, false),
          lib('pandas', 'Обработка данных', 'core', true, true, false),
          lib('numpy', 'Численные вычисления', 'core', true, true, false),
          lib('scikit-learn', 'ML модели', 'ml', true, false, false),
          lib('python-multipart', 'Загрузка файлов', 'web', true, false, false),
          lib('httpx', 'HTTP-клиент', 'net', true, false, false),
          lib('pytest', 'Тестирование', 'tools', true, true, false)
        ],
        presets: ['ML API', 'CRUD', 'Микросервис'],
        structure: [
          { name: 'app', type: 'dir', children: [
            { name: '__init__.py', type: 'file' },
            { name: 'main.py', type: 'file' },
            { name: 'api', type: 'dir', children: [
              { name: '__init__.py', type: 'file' },
              { name: 'routes.py', type: 'file' },
              { name: 'dependencies.py', type: 'file' }
            ]},
            { name: 'core', type: 'dir', children: [
              { name: '__init__.py', type: 'file' },
              { name: 'config.py', type: 'file' }
            ]}
          ]},
          { name: 'models', type: 'dir', children: [
            { name: '__init__.py', type: 'file' },
            { name: 'ml_model.py', type: 'file' }
          ]},
          { name: 'schemas', type: 'dir', children: [
            { name: '__init__.py', type: 'file' },
            { name: 'requests.py', type: 'file' },
            { name: 'responses.py', type: 'file' }
          ]},
          { name: 'services', type: 'dir', children: [
            { name: '__init__.py', type: 'file' },
            { name: 'prediction.py', type: 'file' }
          ]},
          { name: 'tests', type: 'dir', children: [
            { name: '__init__.py', type: 'file' },
            { name: 'test_api.py', type: 'file' }
          ]},
          { name: 'configs', type: 'dir', children: [
            { name: 'config.yaml', type: 'file' }
          ]},
          { name: 'docker', type: 'dir', children: [
            { name: 'Dockerfile', type: 'file' },
            { name: 'docker-compose.yml', type: 'file' }
          ]}
        ],
        roadmap: [
          { id: 'fa-1', title: 'Настройка', description: 'FastAPI + uvicorn', done: false },
          { id: 'fa-2', title: 'Модели', description: 'Pydantic схемы данных', done: false },
          { id: 'fa-3', title: 'Схемы', description: 'Request/Response модели', done: false },
          { id: 'fa-4', title: 'Маршруты', description: 'REST endpoints', done: false },
          { id: 'fa-5', title: 'Сервисы', description: 'Бизнес-логика, ML prediction', done: false },
          { id: 'fa-6', title: 'Тесты', description: 'pytest, coverage', done: false },
          { id: 'fa-7', title: 'Docker', description: 'Контейнеризация', done: false },
          { id: 'fa-8', title: 'Развёртывание', description: 'Cloud Run, K8s', done: false }
        ]
      });

      // ---- 9. Time Series ----
      this._templates.push({
        id: 'time-series',
        name: 'Time Series',
        icon: 'fa-chart-line',
        level: 'intermediate',
        iconText: 'TS',
        color: '#3F51B5',
        description: 'Анализ временных рядов: прогнозирование, декомпозиция',
        category: 'Анализ данных',
        libraries: [
          lib('pandas', 'Обработка временных рядов', 'core', true, true, true),
          lib('numpy', 'Численные вычисления', 'core', true, true, true),
          lib('statsmodels', 'Статистические модели, ARIMA', 'ts', true, true, true),
          lib('prophet', 'Прогнозирование от Meta', 'ts', true, true, false),
          lib('scikit-learn', 'Вспомогательные ML', 'ml', true, false, false),
          lib('matplotlib', 'Визуализация', 'viz', true, true, false),
          lib('seaborn', 'Статистическая визуализация', 'viz', true, false, false),
          lib('pmdarima', 'Auto-ARIMA', 'ts', true, false, false),
          lib('tbats', 'TBATS модели', 'ts', false, false, false)
        ],
        presets: ['Классический', 'Гибридный', 'Глубокое обучение'],
        structure: [
          { name: 'data', type: 'dir', children: [
            { name: 'raw', type: 'dir', children: [] },
            { name: 'processed', type: 'dir', children: [] }
          ]},
          { name: 'notebooks', type: 'dir', children: [] },
          { name: 'src', type: 'dir', children: [
            { name: '__init__.py', type: 'file' },
            { name: 'decomposition.py', type: 'file' },
            { name: 'models.py', type: 'file' },
            { name: 'evaluation.py', type: 'file' },
            { name: 'forecast.py', type: 'file' }
          ]},
          { name: 'models', type: 'dir', children: [] },
          { name: 'tests', type: 'dir', children: [
            { name: '__init__.py', type: 'file' },
            { name: 'test_models.py', type: 'file' }
          ]},
          { name: 'configs', type: 'dir', children: [
            { name: 'config.yaml', type: 'file' }
          ]}
        ],
        roadmap: [
          { id: 'ts-1', title: 'Настройка', description: 'Установка библиотек', done: false },
          { id: 'ts-2', title: 'Подготовка данных', description: 'Ресемплинг, стационарность', done: false },
          { id: 'ts-3', title: 'Декомпозиция', description: 'Тренд, сезонность, остатки', done: false },
          { id: 'ts-4', title: 'Моделирование', description: 'ARIMA, Prophet, TBATS', done: false },
          { id: 'ts-5', title: 'Оценка', description: 'MAE, RMSE, MAPE, MASE', done: false },
          { id: 'ts-6', title: 'Прогноз', description: 'Forecast, интервалы уверенности', done: false }
        ]
      });

      // ---- 10. Recommendation System ----
      this._templates.push({
        id: 'recommendation',
        name: 'Recommendation System',
        icon: 'fa-star',
        level: 'advanced',
        iconText: 'RS',
        color: '#E91E63',
        description: 'Рекомендательные системы: коллаборативная и контентная фильтрация',
        category: 'Машинное обучение',
        libraries: [
          lib('pandas', 'Обработка данных', 'core', true, true, true),
          lib('numpy', 'Численные вычисления', 'core', true, true, true),
          lib('scikit-learn', 'ML алгоритмы', 'ml', true, true, false),
          lib('scipy', 'Разреженные матрицы', 'core', true, true, false),
          lib('implicit', 'Альтернативная минимизация', 'recsys', true, true, false),
          lib('surprise', 'Классические рекомендации', 'recsys', true, false, false),
          lib('lightfm', 'Гибридные рекомендации', 'recsys', true, false, false),
          lib('tensorflow', 'Глубокие рекомендации (Two-Tower)', 'dl', true, true, false)
        ],
        presets: ['Collaborative', 'Content-based', 'Hybrid'],
        structure: [
          { name: 'data', type: 'dir', children: [
            { name: 'raw', type: 'dir', children: [] },
            { name: 'processed', type: 'dir', children: [] }
          ]},
          { name: 'notebooks', type: 'dir', children: [] },
          { name: 'src', type: 'dir', children: [
            { name: '__init__.py', type: 'file' },
            { name: 'data_prep.py', type: 'file' },
            { name: 'collaborative.py', type: 'file' },
            { name: 'content_based.py', type: 'file' },
            { name: 'hybrid.py', type: 'file' },
            { name: 'evaluation.py', type: 'file' }
          ]},
          { name: 'models', type: 'dir', children: [] },
          { name: 'tests', type: 'dir', children: [
            { name: '__init__.py', type: 'file' },
            { name: 'test_recs.py', type: 'file' }
          ]},
          { name: 'configs', type: 'dir', children: [
            { name: 'config.yaml', type: 'file' }
          ]}
        ],
        roadmap: [
          { id: 'rs-1', title: 'Настройка', description: 'Установка библиотек', done: false },
          { id: 'rs-2', title: 'Подготовка данных', description: 'Сбор и обработка взаимодействий пользователей', done: false },
          { id: 'rs-3', title: 'EDA', description: 'Анализ распределений, популярность', done: false },
          { id: 'rs-4', title: 'Коллаборативная фильтрация', description: 'User-based / Item-based / Matrix Factorization', done: false },
          { id: 'rs-5', title: 'Контентная фильтрация', description: 'Признаки товаров, TF-IDF, эмбеддинги', done: false },
          { id: 'rs-6', title: 'Гибридный подход', description: 'Комбинация методов, LightFM', done: false },
          { id: 'rs-7', title: 'Оценка', description: 'Precision@K, Recall@K, NDCG, MAP', done: false },
          { id: 'rs-8', title: 'Развёртывание', description: 'API рекомендаций, A/B тесты', done: false }
        ]
      });
    }
  };
})();

/* ==========================================================================
   3. App.venvManager — Управление виртуальным окружением
   ========================================================================== */
(function () {
  if (!window.App) return;

  App.venvManager = {
    generateSetupCommands: function (project) {
      if (!project) return [];
      var cmds = [];
      var step = 1;
      var pkgList = project.libraries.length
        ? project.libraries.join(' ')
        : 'pandas numpy';

      if (project.useUv) {
        cmds.push({
          step: step++,
          cmd: 'uv init --python ' + project.pythonVersion,
          desc: 'Инициализация проекта через uv',
          type: 'uv'
        });
        cmds.push({
          step: step++,
          cmd: 'uv add ' + pkgList,
          desc: 'Установка зависимостей через uv',
          type: 'uv'
        });
        cmds.push({
          step: step++,
          cmd: 'uv sync',
          desc: 'Синхронизация окружения',
          type: 'uv'
        });
        cmds.push({
          step: step++,
          cmd: 'uv run python --version',
          desc: 'Проверка версии Python',
          type: 'uv'
        });
      } else {
        cmds.push({
          step: step++,
          cmd: 'python -m venv venv',
          desc: 'Создание виртуального окружения',
          type: 'venv'
        });
        cmds.push({
          step: step++,
          cmd: '.\\venv\\Scripts\\activate',
          desc: 'Активация окружения (Windows)',
          type: 'venv'
        });
        cmds.push({
          step: step++,
          cmd: 'pip install --upgrade pip',
          desc: 'Обновление pip',
          type: 'pip'
        });
        cmds.push({
          step: step++,
          cmd: 'pip install ' + pkgList,
          desc: 'Установка зависимостей',
          type: 'pip'
        });
        cmds.push({
          step: step++,
          cmd: 'pip freeze > requirements.txt',
          desc: 'Фиксация версий зависимостей',
          type: 'pip'
        });
      }

      cmds.push({
        step: step++,
        cmd: 'git init && git add . && git commit -m "Initial commit"',
        desc: 'Инициализация Git-репозитория',
        type: 'git'
      });

      return cmds;
    },

    generateEnvConfig: function (project) {
      if (!project) return '';
      var lines = [];
      lines.push('# Конфигурация окружения для ' + project.name);
      lines.push('# Создано AI Project Companion');
      lines.push('');
      lines.push('# Python');
      lines.push('PYTHON_VERSION=' + (project.pythonVersion || '3.12'));
      lines.push('');
      lines.push('# Проект');
      lines.push('PROJECT_NAME=' + project.name);
      lines.push('PROJECT_DESCRIPTION="' + (project.description || '') + '"');
      lines.push('');
      lines.push('# Пути');
      lines.push('DATA_DIR=data');
      lines.push('OUTPUT_DIR=outputs');
      lines.push('LOG_DIR=logs');
      lines.push('');
      lines.push('# Пакеты');
      lines.push('# INSTALLED_PACKAGES=' + project.libraries.join(','));
      lines.push('');
      if (project.useUv) {
        lines.push('# Используется uv для управления пакетами');
        lines.push('UV=true');
      }
      return lines.join('\n');
    },

    generatePipCommands: function (project) {
      if (!project) return [];
      var cmds = [];
      var step = 1;
      cmds.push({
        step: step++,
        cmd: 'python -m venv venv',
        desc: 'Создание виртуального окружения',
        type: 'venv'
      });
      cmds.push({
        step: step++,
        cmd: '.\\venv\\Scripts\\activate',
        desc: 'Активация на Windows',
        type: 'venv'
      });
      cmds.push({
        step: step++,
        cmd: 'source venv/bin/activate',
        desc: 'Активация на macOS/Linux',
        type: 'venv'
      });
      cmds.push({
        step: step++,
        cmd: 'pip install --upgrade pip setuptools wheel',
        desc: 'Обновление pip',
        type: 'pip'
      });
      cmds.push({
        step: step++,
        cmd: 'pip install -r requirements.txt',
        desc: 'Установка зависимостей',
        type: 'pip'
      });
      cmds.push({
        step: step++,
        cmd: 'pip install -e .',
        desc: 'Установка пакета в режиме разработки',
        type: 'pip'
      });
      cmds.push({
        step: step++,
        cmd: 'pre-commit install',
        desc: 'Установка pre-commit хуков',
        type: 'dev'
      });
      return cmds;
    },

    getPythonVersions: function () {
      return ['3.9', '3.10', '3.11', '3.12', '3.13'];
    }
  };
})();

/* ==========================================================================
   4. App.aiService — AI-рекомендации и знания
   ========================================================================== */
(function () {
  if (!window.App) return;

  // ---------------------------------------------------------------
  // База знаний
  // ---------------------------------------------------------------
  var KNOWLEDGE = {
    // ---- Библиотеки по задачам ----
    libraries: {
      'data-manipulation': {
        title: 'Обработка данных',
        items: [
          { name: 'pandas', description: 'Стандарт для табличных данных. DataFrame, groupby, merge, pivot.', when: 'всегда' },
          { name: 'polars', description: 'Быстрая альтернатива pandas на Rust. Для больших данных.', when: 'когда pandas медленный' },
          { name: 'dask', description: 'Параллельные вычисления на кластере. Out-of-core.', when: 'данные не влезают в память' },
          { name: 'vaex', description: 'Ленивые вычисления для огромных датасетов.', when: 'миллиарды строк' }
        ]
      },
      'visualization': {
        title: 'Визуализация',
        items: [
          { name: 'matplotlib', description: 'Базовый уровень. Все остальное строится на нём.', when: 'всегда' },
          { name: 'seaborn', description: 'Красивые статистические графики в 1 строку.', when: 'EDA и отчёты' },
          { name: 'plotly', description: 'Интерактивные графики для веба.', when: 'дашборды и презентации' },
          { name: 'altair', description: 'Декларативная визуализация на Vega-Lite.', when: 'чистый код и интерактивность' },
          { name: 'bokeh', description: 'Интерактивные дашборды с серверным бэкендом.', when: 'сложные дашборды' }
        ]
      },
      'ml': {
        title: 'Машинное обучение',
        items: [
          { name: 'scikit-learn', description: 'Все классические алгоритмы. Единый API.', when: 'всегда для классики' },
          { name: 'xgboost', description: 'Градиентный бустинг. Побеждает в соревнованиях.', when: 'табличные данные' },
          { name: 'lightgbm', description: 'Ещё быстрее XGBoost. Работает с категориями.', when: 'большие данные' },
          { name: 'catboost', description: 'Бустинг с автоматической работой с категориями.', when: 'много категориальных признаков' },
          { name: 'optuna', description: 'Гиперпараметрическая оптимизация. Define-by-run.', when: 'всегда для тюнинга' }
        ]
      },
      'deep-learning': {
        title: 'Глубокое обучение',
        items: [
          { name: 'torch', description: 'PyTorch. Гибкий, динамический граф. Индустриальный стандарт.', when: 'исследования и продакшн' },
          { name: 'tensorflow', description: 'Keras API. Статический граф. TFLite для мобильных.', when: 'продакшн и мобильные' },
          { name: 'jax', description: 'Автодифференцирование, XLA, TPU.', when: 'хай-производительность' },
          { name: 'transformers', description: 'Hugging Face. BERT, GPT, T5, Whisper.', when: 'NLP и мультимодальные' }
        ]
      },
      'nlp': {
        title: 'NLP',
        items: [
          { name: 'transformers', description: 'Все современные модели. Fine-tuning.', when: 'трансформеры' },
          { name: 'spacy', description: 'Пайплайны: NER, POS, dependency parsing.', when: 'продакшн NLP' },
          { name: 'nltk', description: 'Классические инструменты: токены, стеммеры.', when: 'обучение и прототипы' },
          { name: 'sentence-transformers', description: 'Эмбеддинги предложений. Семантический поиск.', when: 'смысловая близость' },
          { name: 'langchain', description: 'Цепочки LLM, RAG, агенты.', when: 'LLM приложения' }
        ]
      },
      'timeseries': {
        title: 'Временные ряды',
        items: [
          { name: 'statsmodels', description: 'ARIMA, SARIMA, VAR, ETS.', when: 'классические модели' },
          { name: 'prophet', description: 'От Meta. Автоматический учёт праздников.', when: 'бизнес-прогнозы' },
          { name: 'pmdarima', description: 'Auto-ARIMA. Подбор параметров.', when: 'автоматизация' },
          { name: 'sktime', description: 'API как у sklearn, но для рядов.', when: 'единый интерфейс' },
          { name: 'nixtla', description: 'TimeGPT и ML-forecast.', when: 'современные методы' }
        ]
      },
      'mlops': {
        title: 'MLOps',
        items: [
          { name: 'mlflow', description: 'Трекинг экспериментов, модели, registry.', when: 'всегда' },
          { name: 'wandb', description: 'Weights & Biases. Визуализация экспериментов.', when: 'команды и отчёты' },
          { name: 'dvc', description: 'Версионирование данных и пайплайнов.', when: 'воспроизводимость' },
          { name: 'docker', description: 'Контейнеризация окружения.', when: 'развёртывание' },
          { name: 'kubeflow', description: 'ML-пайплайны на Kubernetes.', when: 'продакшн MLOps' }
        ]
      }
    },

    // ---- Пути обучения ----
    learningPaths: {
      'beginner-ds': {
        title: 'Путь начинающего Data Scientist',
        steps: [
          'Изучите Python: основы, циклы, функции, ООП',
          'Освойте pandas: DataFrame, группировки, merge',
          'matplotlib + seaborn для визуализации',
          'scikit-learn: линейные модели, деревья, метрики',
          'Попробуйте Kaggle: Titanic, House Prices',
          'Git и GitHub для контроля версий',
          'SQL для работы с базами данных',
          'Постройте свой первый энд-ту-энд проект'
        ]
      },
      'ml-engineer': {
        title: 'Путь ML-инженера',
        steps: [
          'Уверенный Python + ООП + патерны',
          'scikit-learn + XGBoost/LightGBM',
          'PyTorch или TensorFlow для глубокого',
          'Feature Engineering и Selection',
          'MLflow для экспериментов',
          'DVC для данных',
          'FastAPI для развёртывания моделей',
          'Docker + CI/CD',
          'Мониторинг моделей в продакшне'
        ]
      },
      'nlp-specialist': {
        title: 'Путь NLP-специалиста',
        steps: [
          'Python + библиотеки NLP: NLTK, spaCy',
          'Регулярные выражения, токенизация',
          'Word2Vec, GloVe, FastText эмбеддинги',
          'Трансформеры: BERT, RoBERTa, GPT',
          'Hugging Face transformers + datasets',
          'Fine-tuning для своих задач',
          'RAG: ретривер + генератор',
          'Prompt engineering и LLM evaluation'
        ]
      }
    },

    // ---- Частые ошибки начинающих ----
    commonPitfalls: [
      {
        title: 'Нет виртуального окружения',
        desc: 'Устанавливают библиотеки глобально → конфликты версий. Всегда используйте venv или uv.'
      },
      {
        title: 'Игнорирование .gitignore',
        desc: 'Коммитят venv, __pycache__, .env в Git. Добавьте их в .gitignore.'
      },
      {
        title: 'Смешивание train и test',
        desc: 'Утечка данных: нормализация до split, использование target при создании признаков.'
      },
      {
        title: 'Нет воспроизводимости',
        desc: 'Не фиксируют версии библиотек. Используйте requirements.txt или pyproject.toml с exact versions.'
      },
      {
        title: 'Переобучение',
        desc: 'Сложная модель на маленьких данных. Начните с baseline (линейная модель).'
      },
      {
        title: 'Секреты в коде',
        desc: 'API-ключи и пароли в открытом виде. Используйте .env и python-dotenv.'
      },
      {
        title: 'Нет тестов',
        desc: 'Код без тестов — это не продакшн-код. Тестируйте функции подготовки данных.'
      },
      {
        title: 'Слишком сложный старт',
        desc: 'Хотят сразу нейросети. Начните с простых моделей и постепенно усложняйте.'
      }
    ],

    // ---- Лучшие практики ----
    bestPractices: {
      projectStructure: [
        'Отделяйте сырые и обработанные данные (data/raw, data/processed)',
        'Храните ноутбуки в notebooks/ с номерами: 01-eda.ipynb',
        'Исходный код в src/ с модульной структурой',
        'Конфиги в configs/ в YAML формате',
        'Тесты в tests/ зеркалят src/'
      ],
      testing: [
        'pytest — основной инструмент тестирования',
        'Тестируйте функции подготовки данных отдельно',
        'Используйте фикстуры для тестовых данных',
        'Проверяйте консистентность данных (schema validation)',
        'Для ML: тесты на качество модели (model validation tests)'
      ],
      deployment: [
        'FastAPI — лучший выбор для ML API',
        'Docker для контейнеризации',
        'Cloud Run или ECS для дешёвого старта',
        'Мониторинг: Prometheus + Grafana',
        'A/B тестирование и shadow deployment'
      ],
      dataVersioning: [
        'DVC — Git для данных. Хранит метаданные в Git, данные в S3/GCS',
        'lakeFS — ветвление данных как в Git',
        'Quilt — версионирование датасетов',
        'Hugging Face Datasets — для NLP'
      ],
      experimentTracking: [
        'MLflow: логирование параметров, метрик, артефактов',
        'Weights & Biases: красивые дашборды, команды',
        'Neptune.ai: метаданные и версионирование',
        'TensorBoard: визуализация обучения глубоких моделей'
      ]
    },

    // ---- Инструменты ----
    tools: {
      code: ['VS Code', 'PyCharm', 'Jupyter Lab', 'Cursor'],
      orc: ['Airflow', 'Prefect', 'Dagster', 'Temporal'],
      featureStore: ['Feast', 'Tecton', 'Hopsworks'],
      monitoring: ['Evidently AI', 'WhyLabs', 'Arize AI', 'Seldon'],
      llm: ['LangChain', 'LlamaIndex', 'Google ADK', 'AutoGen']
    }
  };

  // ---------------------------------------------------------------
  // Сервис AI
  // ---------------------------------------------------------------
  App.aiService = {
    _knowledge: KNOWLEDGE,

    getRecommendation: function (context) {
      context = context || {};
      var step = context.step || 'start';
      var pType = context.projectType || 'data-analysis';
      var doneSteps = context.completedSteps || [];
      var libs = context.currentLibraries || [];

      var result = {
        action: '',
        reason: '',
        libraries: [],
        tools: [],
        nextSteps: []
      };

      if (step === 'start' || step === 'setup') {
        result.action = 'Настройте виртуальное окружение';
        result.reason = 'Изолированная среда предотвращает конфликты зависимостей';
        result.libraries = ['pandas', 'numpy', 'matplotlib'];
        result.tools = ['VS Code', 'Git'];
        result.nextSteps = [
          'Создайте виртуальное окружение (venv или uv)',
          'Установите базовые библиотеки',
          'Инициализируйте Git-репозиторий'
        ];
      } else if (step === 'data') {
        result.action = 'Загрузите и исследуйте данные';
        result.reason = 'Понимание данных — ключ к успешному проекту';
        result.libraries = ['pandas', 'pandas-profiling', 'ydata-profiling'];
        result.tools = ['Jupyter Notebook'];
        result.nextSteps = [
          'Загрузите данные в DataFrame',
          'Проверьте типы данных и пропуски',
          'Постройте распределения признаков'
        ];
      } else if (step === 'eda') {
        result.action = 'Проведите разведочный анализ';
        result.reason = 'Визуализация помогает найти паттерны и аномалии';
        result.libraries = ['matplotlib', 'seaborn', 'plotly'];
        result.tools = ['Jupyter Notebook'];
        result.nextSteps = [
          'Постройте корреляционную матрицу',
          'Визуализируйте распределения',
          'Найдите выбросы и аномалии'
        ];
      } else if (step === 'features') {
        result.action = 'Создайте новые признаки';
        result.reason = 'Хорошие признаки важнее сложной модели';
        result.libraries = ['scikit-learn', 'feature-engine'];
        result.tools = ['Optuna'];
        result.nextSteps = [
          'Создайте полиномиальные признаки',
          'Закодируйте категориальные переменные',
          'Отберите наиболее важные признаки'
        ];
      } else if (step === 'model') {
        result.action = 'Обучите baseline модель';
        result.reason = 'Простая модель задаёт нижнюю планку качества';
        result.libraries = ['scikit-learn', 'xgboost', 'lightgbm'];
        result.tools = ['MLflow', 'Optuna'];
        result.nextSteps = [
          'Разделите данные на train/test',
          'Обучите линейную модель как baseline',
          'Попробуйте бустинг (XGBoost/LightGBM)'
        ];
      } else if (step === 'deploy') {
        result.action = 'Разверните модель';
        result.reason = 'Модель приносит пользу только в эксплуатации';
        result.libraries = ['fastapi', 'uvicorn', 'pydantic'];
        result.tools = ['Docker', 'Cloud Run'];
        result.nextSteps = [
          'Создайте FastAPI приложение',
          'Оберните в Docker',
          'Задеплойте на Cloud Run или Railway'
        ];
      } else {
        result.action = 'Следующий шаг в roadmap';
        result.reason = 'Придерживайтесь плана проекта';
        result.nextSteps = ['Проверьте roadmap проекта', 'Выберите следующий невыполненный шаг'];
      }

      return result;
    },

    getLibraryRecommendation: function (pType) {
      pType = pType || 'data-analysis';
      var recs = {
        'data-analysis': {
          core: [
            { name: 'pandas', reason: 'Основа для работы с табличными данными' },
            { name: 'numpy', reason: 'Численные вычисления и массивы' }
          ],
          viz: [
            { name: 'matplotlib', reason: 'Базовые графики' },
            { name: 'seaborn', reason: 'Красивые стат. графики' }
          ],
          extras: []
        },
        'machine-learning': {
          core: [
            { name: 'scikit-learn', reason: 'Все классические алгоритмы' },
            { name: 'xgboost', reason: 'Градиентный бустинг для высоких результатов' }
          ],
          viz: [
            { name: 'matplotlib', reason: 'Графики обучения' },
            { name: 'shap', reason: 'Объяснение предсказаний' }
          ],
          extras: [
            { name: 'mlflow', reason: 'Трекинг экспериментов обязателен' },
            { name: 'optuna', reason: 'Подбор гиперпараметров' }
          ]
        },
        'nlp': {
          core: [
            { name: 'transformers', reason: 'Все современные модели NLP' },
            { name: 'torch', reason: 'Основной DL фреймворк' }
          ],
          viz: [
            { name: 'matplotlib', reason: 'Визуализация метрик' }
          ],
          extras: [
            { name: 'spacy', reason: 'Пайплайны для продакшна' },
            { name: 'datasets', reason: 'Датасеты Hugging Face' }
          ]
        },
        'computer-vision': {
          core: [
            { name: 'torch', reason: 'PyTorch — стандарт CV' },
            { name: 'torchvision', reason: 'Модели и трансформации' }
          ],
          viz: [
            { name: 'matplotlib', reason: 'Показ изображений' }
          ],
          extras: [
            { name: 'opencv-python', reason: 'Обработка изображений' },
            { name: 'albumentations', reason: 'Аугментация' }
          ]
        },
        'kaggle': {
          core: [
            { name: 'pandas', reason: 'Обработка данных' },
            { name: 'xgboost', reason: 'Бустинг — король Kaggle' }
          ],
          viz: [
            { name: 'seaborn', reason: 'EDA графики' }
          ],
          extras: [
            { name: 'optuna', reason: 'Тюнинг гиперпараметров' },
            { name: 'lightgbm', reason: 'Второй бустинг для ансамбля' }
          ]
        },
        'ai-agents': {
          core: [
            { name: 'google-adk', reason: 'Google Agent Development Kit' },
            { name: 'langchain', reason: 'Фреймворк для LLM' }
          ],
          extras: [
            { name: 'pydantic', reason: 'Валидация данных' },
            { name: 'openai', reason: 'API для LLM' }
          ],
          viz: []
        },
        'dashboard': {
          core: [
            { name: 'streamlit', reason: 'Быстрые дашборды' },
            { name: 'plotly', reason: 'Интерактивные графики' }
          ],
          extras: [
            { name: 'altair', reason: 'Чистые декларативные графики' }
          ],
          viz: []
        },
        'fastapi': {
          core: [
            { name: 'fastapi', reason: 'Современный веб-фреймворк' },
            { name: 'uvicorn', reason: 'ASGI сервер' }
          ],
          extras: [
            { name: 'pydantic', reason: 'Схемы данных' },
            { name: 'pytest', reason: 'Тестирование API' }
          ],
          viz: []
        },
        'time-series': {
          core: [
            { name: 'statsmodels', reason: 'ARIMA и декомпозиция' },
            { name: 'prophet', reason: 'Прогнозы с учётом праздников' }
          ],
          viz: [
            { name: 'matplotlib', reason: 'Графики ряда' }
          ],
          extras: []
        },
        'recommendation': {
          core: [
            { name: 'scikit-learn', reason: 'Baseline модели' },
            { name: 'implicit', reason: 'Альтернативная минимизация' }
          ],
          extras: [
            { name: 'lightfm', reason: 'Гибридные рекомендации' },
            { name: 'surprise', reason: 'Классические алгоритмы' }
          ],
          viz: []
        }
      };

      return recs[pType] || recs['data-analysis'];
    },

    getArchitectureReview: function (project) {
      if (!project) return null;
      var weaknesses = [];
      var strengths = [];
      var suggestions = [];

      if (project.libraries && project.libraries.length > 0) {
        strengths.push('Проект имеет явный список зависимостей');
      } else {
        weaknesses.push('Не указаны библиотеки — добавьте зависимости');
        suggestions.push('Определитесь с библиотеками через templateManager');
      }

      if (project.roadmap && project.roadmap.length > 0) {
        strengths.push('Есть roadmap — отличное планирование');
      } else {
        weaknesses.push('Нет roadmap — проект может потерять фокус');
      }

      if (project.structure && project.structure.length > 0) {
        strengths.push('Продуманная структура директорий');
      } else {
        weaknesses.push('Нет структуры проекта');
        suggestions.push('Сгенерируйте структуру через шаблон');
      }

      if (project.description) {
        strengths.push('Есть описание проекта');
      } else {
        weaknesses.push('Нет описания — добавьте хотя бы 1-2 предложения');
      }

      if (project.useUv) {
        strengths.push('Используете uv — современный менеджер пакетов');
      } else {
        strengths.push('Используете стандартный pip/venv');
      }

      if (project.pythonVersion) {
        strengths.push('Python ' + project.pythonVersion + ' — актуальная версия');
      }

      suggestions.push('Начните с генерации файлов проекта (README, .gitignore и т.д.)');
      suggestions.push('Инициализируйте Git-репозиторий');
      suggestions.push('Установите pre-commit для автоматической проверки кода');

      return {
        strengths: strengths,
        weaknesses: weaknesses,
        suggestions: suggestions.slice(0, 5),
        score: Math.round((strengths.length / (strengths.length + weaknesses.length + 1)) * 100)
      };
    },

    explainStep: function (step, pType) {
      pType = pType || 'data-analysis';
      var explanations = {
        'Настройка окружения': 'Изолированное окружение — основа воспроизводимости. Без него разные проекты будут конфликтовать версиями библиотек. uv работает в 10-100 раз быстрее pip.',
        'Загрузка данных': 'Данные могут быть в CSV, Excel, SQL, API. Убедитесь, что путь к данным не захардкожен — используйте конфиги.',
        'EDA': 'Разведочный анализ — это 70% успеха проекта. Вы должны понять распределения, пропуски, выбросы и взаимосвязи до того, как строить модели.',
        'Очистка данных': 'Реальные данные грязные: пропуски (NaN), дубликаты, выбросы, неконсистентные форматы. Очистка занимает до 80% времени аналитика.',
        'Инжиниринг признаков': 'Новые признаки из существующих часто важнее выбора модели. Например, из даты можно извлечь день недели, месяц, признак выходного дня.',
        'Обучение модели': 'Начните с простой модели (линейная регрессия, логистическая). Это даст baseline и выявит проблемы в данных.',
        'Валидация': 'k-fold cross-validation лучше чем одно разделение. Стратификация важна для несбалансированных классов.',
        'Развёртывание': 'FastAPI — самый простой способ задеплоить модель. Обязательно добавьте health-check и логирование.',
        'Мониторинг': 'Модели деградируют (data drift, concept drift). Используйте Evidently AI или WhyLabs для отслеживания качества.'
      };

      var defaultExp = 'Это важный этап в проекте. Следуйте инструкциям в roadmap и используйте рекомендуемые библиотеки.';

      for (var key in explanations) {
        if (step.indexOf(key) !== -1) {
          return explanations[key];
        }
      }

      return explanations[pType] || defaultExp;
    },

    getNextBestAction: function (project) {
      if (!project) return null;

      // Найти первый невыполненный шаг в roadmap
      var nextStep = null;
      for (var i = 0; i < project.roadmap.length; i++) {
        if (!project.roadmap[i].done) {
          nextStep = project.roadmap[i];
          break;
        }
      }

      var hasGeneratedFiles = project.generatedFiles && Object.keys(project.generatedFiles).length > 0;

      if (!hasGeneratedFiles) {
        return {
          action: 'Сгенерировать файлы проекта',
          description: 'README, requirements.txt, .gitignore и другие файлы',
          priority: 'high',
          category: 'setup'
        };
      }

      if (!nextStep) {
        return {
          action: 'Проект завершён!',
          description: 'Все шаги roadmap выполнены. Можно добавлять новые.',
          priority: 'low',
          category: 'completed'
        };
      }

      return {
        action: nextStep.title,
        description: nextStep.description,
        priority: 'high',
        category: 'roadmap',
        roadmapItem: nextStep
      };
    },

    analyzeProject: function (project) {
      if (!project) return null;

      var issues = [];
      var suggestions = [];
      var health = 'good';

      if (!project.name || project.name === 'Без имени') {
        issues.push({ severity: 'warning', text: 'Дайте проекту осмысленное имя' });
      }

      if (!project.description) {
        issues.push({ severity: 'info', text: 'Добавьте описание проекта' });
      }

      if (!project.libraries || project.libraries.length < 2) {
        issues.push({ severity: 'error', text: 'Слишком мало библиотек. Добавьте хотя бы pandas + numpy.' });
        health = 'bad';
      }

      if (project.envConfig && project.envConfig.packages && project.envConfig.packages.length === 0) {
        issues.push({ severity: 'warning', text: 'Не указаны пакеты в envConfig' });
      }

      if (project.status === 'planning' && project.roadmap.length > 0) {
        suggestions.push('Начните с первого шага roadmap: "' + project.roadmap[0].title + '"');
      }

      var completedCount = 0;
      for (var i = 0; i < project.roadmap.length; i++) {
        if (project.roadmap[i].done) completedCount++;
      }

      if (completedCount > 0 && completedCount === project.roadmap.length) {
        suggestions.push('Поздравляем! Все шаги roadmap выполнены!');
        health = 'excellent';
      } else if (completedCount === 0) {
        suggestions.push('Попробуйте отметить первый выполненный шаг в roadmap');
      }

      suggestions.push('Сгенерируйте файлы проекта через кнопку "Generate Files"');

      var archReview = this.getArchitectureReview(project);
      if (archReview) {
        for (var w = 0; w < archReview.weaknesses.length; w++) {
          issues.push({ severity: 'warning', text: archReview.weaknesses[w] });
        }
        for (var s = 0; s < archReview.suggestions.length; s++) {
          if (suggestions.indexOf(archReview.suggestions[s]) === -1) {
            suggestions.push(archReview.suggestions[s]);
          }
        }
      }

      return {
        health: health,
        issues: issues.slice(0, 8),
        suggestions: suggestions.slice(0, 5),
        completedSteps: completedCount,
        totalSteps: project.roadmap.length,
        progress: project.progress
      };
    },

    // ---------------------------------------------------------------
    // Ответы на вопросы пользователей
    // ---------------------------------------------------------------
    ask: function (question, context) {
      if (!question) return 'Задайте вопрос о Data Science, библиотеках или проектах!';
      var q = question.toLowerCase();

      context = context || {};
      var pType = context.projectType || '';

      // ---- Библиотеки ----
      if (/\b(как(ая|ую|ой)?|лучш(ая|ую|ий|ие)?|какие?)\s.*библиотек/.test(q) ||
          /\b(lib|package|библиотек|библиотек[ауи])\b/.test(q)) {
        if (/data\s*(science|analy|обработк|таблиц)/.test(q) || /\bpandas?\b/.test(q)) {
          return 'Лучшие библиотеки для анализа данных: pandas (таблицы), numpy (числа), matplotlib + seaborn (графики). Для больших данных — polars (быстрее pandas в 10-50x).';
        }
        if (/ml|машинн|машинист|обучен|scikit/.test(q)) {
          return 'Для ML: scikit-learn (классика), XGBoost/LightGBM (бустинг), Optuna (подбор параметров). Для нейросетей — PyTorch или TensorFlow.';
        }
        if (/nlp|text|текст|язык/.test(q)) {
          return 'Для NLP: transformers (Hugging Face), spaCy (продакшн), NLTK (обучение), sentence-transformers (эмбеддинги).';
        }
        if (/time.?serie|временн|прогноз/.test(q)) {
          return 'Для временных рядов: statsmodels (ARIMA), Prophet (Meta), pmdarima (Auto-ARIMA), sktime (единый API).';
        }
        if (/визуализаци|graph|chart|plot|график/.test(q)) {
          return 'Для визуализации: matplotlib (база), seaborn (красивые графики), plotly (интерактив), altair (декларативный).';
        }
        return 'Рекомендую начать с pandas, numpy, matplotlib. Для конкретной задачи уточните тип проекта.';
      }

      // ---- Как начать ----
      if (/как\s*(начать|стартовать|создать|сделать)/.test(q)) {
        if (/data.?science|ds|data\s*scien/.test(q)) {
          return 'Чтобы начать в Data Science: 1) Изучите Python 2) Освойте pandas 3) Пройдите курс по ML 4) Сделайте проект на Kaggle. Начните с Titanic — классический入门 проект.';
        }
        if (/ml|машинн/.test(q)) {
          return 'Начните с scikit-learn: линейная регрессия, деревья решений, random forest. Используйте Jupyter Notebook для экспериментов.';
        }
        if (/nlp|text/.test(q)) {
          return 'Начните с NLTK для базовых операций (токенизация, стемминг), затем переходите к transformers для современных моделей.';
        }
        if (/kaggle/.test(q)) {
          return 'Зарегистрируйтесь на Kaggle, начните с Titanic (классификация) или House Prices (регрессия). Изучите ноутбуки других участников.';
        }
        return 'Создайте новый проект в AI Project Companion, выберите шаблон и следуйте roadmap!';
      }

      // ---- Что делать после X ----
      if (/что\s*(делать|дальше|после)/.test(q) || /после\s/.test(q)) {
        if (/eda|анализ|разведочн/.test(q)) {
          return 'После EDA переходите к инжинирингу признаков: создавайте новые признаки, кодируйте категории, масштабируйте числа. Затем — моделирование.';
        }
        if (/очистк|clean/.test(q)) {
          return 'После очистки данных проведите EDA (разведочный анализ): постройте графики, найдите корреляции, проверьте распределения.';
        }
        if (/модел(и|ь)|train|обучен/.test(q)) {
          return 'После обучения модели: 1) Оцените на тестовых данных 2) Проанализируйте ошибки 3) Попробуйте улучшить (новые признаки, другой алгоритм, тюнинг). Не забудьте сохранить модель!';
        }
        if (/фич|feature|признак/.test(q)) {
          return 'После создания признаков: проверьте их важность (feature importance), удалите лишние (коррелирующие), масштабируйте и приступайте к моделированию.';
        }
        return 'Посмотрите roadmap проекта — там указаны следующие шаги.';
      }

      // ---- Понятия DS ----
      if (/что такое|что значит|определени|поняти/.test(q)) {
        if (/overfitt|переобуч/.test(q)) {
          return 'Переобучение (overfitting) — модель запоминает данные вместо обобщения. Признаки: высокая accuracy на train, низкая на test. Решение: регуляризация, больше данных, проще модель.';
        }
        if (/underfitt|недообуч/.test(q)) {
          return 'Недообучение (underfitting) — модель слишком простая и не улавливает закономерности. Признаки: низкая accuracy и на train, и на test. Решение: усложнить модель, добавить признаки.';
        }
        if (/bias.?variance|смещение.*диспер/.test(q)) {
          return 'Bias-Variance Tradeoff: bias (смещение) — ошибка из-за упрощений модели. Variance (дисперсия) — чувствительность к данным. Простые модели — высокий bias, низкая variance. Сложные — наоборот.';
        }
        if (/gradient.?boosting|градиентн.*бустинг/.test(q)) {
          return 'Градиентный бустинг — метод ансамблирования, где деревья добавляются последовательно, каждое исправляет ошибки предыдущего. XGBoost, LightGBM, CatBoost — популярные реализации.';
        }
        if (/трансформер|transformer/.test(q)) {
          return 'Трансформер (Transformer) — архитектура нейросети на механизме внимания (attention). Основа BERT, GPT, T5. Революционизировала NLP и выходит за его пределы (Vision Transformer, AlphaFold).';
        }
        if (/RAG/.test(q)) {
          return 'RAG (Retrieval-Augmented Generation) — подход, где LLM сначала ищет релевантную информацию в базе знаний, а затем генерирует ответ на её основе. Уменьшает галлюцинации.';
        }
        if (/LLM|языков.*модел/.test(q)) {
          return 'LLM (Large Language Model) — большая языковая модель, обученная на огромном количестве текста. Примеры: GPT-4, Claude, Gemini, LLaMA. Используются для генерации текста, вопросов-ответов, кода.';
        }
        if (/data.?drift|concept.?drift/.test(q)) {
          return 'Data drift — изменение распределения входных данных (например, пользователи стали старше). Concept drift — изменение взаимосвязи признаков и таргета (например, поведение покупок изменилось). Оба требуют переобучения модели.';
        }
      }

      // ---- Лучшие практики ----
      if (/как\s*(структурирова|организовать|построить)\s.*проект/.test(q) ||
          /структур.*проект/.test(q)) {
        return 'Рекомендуемая структура: data/raw, data/processed, notebooks/, src/, tests/, configs/, models/, outputs/. Разделяйте сырые и обработанные данные, нумеруйте ноутбуки, храните конфиги отдельно от кода.';
      }

      if (/тест|test|провер/.test(q) && /код/.test(q)) {
        return 'Для тестирования в DS: pytest для модулей, фикстуры для тестовых данных. Тестируйте функции очистки и трансформации данных. Для ML — тесты на качество (model validation tests, data quality tests).';
      }

      if (/gitignore|\.gitignore/.test(q)) {
        return 'В .gitignore добавьте: venv/, __pycache__/, .env, *.pyc, .DS_Store, .ipynb_checkpoints/, data/raw/, models/*.pkl. Это предотвратит коммит временных и больших файлов.';
      }

      if (/docker|контейнер/.test(q)) {
        return 'Docker изолирует окружение. Используйте многоступенчатую сборку (multi-stage build): первый этап — установка зависимостей, второй — минимальный образ для запуска. Базовый образ — python:3.12-slim.';
      }

      // ---- MLOps ----
      if (/mlops|ml.?ops/.test(q)) {
        return 'MLOps — практика применения DevOps к ML. Ключевые компоненты: 1) Эксперименты (MLflow/WandB) 2) Пайплайны (Airflow/Prefect) 3) Версионирование данных (DVC/lakeFS) 4) Мониторинг (Evidently/WhyLabs) 5) CI/CD для моделей.';
      }

      if (/dvc|data.*version/.test(q)) {
        return 'DVC (Data Version Control) — Git для данных. Вы храните код в Git, а данные — в S3/GCS/локально. DVC отслеживает метаданные (хэши). Позволяет вернуться к любой версии данных.';
      }

      if (/feature.?store|фич.*стор/.test(q)) {
        return 'Feature Store — центральное хранилище признаков для ML. Feast — самая популярная open-source реализация. Позволяет переиспользовать признаки между моделями и обеспечивает консистентность train/serve.';
      }

      // ---- Ошибки ----
      if (/ошибк|проблем|совет|pitfall/.test(q)) {
        return 'Частые ошибки: 1) Нет виртуального окружения 2) Утечка данных (data leakage) 3) Коммит секретов в Git 4) Смешивание train/test 5) Нет воспроизводимости (не зафиксированы версии). Используйте возможности этого приложения, чтобы их избежать!';
      }

      // ---- DS в целом ----
      if (/что такое data science|data.?science.*\?/.test(q)) {
        return 'Data Science — междисциплинарная область, использующая статистику, программирование и знание предметной области для извлечения инсайтов из данных. Включает: анализ данных, ML, визуализацию, коммуникацию результатов.';
      }

      if (/разниц.*между\s.*ai.*ml.*dl/.test(q) ||
          /ai.*vs.*ml|ai.*или.*ml/.test(q)) {
        return 'AI (Artificial Intelligence) — общее направление создания интеллектуальных систем. ML (Machine Learning) — подмножество AI, где система учится на данных. DL (Deep Learning) — подмножество ML на нейросетях. Все нейросети — ML, но не всё ML — нейросети.';
      }

      // ---- Приветствие / Общие ----
      if (/привет|здравствуй|hello|hi/.test(q)) {
        return 'Привет! Я AI-ассистент для Data Science проектов. Спрашивай о библиотеках, инструментах, лучших практиках или о том, как начать проект. Чем могу помочь?';
      }

      // ---- Дефолт ----
      if (/спасиб|thanks/i.test(q)) {
        return 'Пожалуйста! Если будут вопросы — обращайтесь. Удачи в проекте!';
      }

      return 'Интересный вопрос! Я могу рассказать о библиотеках для DS, ML, NLP, CV, временных рядов, а также о MLOps, Docker, тестировании. Попробуйте спросить конкретнее: "какие библиотеки для ML?", "как начать в Data Science?" или "что такое overfitting?';
    }
  };
})();

/* ==========================================================================
   5. App.fileGenerator — Генерация файлов проекта
   ========================================================================== */
(function () {
  if (!window.App) return;

  App.fileGenerator = {
    // ---------------------------------------------------------------
    // README.md
    // ---------------------------------------------------------------
    generateREADME: function (project) {
      if (!project) return '';
      var name = project.name || 'My DS Project';
      var desc = project.description || 'Проект по анализу данных';
      var template = App.templateManager
        ? App.templateManager.getTemplate(project.templateId)
        : null;
      var tplName = template ? template.name : 'Data Science';
      var libs = project.libraries.length
        ? project.libraries.join(', ')
        : '—';

      return (
        '# ' + name + '\n' +
        '\n' +
        '## 📝 Описание\n' +
        '\n' +
        desc + '\n' +
        '\n' +
        '## 🎯 Тип проекта\n' +
        '\n' +
        tplName + '\n' +
        '\n' +
        '## 🛠 Используемые технологии\n' +
        '\n' +
        '- Python ' + (project.pythonVersion || '3.12') + '\n' +
        (project.useUv ? '- uv (менеджер пакетов)\n' : '') +
        '- ' + libs + '\n' +
        '\n' +
        '## 📁 Структура проекта\n' +
        '\n' +
        '```\n' +
        '├── data/            # Данные проекта\n' +
        '│   ├── raw/         # Исходные данные\n' +
        '│   └── processed/   # Обработанные данные\n' +
        '├── notebooks/       # Jupyter ноутбуки\n' +
        '├── src/             # Исходный код\n' +
        '├── tests/           # Тесты\n' +
        '├── configs/         # Конфигурационные файлы\n' +
        '├── outputs/         # Результаты\n' +
        '├── requirements.txt # Зависимости\n' +
        '├── pyproject.toml   # Конфигурация проекта\n' +
        '├── .gitignore\n' +
        '└── README.md        # Этот файл\n' +
        '```\n' +
        '\n' +
        '## 🚀 Быстрый старт\n' +
        '\n' +
        (project.useUv
          ? '1. Установите uv: `powershell -c "irm https://astral.sh/uv/install.ps1 | iex"`\n'
          : '1. Создайте виртуальное окружение: `python -m venv venv`\n' +
            '2. Активируйте: `.\\venv\\Scripts\\activate` (Windows) или `source venv/bin/activate` (Linux/Mac)\n') +
        (project.useUv
          ? '2. Синхронизируйте окружение: `uv sync`\n'
          : '3. Установите зависимости: `pip install -r requirements.txt`\n') +
        '\n' +
        '## 📊 Roadmap\n' +
        '\n' +
        project.roadmap.map(function (r, i) {
          return (i + 1) + '. [ ] ' + r.title + ' — ' + r.description;
        }).join('\n') +
        '\n' +
        '\n' +
        '---\n' +
        'Сгенерировано с помощью [AI Project Companion](https://github.com/your-repo)'
      );
    },

    // ---------------------------------------------------------------
    // requirements.txt
    // ---------------------------------------------------------------
    generateRequirements: function (project) {
      if (!project) return '';
      var libs = project.libraries && project.libraries.length
        ? project.libraries
        : ['pandas', 'numpy', 'matplotlib'];
      return libs.map(function (l) { return l + '>=0.0.0'; }).join('\n') +
        '\n# Установите актуальные версии: pip install -r requirements.txt\n';
    },

    // ---------------------------------------------------------------
    // pyproject.toml
    // ---------------------------------------------------------------
    generatePyprojectToml: function (project) {
      if (!project) return '';
      var name = (project.name || 'my_project')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_')
        .replace(/_+/g, '_');
      var desc = project.description || '';
      var libs = project.libraries && project.libraries.length
        ? project.libraries
        : ['pandas', 'numpy'];

      var lines = [];
      lines.push('[build-system]');
      lines.push('requires = ["setuptools>=68.0", "wheel"]');
      lines.push('build-backend = "setuptools.backends._legacy:_Backend"');
      lines.push('');
      lines.push('[project]');
      lines.push('name = "' + name + '"');
      lines.push('version = "0.1.0"');
      lines.push('description = "' + desc + '"');
      lines.push('readme = "README.md"');
      lines.push('requires-python = ">=' + (project.pythonVersion || '3.12') + '"');
      lines.push('license = {text = "MIT"}');
      lines.push('keywords = ["data-science", "machine-learning"]');
      lines.push('');
      lines.push('dependencies = [');
      for (var i = 0; i < libs.length; i++) {
        var comma = i < libs.length - 1 ? ',' : '';
        lines.push('    "' + libs[i] + '>=0.0.0"' + comma);
      }
      lines.push(']');
      lines.push('');
      lines.push('[tool.setuptools]');
      lines.push('packages = ["src"]');
      lines.push('');
      lines.push('[tool.setuptools.packages.find]');
      lines.push('where = ["."]');
      lines.push('include = ["src*"]');
      lines.push('');
      lines.push('[project.urls]');
      lines.push('Homepage = "https://github.com/your-org/' + name + '"');
      lines.push('Repository = "https://github.com/your-org/' + name + '.git"');

      return lines.join('\n');
    },

    // ---------------------------------------------------------------
    // .gitignore
    // ---------------------------------------------------------------
    generateGitignore: function (project) {
      return (
        '# Python\n' +
        '__pycache__/\n' +
        '*.py[cod]\n' +
        '*.pyo\n' +
        '*.pyd\n' +
        '$py.class\n' +
        '.Python\n' +
        'venv/\n' +
        '.venv/\n' +
        'env/\n' +
        '.env\n' +
        '\n' +
        '# Jupyter\n' +
        '.ipynb_checkpoints/\n' +
        '*/.ipynb_checkpoints/*\n' +
        '\n' +
        '# IDE\n' +
        '.vscode/\n' +
        '.idea/\n' +
        '*.swp\n' +
        '*.swo\n' +
        '*~\n' +
        '\n' +
        '# OS\n' +
        '.DS_Store\n' +
        'Thumbs.db\n' +
        '\n' +
        '# Data\n' +
        'data/raw/*\n' +
        'data/processed/*\n' +
        '!data/raw/.gitkeep\n' +
        '!data/processed/.gitkeep\n' +
        '\n' +
        '# Models\n' +
        'models/*.pkl\n' +
        'models/*.h5\n' +
        'models/*.pt\n' +
        'models/*.onnx\n' +
        '\n' +
        '# Logs\n' +
        'logs/\n' +
        '*.log\n' +
        '\n' +
        '# MLflow\n' +
        'mlruns/\n' +
        '\n' +
        '# DVC\n' +
        '.dvc/cache/\n' +
        '\n' +
        '# Outputs\n' +
        'outputs/*\n' +
        '!outputs/.gitkeep\n' +
        '\n' +
        '# Notebook outputs\n' +
        'notebooks/*.html\n' +
        '\n' +
        '# Coverage\n' +
        'htmlcov/\n' +
        '.coverage\n' +
        '.coverage.*\n' +
        'coverage.xml\n' +
        '\n' +
        '# Secrets\n' +
        '*.key\n' +
        '*.cert\n' +
        '.env.local\n' +
        '.env.production\n' +
        '\n' +
        '# Docker\n' +
        '.dockerignore\n' +
        '\n' +
        '# Temp\n' +
        'tmp/\n' +
        'temp/\n'
      );
    },

    // ---------------------------------------------------------------
    // Dockerfile
    // ---------------------------------------------------------------
    generateDockerfile: function (project) {
      var pyVer = project.pythonVersion || '3.12';
      return (
        '# ---- Build stage ----\n' +
        'FROM python:' + pyVer + '-slim AS builder\n' +
        '\n' +
        'WORKDIR /app\n' +
        '\n' +
        'COPY requirements.txt .\n' +
        'RUN pip install --no-cache-dir --user -r requirements.txt\n' +
        '\n' +
        '# ---- Runtime stage ----\n' +
        'FROM python:' + pyVer + '-slim\n' +
        '\n' +
        'WORKDIR /app\n' +
        '\n' +
        'COPY --from=builder /root/.local /root/.local\n' +
        'ENV PATH=/root/.local/bin:$PATH\n' +
        '\n' +
        'COPY src/ ./src/\n' +
        'COPY data/ ./data/\n' +
        'COPY configs/ ./configs/\n' +
        'COPY pyproject.toml .\n' +
        '\n' +
        'RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app\n' +
        'USER appuser\n' +
        '\n' +
        'CMD ["python", "src/main.py"]\n'
      );
    },

    // ---------------------------------------------------------------
    // docker-compose.yml
    // ---------------------------------------------------------------
    generateDockerCompose: function () {
      return (
        'version: "3.9"\n' +
        '\n' +
        'services:\n' +
        '  app:\n' +
        '    build: .\n' +
        '    ports:\n' +
        '      - "8000:8000"\n' +
        '    volumes:\n' +
        '      - ./data:/app/data\n' +
        '      - ./outputs:/app/outputs\n' +
        '    env_file:\n' +
        '      - .env\n' +
        '    environment:\n' +
        '      - PYTHONUNBUFFERED=1\n' +
        '    restart: unless-stopped\n' +
        '    healthcheck:\n' +
        '      test: ["CMD", "python", "-c", "import sys; sys.exit(0)"]\n' +
        '      interval: 30s\n' +
        '      timeout: 10s\n' +
        '      retries: 3\n'
      );
    },

    // ---------------------------------------------------------------
    // GitHub Actions CI
    // ---------------------------------------------------------------
    generateGitHubActions: function (project) {
      return (
        'name: CI\n' +
        '\n' +
        'on:\n' +
        '  push:\n' +
        '    branches: [ main, develop ]\n' +
        '  pull_request:\n' +
        '    branches: [ main ]\n' +
        '\n' +
        'jobs:\n' +
        '  test:\n' +
        '    runs-on: ubuntu-latest\n' +
        '    strategy:\n' +
        '      matrix:\n' +
        '        python-version: ["' + (project.pythonVersion || '3.12') + '"]\n' +
        '\n' +
        '    steps:\n' +
        '    - uses: actions/checkout@v4\n' +
        '    - name: Set up Python ${{ matrix.python-version }}\n' +
        '      uses: actions/setup-python@v5\n' +
        '      with:\n' +
        '        python-version: ${{ matrix.python-version }}\n' +
        '    - name: Install dependencies\n' +
        '      run: |\n' +
        '        python -m pip install --upgrade pip\n' +
        '        pip install -r requirements.txt\n' +
        '        pip install pytest pytest-cov ruff mypy\n' +
        '    - name: Lint with ruff\n' +
        '      run: ruff check src/ tests/\n' +
        '    - name: Type check with mypy\n' +
        '      run: mypy src/\n' +
        '    - name: Test with pytest\n' +
        '      run: pytest tests/ --cov=src/ --cov-report=xml\n' +
        '    - name: Upload coverage\n' +
        '      uses: codecov/codecov-action@v4\n' +
        '      with:\n' +
        '        file: ./coverage.xml\n'
      );
    },

    // ---------------------------------------------------------------
    // VS Code config
    // ---------------------------------------------------------------
    generateVSCodeConfig: function (project) {
      var pyVer = project.pythonVersion || '3.12';
      return {
        settings: JSON.stringify({
          'python.defaultInterpreterPath': '.\\venv\\Scripts\\python.exe',
          'python.terminal.activateEnvironment': true,
          'python.linting.enabled': true,
          'python.linting.pylintEnabled': false,
          'python.linting.ruffEnabled': true,
          'python.linting.mypyEnabled': true,
          'python.formatting.provider': 'black',
          'python.formatting.blackArgs': ['--line-length', '100'],
          '[python]': {
            'editor.formatOnSave': true,
            'editor.rulers': [100],
            'editor.codeActionsOnSave': {
              'source.organizeImports': true
            }
          },
          'files.exclude': {
            '**/__pycache__': true,
            '**/.pytest_cache': true,
            '**/.mypy_cache': true,
            'venv': true
          }
        }, null, 2),
        launch: JSON.stringify({
          version: '0.2.0',
          configurations: [
            {
              name: 'Python: Current File',
              type: 'python',
              request: 'launch',
              program: '${file}',
              console: 'integratedTerminal',
              envFile: '${workspaceFolder}/.env'
            },
            {
              name: 'Python: Debug Tests',
              type: 'python',
              request: 'launch',
              module: 'pytest',
              args: ['-v', '${workspaceFolder}/tests'],
              console: 'integratedTerminal'
            }
          ]
        }, null, 2)
      };
    },

    // ---------------------------------------------------------------
    // Makefile
    // ---------------------------------------------------------------
    generateMakefile: function () {
      return (
        '.PHONY: setup clean test lint run docker\n' +
        '\n' +
        '# Настройка окружения\n' +
        'setup:\n' +
        '\tpython -m venv venv\n' +
        '\t.\\venv\\Scripts\\activate && pip install --upgrade pip\n' +
        '\t.\\venv\\Scripts\\activate && pip install -r requirements.txt\n' +
        '\t.\\venv\\Scripts\\activate && pip install -e .\n' +
        '\n' +
        '# Очистка\n' +
        'clean:\n' +
        '\trm -rf venv/\n' +
        '\trm -rf __pycache__/\n' +
        '\trm -rf .pytest_cache/\n' +
        '\trm -rf .mypy_cache/\n' +
        '\trm -rf *.egg-info/\n' +
        '\n' +
        '# Тестирование\n' +
        'test:\n' +
        '\tpytest tests/ -v --cov=src/ --cov-report=term-missing\n' +
        '\n' +
        '# Линтинг\n' +
        'lint:\n' +
        '\truff check src/ tests/\n' +
        '\tmypy src/\n' +
        '\n' +
        '# Запуск\n' +
        'run:\n' +
        '\tpython src/main.py\n' +
        '\n' +
        '# Docker\n' +
        'docker:\n' +
        '\tdocker build -t myapp .\n' +
        '\tdocker run -p 8000:8000 myapp\n' +
        '\n' +
        '# Форматирование\n' +
        'format:\n' +
        '\tblack src/ tests/\n' +
        '\n' +
        '# Заморозка зависимостей\n' +
        'freeze:\n' +
        '\tpip freeze > requirements.txt\n'
      );
    },

    // ---------------------------------------------------------------
    // .env.example
    // ---------------------------------------------------------------
    generateEnvExample: function (project) {
      var lines = [];
      lines.push('# ' + (project.name || 'My Project') + ' — переменные окружения');
      lines.push('# Скопируйте в .env и заполните значения');
      lines.push('');
      lines.push('APP_NAME=' + (project.name || 'my_project'));
      lines.push('APP_ENV=development');
      lines.push('APP_DEBUG=true');
      lines.push('');
      lines.push('PYTHON_VERSION=' + (project.pythonVersion || '3.12'));
      lines.push('');
      lines.push('# Данные');
      lines.push('DATA_DIR=data/');
      lines.push('OUTPUT_DIR=outputs/');
      lines.push('LOG_DIR=logs/');
      lines.push('LOG_LEVEL=INFO');
      lines.push('');
      lines.push('# API');
      lines.push('# API_KEY=your-api-key-here');
      lines.push('# API_SECRET=your-secret-here');
      lines.push('');
      lines.push('# База данных (если используется)');
      lines.push('# DATABASE_URL=sqlite:///data/db.sqlite3');
      lines.push('');
      lines.push('# MLflow (если используется)');
      lines.push('# MLFLOW_TRACKING_URI=http://localhost:5000');
      lines.push('# MLFLOW_EXPERIMENT_NAME=' + (project.name || 'default'));
      return lines.join('\n');
    },

    // ---------------------------------------------------------------
    // .env
    // ---------------------------------------------------------------
    generateEnvFile: function (project) {
      var lines = [];
      lines.push('# ' + (project.name || 'My Project'));
      lines.push('APP_NAME=' + (project.name || 'my_project'));
      lines.push('APP_ENV=development');
      lines.push('APP_DEBUG=true');
      lines.push('PYTHON_VERSION=' + (project.pythonVersion || '3.12'));
      lines.push('DATA_DIR=data/');
      lines.push('OUTPUT_DIR=outputs/');
      lines.push('LOG_DIR=logs/');
      lines.push('LOG_LEVEL=INFO');
      return lines.join('\n');
    }
  };
})();

/* ==========================================================================
   Конец services.js
   ========================================================================== */
