#!/usr/bin/env python3
from http.server import HTTPServer, SimpleHTTPRequestHandler
import os
import json
import urllib.request
import urllib.parse
from urllib.parse import urlparse, parse_qs

# Change to public directory for serving static files
os.chdir(os.path.join(os.path.dirname(__file__), 'public'))

# Store menu data (in production, use a proper database)
MENU_FILE = '../menu_data.json'
ORDERS_FILE = '../orders_data.json'
FEEDBACK_FILE = '../feedback_data.json'

def load_json_file(filename, default):
    try:
        with open(filename, 'r') as f:
            return json.load(f)
    except:
        return default

def save_json_file(filename, data):
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)

class MyHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed_path = urlparse(self.path)

        # API endpoints
        if parsed_path.path == '/api/firebase-config':
            # Serve Firebase config from environment variables
            config = {
                'apiKey': os.environ.get('FIREBASE_API_KEY', ''),
                'authDomain': os.environ.get('FIREBASE_AUTH_DOMAIN', ''),
                'projectId': os.environ.get('FIREBASE_PROJECT_ID', ''),
                'storageBucket': os.environ.get('FIREBASE_STORAGE_BUCKET', ''),
                'messagingSenderId': os.environ.get('FIREBASE_MESSAGING_SENDER_ID', ''),
                'appId': os.environ.get('FIREBASE_APP_ID', '')
            }
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(config).encode())
            return
        elif parsed_path.path == '/api/menu':
            menu = load_json_file(MENU_FILE, [])
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(menu).encode())
            return
        elif parsed_path.path == '/api/orders':
            orders = load_json_file(ORDERS_FILE, [])
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(orders).encode())
            return
        elif parsed_path.path == '/api/feedback':
            feedback = load_json_file(FEEDBACK_FILE, [])
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(feedback).encode())
            return

        # Serve HTML files (already in public directory)
        if self.path == '/':
            self.path = '/index.html'
        return SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        parsed_path = urlparse(self.path)

        if parsed_path.path == '/api/upload-image':
            # Handle image upload to ImgBB
            try:
                print('📤 Upload request received')
                
                # Parse multipart form data manually to extract base64 image
                content_type = self.headers.get('Content-Type', '')
                if 'boundary=' not in content_type:
                    raise ValueError('No boundary found in Content-Type')
                
                boundary = content_type.split('boundary=')[1].encode()
                parts = post_data.split(b'--' + boundary)
                
                image_base64 = None
                folder = 'menu'
                filename = 'image'
                
                print(f'📦 Processing {len(parts)} parts')
                
                for part in parts:
                    if b'name="image"' in part:
                        try:
                            image_base64 = part.split(b'\r\n\r\n')[1].split(b'\r\n')[0].decode('utf-8', errors='ignore')
                            print(f'✅ Found image data, length: {len(image_base64)}')
                        except Exception as e:
                            print(f'❌ Error extracting image: {e}')
                    elif b'name="folder"' in part:
                        try:
                            folder = part.split(b'\r\n\r\n')[1].split(b'\r\n')[0].decode('utf-8')
                            print(f'✅ Folder: {folder}')
                        except:
                            pass
                    elif b'name="filename"' in part:
                        try:
                            filename = part.split(b'\r\n\r\n')[1].split(b'\r\n')[0].decode('utf-8')
                            print(f'✅ Filename: {filename}')
                        except:
                            pass
                
                if not image_base64:
                    raise ValueError('No image data provided')
                
                # Get ImgBB API key from environment
                imgbb_api_key = os.environ.get('IMGBB_API_KEY', '')
                if not imgbb_api_key:
                    raise ValueError('ImgBB API key not configured in environment variables')
                
                print(f'🔑 Using ImgBB API key: {imgbb_api_key[:10]}...')
                
                # Prepare upload to ImgBB
                upload_data = urllib.parse.urlencode({
                    'key': imgbb_api_key,
                    'image': image_base64,
                    'name': f'{folder}_{filename}'
                }).encode()
                
                print('📤 Uploading to ImgBB...')
                
                # Upload to ImgBB
                req = urllib.request.Request('https://api.imgbb.com/1/upload', data=upload_data)
                req.add_header('Content-Type', 'application/x-www-form-urlencoded')
                
                try:
                    response = urllib.request.urlopen(req, timeout=30)
                    result = json.loads(response.read().decode())
                    print(f'✅ ImgBB response: {result.get("success", False)}')
                except urllib.error.HTTPError as e:
                    error_body = e.read().decode()
                    print(f'❌ ImgBB HTTP Error: {e.code} - {error_body}')
                    raise ValueError(f'ImgBB upload failed: {e.code} - {error_body}')
                except urllib.error.URLError as e:
                    print(f'❌ ImgBB URL Error: {e.reason}')
                    raise ValueError(f'ImgBB connection failed: {e.reason}')
                
                if result.get('success'):
                    image_url = result['data']['display_url']
                    print(f'✅ Upload successful: {image_url}')
                    
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        'success': True,
                        'url': image_url
                    }).encode())
                else:
                    error_msg = result.get('error', {}).get('message', 'Unknown error')
                    print(f'❌ ImgBB returned error: {error_msg}')
                    raise ValueError(f'ImgBB upload failed: {error_msg}')
                    
            except Exception as e:
                print(f'❌ Upload error: {str(e)}')
                import traceback
                traceback.print_exc()
                
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'success': False,
                    'error': str(e)
                }).encode())
            return
        elif parsed_path.path == '/api/menu':
            menu = json.loads(post_data.decode())
            save_json_file(MENU_FILE, menu)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'success': True}).encode())
        elif parsed_path.path == '/api/orders':
            orders = json.loads(post_data.decode())
            save_json_file(ORDERS_FILE, orders)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'success': True}).encode())
        elif parsed_path.path == '/api/feedback':
            feedback = json.loads(post_data.decode())
            save_json_file(FEEDBACK_FILE, feedback)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'success': True}).encode())

PORT = 5000
server_address = ('0.0.0.0', PORT)
httpd = HTTPServer(server_address, MyHandler)
print(f"Server running at http://0.0.0.0:{PORT}/")
print(f"Serving directory: {os.getcwd()}")
httpd.serve_forever()