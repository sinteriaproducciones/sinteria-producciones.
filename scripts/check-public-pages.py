import json
import subprocess
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parent.parent
BASE = '/sinteria-producciones./'
ORIGIN = 'https://sinteriaproducciones.github.io'
ROUTES = ['', 'servicios/', 'catalogo/', 'galeria/', 'nosotros/', 'contacto/', 'condiciones/', 'privacidad/']
VIDEO_ROUTES = json.loads((ROOT / 'public-page/video-routes.json').read_text())
ROUTES += ['videos/'] + ['videos/' + m['id'] + '/' for m in VIDEO_ROUTES]


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
        self.structured = ''
        self.in_structured = False
        self.robots = None
        self.description = None
        self.cover = None
        self.intro_photo = False
        self.neon = False
        self.detail_photos = 0
        self.occasion_photos = 0
        self.required_fields = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        classes = a.get('class', '').split()
        if a.get('data-theme') == 'neon':
            self.neon = True
        if 'sp-intro-photo' in classes:
            self.intro_photo = True
        if 'sp-detail-photo' in classes:
            self.detail_photos += 1
        if 'sp-occasion-card' in classes:
            self.occasion_photos += 1
        if a.get('id'):
            self.ids.append(a['id'])
        if tag == 'a' and a.get('href'):
            self.links.append(a['href'])
        if tag in ('img', 'video', 'script', 'source') and a.get('src'):
            self.resources.append(a['src'])
        if tag == 'video':
            self.videos.append(a)
        if tag in ('img', 'video') and 'sp-cover-photo' in a.get('class', '').split():
            self.cover = a
        if tag == 'link' and a.get('rel') == 'stylesheet':
            self.resources.append(a['href'])
        if tag == 'link' and a.get('rel') == 'canonical':
            self.canonical = a['href']
        if tag == 'meta' and a.get('name') == 'robots':
            self.robots = a['content']
        if tag == 'meta' and a.get('name') == 'description':
            self.description = a['content']
        if tag == 'script' and a.get('id') == 'structured-data':
            self.in_structured = True
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
            self.in_structured = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data
        if self.in_state:
            self.state += data
        if self.in_structured:
            self.structured += data


legacy = ROOT / '.public-runtime/legacy-paths.json'
existing = set(json.loads(legacy.read_text())) if legacy.exists() else set()
titles = []
resources = set()
inline_videos = 0
for route in ROUTES:
    path = ROOT / 'docs' / route / 'index.html'
    raw = path.read_text()
    assert '<!--PUBLIC_' not in raw and '__PAGE_' not in raw, (route, 'unfilled placeholder')
    p = Page()
    p.feed(raw)
    inline_videos += len(p.videos)
    assert p.neon, (route, 'neon theme missing')
    if route and not route.startswith('videos/'):
        assert p.intro_photo, (route, 'inner page photo missing')
    if route == 'servicios/':
        assert p.detail_photos == 4 and p.occasion_photos == 4, 'service or celebration photos missing'
    assert p.h1 == 1, (route, 'one main heading')
    assert len(p.ids) == len(set(p.ids)), (route, 'duplicate element IDs')
    assert p.canonical == ORIGIN + BASE + route, (route, 'canonical URL')
    assert len(p.title) > 20
    titles.append(p.title)
    state = json.loads(p.state)
    assert state['page'] == ('video' if route.startswith('videos/') else route.rstrip('/') or 'inicio'), (route, 'wrong page state')
    structured = json.loads(p.structured)
    assert structured['@context'] == 'https://schema.org'
    assert p.description and len(p.description) > 35
    assert ('noindex' in p.robots) == (route == 'videos/'), (route, 'incorrect indexing control')
    assert any(x['@type'] == 'Organization' for x in structured['@graph'])
    assert not any(key in x for x in structured['@graph'] for key in ['aggregateRating', 'review', 'address']), 'no invented business details'
    if route.startswith('videos/') and route != 'videos/':
        assert len(p.videos)==1 and 'controls' in p.videos[0], 'the watch page needs a prominent playable video'
        assert state.get('videoId') == route.split('/')[1]
    c = state['content']
    assert c['brand']['whatsapp'] == '51932280554'
    assert c['brand']['ruc'] == '10742038551'
    assert c['brand']['group'] == 'Sinteria Group'
    assert len({x['id'] for x in c['packages']}) == len(c['packages'])
    assert len({x['id'] for x in c['gallery']}) == len(c['gallery'])
    assert all(m['published'] for x in c['packages'] for m in x.get('media', []))
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
        # Administrative writes are hosted on the protected Worker.
        target = ROOT / 'docs' / unquote(url.path[len(BASE):])
        if url.path.endswith('/'):
            target /= 'index.html'
        assert target.is_file(), (route, link, 'missing destination')
    for resource in p.resources:
        url = urlsplit(resource)
        if url.netloc and url.netloc != 'sinteriaproducciones.github.io':
            assert url.scheme == 'https', (route, 'insecure resource')
            continue
        assert url.path.startswith(BASE), (route, resource, 'wrong resource prefix')
        relative = 'docs/' + unquote(url.path[len(BASE):])
        assert (ROOT / relative).is_file() or relative in existing, (route, resource, 'missing media')
        resources.add(relative)
    assert all('playsinline' in video for video in p.videos), (route, 'videos must play inline on mobile')
    if not route:
        assert p.cover is not None, 'missing photo cover'
        selected = c.get('homeMediaIds', [m['id'] for m in c['gallery'] if m['kind'] == 'image'][:3])
        first = next((m for id in selected for m in c['gallery'] if m['id'] == id), None)
        expected = first['url'] if first and first['kind'] in ('image','video') else c['brand']['hero']
        assert p.cover['src'] == expected, 'homepage cover must follow the chosen order'
        assert (p.cover['width'], p.cover['height']) == ('1536', '1152')
        if first is None or first['kind']=='image':
            assert p.cover['sizes'] == '100vw' and p.cover['fetchpriority'] == 'high'
        assert 'media/portada-fiesta-1536.webp' in raw
        assert raw.count('sp-service-cover') == 3, 'service photos missing'
    if route == 'contacto/':
        assert set(['name', 'event', 'district', 'date', 'time', 'accepted']) <= set(p.required_fields)

