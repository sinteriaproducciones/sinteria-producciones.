import json
import subprocess
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parent.parent
BASE = '/sinteria-producciones./'
ORIGIN = 'https://sinteriaproducciones.github.io'
ROUTES = ['', 'servicios/', 'catalogo/', 'galeria/', 'nosotros/', 'contacto/', 'condiciones/', 'privacidad/']


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links = []
        self.resources = []
        self.ids = []
        self.h1 = 0
        self.canonical = None
        self.title = ''
        self.in_title = False
        self.state = ''
        self.in_state = False
        self.videos = []
        self.required_fields = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'):
            self.ids.append(a['id'])
        if tag == 'a' and a.get('href'):
            self.links.append(a['href'])
        if tag in ('img', 'video', 'script', 'source') and a.get('src'):
            self.resources.append(a['src'])
        if tag == 'video':
            self.videos.append(a)
        if tag == 'link' and a.get('rel') == 'stylesheet':
            self.resources.append(a['href'])
        if tag == 'link' and a.get('rel') == 'canonical':
            self.canonical = a['href']
        if tag == 'h1':
            self.h1 += 1
        if tag == 'title':
            self.in_title = True
        if tag == 'script' and a.get('id') == 'public-state':
            self.in_state = True
        if tag in ('input', 'select') and 'required' in a:
            self.required_fields.append(a.get('name'))

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False
        if tag == 'script':
            self.in_state = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data
        if self.in_state:
            self.state += data


legacy = ROOT / '.public-runtime/legacy-paths.json'
existing = set(json.loads(legacy.read_text())) if legacy.exists() else set()
titles = []
resources = set()
for route in ROUTES:
    path = ROOT / 'docs' / route / 'index.html'
    raw = path.read_text()
    assert '<!--PUBLIC_' not in raw and '__PAGE_' not in raw, (route, 'unfilled placeholder')
    p = Page()
    p.feed(raw)
    assert p.h1 == 1, (route, 'one main heading')
    assert len(p.ids) == len(set(p.ids)), (route, 'duplicate element IDs')
    assert p.canonical == ORIGIN + BASE + route, (route, 'canonical URL')
    assert len(p.title) > 20
    titles.append(p.title)
    state = json.loads(p.state)
    assert state['page'] == (route.rstrip('/') or 'inicio'), (route, 'wrong page state')
    c = state['content']
    assert c['brand']['whatsapp'] == '51952391268'
    assert c['brand']['ruc'] == '10742038551'
    assert c['brand']['group'] == 'Sinteria Group'
    assert [x['price'] for x in c['packages']] == [180, 280, 380]
    assert len(c['gallery']) == 19
    assert all(x['published'] for x in c['packages'] + c['gallery'])
    for link in p.links:
        url = urlsplit(link)
        if link.startswith('#'):
            assert link[1:] in p.ids, (route, link)
            assert link == '#contenido', (route, 'section navigation still present')
            continue
        if url.scheme in ('mailto', 'tel'):
            continue
        if url.netloc and url.netloc != 'sinteriaproducciones.github.io':
            assert url.scheme == 'https', (route, 'insecure external URL')
            continue
        assert url.path.startswith(BASE), (route, link, 'wrong project prefix')
        assert '/admin' not in url.path, 'pending admin must not be published'
        target = ROOT / 'docs' / unquote(url.path[len(BASE):])
        if url.path.endswith('/'):
            target /= 'index.html'
        assert target.is_file(), (route, link, 'missing destination')
    for resource in p.resources:
        url = urlsplit(resource)
        assert not url.netloc, (route, 'unexpected external resource')
        assert url.path.startswith(BASE), (route, resource, 'wrong resource prefix')
        relative = 'docs/' + unquote(url.path[len(BASE):])
        assert (ROOT / relative).is_file() or relative in existing, (route, resource, 'missing media')
        resources.add(relative)
    if not route:
        assert len(p.videos) == 1
        video = p.videos[0]
        assert video['src'] == BASE + 'media/portada-124865.mp4'
        assert all(k in video for k in ['autoplay', 'muted', 'playsinline', 'loop'])
        assert video['poster'] == BASE + 'media/portada-124865.webp'
    else:
        assert not p.videos, (route, 'unnecessary eager video load')
    if route == 'contacto/':
        assert set(['name', 'event', 'district', 'date', 'time', 'accepted']) <= set(p.required_fields)

assert len(set(titles)) == len(ROUTES)
assert (ROOT / 'docs/404.html').is_file()
assert not (ROOT / 'docs/admin').exists()
video = ROOT / 'docs/media/portada-124865.mp4'
data = json.loads(subprocess.check_output(['ffprobe', '-v', 'quiet', '-show_format', '-show_streams', '-of', 'json', str(video)]))
v = next(s for s in data['streams'] if s['codec_type'] == 'video')
assert v['codec_name'] == 'h264' and v['width'] < v['height']
assert abs(float(data['format']['duration']) - 22.366667) < .15, 'video duration changed'
assert any(s['codec_type'] == 'audio' for s in data['streams'])
assert video.stat().st_size < 2_000_000
data_bytes = video.read_bytes()
assert data_bytes.index(b'moov') < data_bytes.index(b'mdat'), 'fast start missing'
print(json.dumps({'passed': True, 'pages': len(ROUTES), 'media_and_script_paths_checked': len(resources), 'video_seconds': data['format']['duration'], 'video_bytes': video.stat().st_size, 'catalog_prices': [180, 280, 380], 'admin': 'pending, absent from public build'}))
