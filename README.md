# AI Project Companion

**SPA for managing data science projects** — from idea to deployment. Template generation, code inspection, CSV analysis, AI recommendations, and progress tracking in a single app.

---

## Features

### Project Management
- **Project creation** — step-by-step wizard: name, template, libraries, environment setup
- **Project list** — cards with progress, search, delete
- **File inspector** — browse project structure, dependencies, configs, and tests with syntax highlighting
- **Generators** — preview and download boilerplate files for any project

### 10 Built-in Templates

| Template | Level | Category |
|---|---|---|
| Data Analysis | Beginner | Data Analysis |
| Machine Learning | Intermediate | Machine Learning |
| NLP | Intermediate | Machine Learning |
| Computer Vision | Advanced | Deep Learning |
| Kaggle Competition | Intermediate | Competitions |
| AI Agents | Advanced | AI/ML |
| Dashboard (Streamlit) | Beginner | Visualization |
| FastAPI Service | Intermediate | Backend |
| Time Series | Intermediate | Data Analysis |
| Recommendation System | Advanced | Machine Learning |

### File Generators
Generate all key files for a DS project with live preview:
- `README.md` — project docs
- `requirements.txt` — dependencies
- `pyproject.toml` — metadata and build config
- `.gitignore` — Python/DS
- `Dockerfile` — multi-stage build
- `docker-compose.yml` — service with healthcheck
- `.github/workflows/ci.yml` — CI pipeline (ruff, mypy, pytest, codecov)
- `.vscode/settings.json` + `launch.json` — editor settings
- `Makefile` — 8 targets (setup, test, lint, run, docker, etc.)
- `.env.example` — environment variables

### CSV Viewer
- Drag & drop upload
- Auto column type detection
- Sorting, search, pagination
- Chart.js plots (bar, line, scatter, pie)

### Code Viewer
- Multi-tab code viewer
- Syntax highlighting for 7 languages: Python, JavaScript, HTML, CSS, JSON, YAML, Markdown
- Open files or load from project
- Copy and download

### AI Assistant
- Built-in chatbot with DS knowledge base
- Library recommendations by task
- Pipeline step explanations
- Project analysis (health check, issues, suggestions)
- Best practices for project structure, testing, deployment
- Experiment tracking, MLOps, data management
- DS/ML concepts FAQ (overfitting, transformers, RAG, data drift, etc.)

### Theme System
- **Dark / Light** modes
- **5 theme categories:** Gamer, Cosmic, Programmer, Retro, Techno
- Each category has a unique color palette, font, and styles

### Settings
- 25 avatar icons in 5 styles
- 15 logo icons in 5 styles
- Language: Russian / English
- Default preferences (Python version, env manager)

### Plugins
Extension system via `App.plugins.register()` with hooks:
- `onProjectCreate`, `onProjectOpen`, `onFileGenerate`
- `onTemplateApply`, `onAnalysisStart`, `onAnalysisComplete`

### REST API (backend)
`server.py` — Python HTTP server on port 8765. Creates project files on disk via `POST /api/create-project`.

---

## Tech Stack

| Component | Technology |
|---|---|
| Core | Vanilla JavaScript (ES5, IIFE) |
| Styles | CSS Custom Properties, ~4100 lines |
| Icons | Font Awesome 6.5.1 |
| Charts | Chart.js 4.4.1 |
| Fonts | Inter, Orbitron, Space Grotesk, JetBrains Mono |
| Backend | Python 3 + http.server |
| Favicon | SVG (32×32) |
| Storage | localStorage |
| Dependencies | No bundlers, no npm |

---

## Quick Start

```bash
# 1. Start the server (serves static files + API for disk writes)
python server.py

# 2. Open http://localhost:8765 in your browser
```

> Without the server the app still works (projects saved to browser localStorage), but files won't be written to disk.

---

## Project Structure

```
.
├── index.html              # SPA shell
├── favicon.svg             # Favicon
├── server.py               # HTTP server (static + API)
├── README.md               # This file
├── css/
│   └── main.css            # All styles (2 themes × 5 categories)
└── js/
    ├── core/
    │   └── app.js          # Core: router, themes, events, state, plugins, UI
    ├── services/
    │   └── services.js     # 5 services: projects, templates, env, AI, files
    └── components/
        ├── dashboard.js    # Home: stats, quick actions, tips
        ├── wizard.js       # Project creation wizard (3 steps)
        ├── projects.js     # Project list with search
        ├── inspector.js    # File & config inspector
        ├── csv-viewer.js   # CSV viewer + charts
        ├── code-viewer.js  # Code viewer with syntax highlighting
        ├── generators.js   # Boilerplate file generators
        ├── templates.js    # Template library browser
        ├── plugins.js      # Plugin manager
        └── settings.js     # App settings
```

---

## Development

No build step. Edit the JS/CSS files and refresh the browser.

```bash
# Lint check (if Node.js available)
node -e "try { new Function(require('fs').readFileSync('js/core/app.js','utf8')); console.log('OK'); } catch(e) { console.log(e.message); }"

# Python syntax check
python -c "import ast; ast.parse(open('server.py').read()); print('OK')"
```