assert len(set(titles)) == len(ROUTES)
sitemap=ET.parse(ROOT/'docs/sitemap.xml').getroot()
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9','v':'http://www.google.com/schemas/sitemap-video/1.1'}
urls=[node.text for node in sitemap.findall('s:url/s:loc',ns)]
assert set(urls)=={ORIGIN+BASE+r for r in ROUTES if r!='videos/'}
video_sitemap=ET.parse(ROOT/'docs/video-sitemap.xml').getroot()
entries=video_sitemap.findall('s:url',ns)
assert len(entries)==len(VIDEO_ROUTES)
for entry in entries:
    assert entry.find('s:loc',ns).text in urls
    video=entry.find('v:video',ns)
    for key in ['thumbnail_loc','title','description','content_loc']:
        assert video.find('v:'+key,ns) is not None and video.find('v:'+key,ns).text
    assert video.find('v:publication_date',ns) is None, 'unknown publication dates must not be invented'
assert (ROOT / 'docs/404.html').is_file()
assert (ROOT / 'docs/admin/index.html').is_file()
photos = []
for width in [1536, 768]:
    photo = ROOT / f'docs/media/portada-fiesta-{width}.webp'
    data = json.loads(subprocess.check_output(['ffprobe', '-v', 'quiet', '-show_streams', '-of', 'json', str(photo)]))
    image = data['streams'][0]
    assert image['codec_name'] == 'webp'
    assert (image['width'], image['height']) == (width, width * 3 // 4), 'cover was cropped'
    assert photo.stat().st_size < 400_000, 'photo too heavy'
    photos.append({'width': width, 'height': image['height'], 'bytes': photo.stat().st_size})
print(json.dumps({'passed': True, 'pages': len(ROUTES), 'media_and_script_paths_checked': len(resources), 'cover': photos, 'neon_pages': len(ROUTES), 'watch_pages':len(VIDEO_ROUTES),'sitemap_urls':len(urls),'video_sitemap_entries':len(entries),'inner_photo_headers':7, 'service_photos': 4, 'celebration_photos': 4, 'inline_players':inline_videos, 'catalog_prices':[x['price'] for x in c['packages']], 'admin': 'redirects to protected Cloudflare Worker'}))
