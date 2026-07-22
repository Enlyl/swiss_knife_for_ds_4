.PHONY: setup clean test lint run docker

# Настройка окружения
setup:
	python -m venv venv
	.\venv\Scripts\activate && pip install --upgrade pip
	.\venv\Scripts\activate && pip install -r requirements.txt
	.\venv\Scripts\activate && pip install -e .

# Очистка
clean:
	rm -rf venv/
	rm -rf __pycache__/
	rm -rf .pytest_cache/
	rm -rf .mypy_cache/
	rm -rf *.egg-info/

# Тестирование
test:
	pytest tests/ -v --cov=src/ --cov-report=term-missing

# Линтинг
lint:
	ruff check src/ tests/
	mypy src/

# Запуск
run:
	python src/main.py

# Docker
docker:
	docker build -t myapp .
	docker run -p 8000:8000 myapp

# Форматирование
format:
	black src/ tests/

# Заморозка зависимостей
freeze:
	pip freeze > requirements.txt
