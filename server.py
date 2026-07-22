import http.server
import json
import os
import sys
import shutil

PORT = 8765

def flatten_structure(structure, prefix=''):
    dirs = []
    for item in structure:
        if isinstance(item, dict) and item.get('type') == 'dir':
            path = os.path.join(prefix, item['name']) if prefix else item['name']
            dirs.append(path)
            if 'children' in item:
                dirs.extend(flatten_structure(item['children'], path))
    return dirs

class ProjectHandler(http.server.SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/create-project':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            try:
                data = json.loads(body)
            except Exception:
                self._json({'success': False, 'error': 'Invalid JSON'})
                return
            self._create_project(data)
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'Not found')

    def _create_project(self, data):
        root_dir = data.get('rootDir', '').strip()
        name = data.get('name', 'project')
        files = data.get('files', {})
        structure = data.get('structure', [])

        if not root_dir:
            self._json({'success': False, 'error': 'Директория не указана'})
            return

        try:
            if os.path.exists(root_dir):
                self._json({'success': False, 'error': 'Директория "%s" уже существует' % root_dir})
                return

            os.makedirs(root_dir, exist_ok=True)

            # Создаём структуру папок из шаблона
            dirs = flatten_structure(structure)
            for d in dirs:
                full = os.path.join(root_dir, d)
                os.makedirs(full, exist_ok=True)

            # Записываем файлы
            written = []
            for filepath, content in files.items():
                full = os.path.join(root_dir, filepath)
                parent = os.path.dirname(full)
                if parent:
                    os.makedirs(parent, exist_ok=True)
                with open(full, 'w', encoding='utf-8') as f:
                    f.write(content)
                written.append(filepath)

            abs_path = os.path.abspath(root_dir)
            self._json({
                'success': True,
                'path': abs_path,
                'files_written': len(written),
                'dirs_created': len(dirs)
            })
            print('[create-project] %s -> %s (%d files, %d dirs)' % (
                name, abs_path, len(written), len(dirs)))
        except Exception as e:
            self._json({'success': False, 'error': str(e)})

    def _json(self, data):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

if __name__ == '__main__':
    server = http.server.HTTPServer(('0.0.0.0', PORT), ProjectHandler)
    print('Сервер запущен на http://localhost:%d' % PORT)
    print('Нажмите Ctrl+C для остановки')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nСервер остановлен')
        server.server_close()
