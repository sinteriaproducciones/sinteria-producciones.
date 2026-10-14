import json
from pathlib import Path
from urllib.parse import urljoin
root=Path(__file__).resolve().parents[1]
content=json.loads((root/'public-page/snapshot.json').read_text())
manifest=json.loads((root/'supabase/legacy-assets.json').read_text())
base=manifest['base']
content['brand']['hero']=urljoin(base,content['brand']['hero'])
for p in content['packages']:
 if p.get('image'):p['image']=urljoin(base,p['image'])
for m in content['gallery']:
 m['url']=urljoin(base,m['url'])
 if m.get('poster'):m['poster']=urljoin(base,m['poster'])
def literal(v):return "'"+v.replace("'","''")+"'"
statements=['set standard_conforming_strings=on;',"insert into public.sinteria_content(id,payload) values(true,"+literal(json.dumps(content,ensure_ascii=False))+"::jsonb) on conflict(id) do nothing;"]
for item in manifest['tree']:
 name=Path(item['path']).name
 mime='video/mp4' if name.endswith('.mp4') else 'image/png' if name.endswith('.png') else 'image/jpeg'
 fields=[literal('github-'+name),literal(name),literal(mime),str(item['size']),literal(urljoin(base,item['path'][5:])),"'github'","'ready'"]
 statements.append('insert into public.sinteria_assets(id,name,mime,size,url,source,upload_state) values('+','.join(fields)+') on conflict(id) do nothing;')
(root/'supabase/seed.sql').write_text('\n'.join(statements)+'\n')
print(json.dumps({'catalogs':len(content['packages']),'gallery':len(content['gallery']),'legacy_files':len(manifest['tree'])}))

