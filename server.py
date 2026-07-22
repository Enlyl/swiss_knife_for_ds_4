import http.server
import json
import os
import subprocess
import sys

PORT = 8910

def flatten_structure(structure, prefix=''):
    dirs = []
    for item in structure:
        if isinstance(item, dict) and item.get('type') == 'dir':
            path = os.path.join(prefix, item['name']) if prefix else item['name']
            dirs.append(path)
            if 'children' in item:
                dirs.extend(flatten_structure(item['children'], path))
    return dirs

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length)
        try:
            data = json.loads(body)
        except Exception:
            self._json({'success': False, 'error': 'Invalid JSON'})
            return
        if self.path == '/api/create-project':
            self._create_project(data)
        elif self.path == '/api/setup-env':
            self._setup_env(data)
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
            os.makedirs(root_dir, exist_ok=True)

            dirs = flatten_structure(structure)
            for d in dirs:
                full_path = os.path.join(root_dir, d)
                os.makedirs(full_path, exist_ok=True)

            written = []
            for filepath, content in files.items():
                full_path = os.path.join(root_dir, filepath)
                parent = os.path.dirname(full_path)
                if parent:
                    os.makedirs(parent, exist_ok=True)
                with open(full_path, 'w', encoding='utf-8') as f:
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

    def _setup_env(self, data):
        root_dir = data.get('rootDir', '').strip()
        use_uv = data.get('useUv', False)
        libraries = data.get('libraries', [])

        if not root_dir or not os.path.isdir(root_dir):
            self._json({'success': False, 'error': 'Директория не найдена'})
            return

        try:
            output_lines = []
            venv_path = os.path.join(root_dir, 'venv')

            def run(cmd, cwd=None):
                out = ''
                try:
                    res = subprocess.run(cmd, cwd=cwd or root_dir,
                        capture_output=True, text=True, timeout=300,
                        shell=True)
                    if res.stdout:
                        out += res.stdout.strip()
                    if res.returncode != 0 and res.stderr:
                        out += '\n' + res.stderr.strip()
                    return out, res.returncode
                except subprocess.TimeoutExpired:
                    return 'Timeout', -1
                except Exception as e:
                    return str(e), -1

            if use_uv:
                out1, rc1 = run('uv venv')
                output_lines.append('uv venv: %s' % out1)
                if rc1 == 0:
                    out2, rc2 = run('uv pip install %s' % ' '.join(libraries))
                    output_lines.append('uv pip install: %s' % out2)
            else:
                out1, rc1 = run('python -m venv venv')
                output_lines.append('python -m venv venv: %s' % out1)
                if rc1 == 0:
                    pip_path = os.path.join(venv_path, 'Scripts', 'pip')
                    if os.path.exists(pip_path):
                        out2, rc2 = run('"%s" install %s' % (pip_path, ' '.join(libraries)))
                        output_lines.append('pip install: %s' % out2)

            success = True
            for line in output_lines:
                if 'Error' in line or 'error' in line:
                    success = False

            print('[setup-env] %s -> %s' % (root_dir, 'ok' if success else 'fail'))
            self._json({
                'success': success,
                'output': '\n'.join(output_lines)
            })
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
    server = http.server.ThreadingHTTPServer(('127.0.0.1', PORT), Handler)
    print('http://127.0.0.1:%d' % PORT)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
