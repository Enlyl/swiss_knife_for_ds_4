# AI Project Companion

**SPA-инструмент для управления проектами data science** — от идеи до деплоя. Генерация шаблонов, инспекция кода, анализ CSV, AI-рекомендации и трекинг прогресса в одном приложении.

---

## Возможности

### Управление проектами
- **Создание проектов** — пошаговый мастер (Wizard): имя, шаблон, библиотеки, настройки окружения
- **Список проектов** — карточки с прогрессом, поиск, удаление
- **Roadmap** — временная шкала этапов проекта с отметкой выполнения и AI-рекомендациями
- **Инспектор файлов** — просмотр структуры проекта, зависимостей, конфигов и тестов с подсветкой синтаксиса

### 10 встроенных шаблонов

| Шаблон | Уровень | Категория |
|--------|---------|-----------|
| Data Analysis | Начальный | Анализ данных |
| Machine Learning | Средний | Машинное обучение |
| NLP | Средний | Машинное обучение |
| Computer Vision | Продвинутый | Глубокое обучение |
| Kaggle Competition | Средний | Соревнования |
| AI Agents | Продвинутый | AI/ML |
| Dashboard (Streamlit) | Начальный | Визуализация |
| FastAPI Service | Средний | Бэкенд |
| Time Series | Средний | Анализ данных |
| Recommendation System | Продвинутый | Машинное обучение |

### Генераторы файлов
Генерация всех ключевых файлов для DS-проекта с предпросмотром:
- `README.md` — документация проекта
- `requirements.txt` — зависимости
- `pyproject.toml` — метаданные и сборка
- `.gitignore` — Python/DS
- `Dockerfile` — multi-stage сборка
- `docker-compose.yml` — сервис с healthcheck
- `.github/workflows/ci.yml` — CI pipeline (ruff, mypy, pytest, codecov)
- `.vscode/settings.json` + `launch.json` — настройки редактора
- `Makefile` — 8 целей (setup, test, lint, run, docker и др.)
- `.env.example` — переменные окружения

### CSV Viewer
- Загрузка через drag & drop
- Автоопределение типов колонок
- Сортировка, поиск, пагинация
- Построение графиков (bar, line, scatter, pie) через Chart.js

### Code Viewer
- Мультитабный просмотр кода
- Подсветка синтаксиса для 7 языков: Python, JavaScript, HTML, CSS, JSON, YAML, Markdown
- Открытие файлов или загрузка из проекта
- Копирование и скачивание

### AI Assistant
- Встроенный чат-бот с базой знаний по DS
- Рекомендации библиотек по задачам
- Объяснение шагов pipeline
- Анализ проекта (health check, issues, suggestions)
- Best practices по структуре проекта, тестированию, деплою
- Трекинг эксперимента, MLOps, управление данными
- FAQ по концепциям DS/ML (overfitting, transformers, RAG, data drift и др.)

### Система тем
- **Тёмная / Светлая** темы
- **5 категорий тем:** Gamer, Cosmic, Programmer, Retro, Techno
- У каждой категории — уникальная цветовая палитра, шрифт и стили

### Настройки
- 25 иконок аватара в 5 стилях
- 15 иконок логотипа в 5 стилях
- Выбор языка: русский / английский
- Настройки по умолчанию (Python, env manager)
- Плагины с системой хуков

### Плагины
Система расширений через `App.plugins.register()` с хуками:
- `onProjectCreate`, `onProjectOpen`, `onFileGenerate`
- `onTemplateApply`, `onAnalysisStart`, `onAnalysisComplete`

### REST API (backend)
`server.py` — Python HTTP-сервер на порту 8765 для создания файлов проекта на диске через `POST /api/create-project`.

---

## Технологии

| Компонент | Технология |
|-----------|-----------|
| Ядро | Vanilla JavaScript (ES5, IIFE) |
| Стили | CSS Custom Properties, 4143 строки |
| Иконки | Font Awesome 6.5.1 |
| Графики | Chart.js 4.4.1 |
| Шрифты | Inter, Orbitron, Space Grotesk, JetBrains Mono |
| Бэкенд | Python 3 + http.server |
| Фавикон | SVG (32×32) |
| Хранилище | localStorage |
| Зависимости | Нет сборщиков, нет npm |

---

## Быстрый старт

```bash
# 1. Откройте index.html в браузере (SPA без бэкенда)
open index.html

# 2. Или запустите с сервером для генерации файлов на диске
python server.py
# Откройте http://localhost:8765
```

---

## Структура проекта

```
.
├── index.html              # SPA shell
├── favicon.svg             # Фавикон
├── server.py               # HTTP-сервер для записи файлов
├── css/
│   └── main.css            # Все стили (2 темы × 5 категорий)
└── js/
    ├── core/
    │   └── app.js          # Ядро: роутер, темы, события, состояние, плагины, UI
    ├── services/
    │   └── services.js     # 5 сервисов: проекты, шаблоны, окружение, AI, файлы
    └── components/
        ├── dashboard.js    # Главная: статистика, быстрые действия, советы
        ├── wizard.js       # Мастер создания проекта (4 шага)
        ├── projects.js     # Список проектов
        ├── roadmap.js      # Трекер этапов с AI-рекомендациями
        ├── inspector.js    # Инспектор файлов и конфигов
        ├── csv-viewer.js   # Просмотр и визуализация CSV
        ├── code-viewer.js  # Просмотр кода с подсветкой
        ├── generators.js   # Генерация файлов проекта
        ├── templates.js    # Библиотека шаблонов
        ├── plugins.js      # Менеджер плагинов
        └── settings.js     # Настройки приложения
```
