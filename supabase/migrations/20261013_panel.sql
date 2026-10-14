create table if not exists public.sinteria_settings (
 id boolean primary key default true check(id),
 owner_id uuid,
 owner_email text not null default 'sinteriaproducciones@gmail.com',
 stop_bytes bigint not null default 235929600,
 max_files integer not null default 300
);
insert into public.sinteria_settings(id) values(true) on conflict do nothing;
create table if not exists public.sinteria_content (
 id boolean primary key default true check(id),
 payload jsonb not null,
 revision bigint not null default 1,
 updated_at timestamptz not null default now()
);
create table if not exists public.sinteria_assets (
 id text primary key,
 name text not null,
 mime text not null,
 size bigint not null check(size > 0),
 url text not null,
 storage_key text unique,
 source text not null check(source in ('github','storage')),
 upload_state text not null check(upload_state in ('uploading','ready','deleting')),
 duration_seconds numeric,
 created_at timestamptz not null default now()
);
alter table public.sinteria_settings enable row level security;
alter table public.sinteria_content enable row level security;
alter table public.sinteria_assets enable row level security;
revoke all on public.sinteria_settings, public.sinteria_content, public.sinteria_assets from anon, authenticated;
grant all on public.sinteria_settings, public.sinteria_content, public.sinteria_assets to service_role;

create or replace function public.sinteria_claim_owner(p_user uuid, p_email text)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare s public.sinteria_settings;
begin
 select * into s from public.sinteria_settings where id=true for update;
 if lower(p_email) <> lower(s.owner_email) then return false; end if;
 if s.owner_id is null then
  update public.sinteria_settings set owner_id=p_user where id=true;
  return true;
 end if;
 return s.owner_id=p_user;
end; $$;

create or replace function public.sinteria_reserve_upload(
 p_id text,p_name text,p_mime text,p_size bigint,p_url text,p_key text,p_duration numeric
) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare s public.sinteria_settings; used bigint; count_files integer;
begin
 select * into s from public.sinteria_settings where id=true for update;
 select coalesce(sum(size),0),count(*) into used,count_files from public.sinteria_assets;
 if p_size <= 0 or p_size > (case when p_mime like 'video/%' then 20971520 else 8388608 end) then
  raise exception 'Máximo 8 MB por foto y 20 MB por video.' using errcode='P0001';
 end if;
 if p_mime not in ('image/jpeg','image/png','image/webp','video/mp4','video/webm') then
  raise exception 'Formato no admitido.' using errcode='P0001';
 end if;
 if p_mime like 'video/%' and (p_duration is null or p_duration <= 0 or p_duration > 60.1) then
  raise exception 'Máximo 60 segundos por video.' using errcode='P0001';
 end if;
 if used+p_size > s.stop_bytes or count_files >= s.max_files then
  raise exception 'Llegaste al límite preventivo de espacio o archivos. Libera archivos sin uso.' using errcode='P0001';
 end if;
 insert into public.sinteria_assets(id,name,mime,size,url,storage_key,source,upload_state,duration_seconds)
 values(p_id,left(p_name,200),p_mime,p_size,p_url,p_key,'storage','uploading',p_duration);
 return jsonb_build_object('id',p_id,'used',used+p_size);
end; $$;

create or replace function public.sinteria_commit_upload(p_id text)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
 update public.sinteria_assets set upload_state='ready' where id=p_id and upload_state='uploading';
 return found;
end; $$;

create or replace function public.sinteria_release_upload(p_id text)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
 perform 1 from public.sinteria_settings where id=true for update;
 delete from public.sinteria_assets where id=p_id and upload_state in ('uploading','deleting') and source='storage';
 return found;
end; $$;

create or replace function public.sinteria_save_content(p_content jsonb,p_revision bigint)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare s public.sinteria_settings; c public.sinteria_content; used bigint; refs text[]; invalid_file boolean;
begin
 select * into s from public.sinteria_settings where id=true for update;
 select * into c from public.sinteria_content where id=true for update;
 if c.revision is distinct from p_revision then
  raise exception 'Otra sesión ya guardó cambios. Actualiza el panel antes de volver a guardar.' using errcode='40001';
 end if;
 if jsonb_typeof(p_content->'packages') <> 'array' or jsonb_typeof(p_content->'gallery') <> 'array' then
  raise exception 'Contenido inválido.' using errcode='P0001';
 end if;
 if jsonb_array_length(p_content->'packages')>60 or jsonb_array_length(p_content->'gallery')>150 or octet_length(p_content::text)>262144 then
  raise exception 'Alcanzaste el límite de catálogos, publicaciones o texto.' using errcode='P0001';
 end if;
 select coalesce(sum(size),0) into used from public.sinteria_assets;
 if used>=s.stop_bytes and jsonb_array_length(p_content->'packages')>jsonb_array_length(c.payload->'packages') then
  raise exception 'Libera espacio antes de añadir otro catálogo. Puedes editar los existentes.' using errcode='P0001';
 end if;
 refs:=array[p_content#>>'{brand,hero}'];
 refs:=refs || array(select p->>'image' from jsonb_array_elements(p_content->'packages') p where coalesce(p->>'image','')<>'');
 refs:=refs || array(select g->>'url' from jsonb_array_elements(p_content->'gallery') g);
 refs:=refs || array(select g->>'poster' from jsonb_array_elements(p_content->'gallery') g where coalesce(g->>'poster','')<>'');
 select exists(select 1 from unnest(refs) ref where
  (exists(select 1 from public.sinteria_assets a where a.url=ref and a.upload_state<>'ready'))
  or (ref like '%/storage/v1/object/public/sinteria-media/%' and
   not exists(select 1 from public.sinteria_assets a where a.url=ref and a.upload_state='ready'))
 ) into invalid_file;
 if invalid_file then raise exception 'Un archivo todavía no está listo.' using errcode='P0001'; end if;
 update public.sinteria_content set payload=p_content,revision=revision+1,updated_at=now() where id=true
 returning * into c;
 return jsonb_build_object('revision',c.revision,'savedAt',c.updated_at);
end; $$;

create or replace function public.sinteria_begin_delete(p_id text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare a public.sinteria_assets; c jsonb; refs text[];
begin
 perform 1 from public.sinteria_settings where id=true for update;
 select * into a from public.sinteria_assets where id=p_id for update;
 if not found then return null; end if;
 if a.source<>'storage' then
  raise exception 'Este es un archivo original conservado en GitHub. Puedes retirarlo del catálogo sin borrarlo.' using errcode='P0001';
 end if;
 if a.upload_state='uploading' and a.created_at>now()-interval '5 minutes' then
  raise exception 'La subida todavía está en curso.' using errcode='P0001';
 end if;
 select payload into c from public.sinteria_content where id=true;
 refs:=array[c#>>'{brand,hero}'];
 refs:=refs || array(select p->>'image' from jsonb_array_elements(c->'packages') p);
 refs:=refs || array(select g->>'url' from jsonb_array_elements(c->'gallery') g);
 refs:=refs || array(select g->>'poster' from jsonb_array_elements(c->'gallery') g);
 if a.url=any(refs) then
  raise exception 'Retira el archivo de la portada, catálogo o galería y guarda primero.' using errcode='P0001';
 end if;
 update public.sinteria_assets set upload_state='deleting' where id=p_id;
 return jsonb_build_object('storage_key',a.storage_key);
end; $$;

create or replace function public.sinteria_public_content()
returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
 select jsonb_build_object(
 'content', jsonb_set(jsonb_set(payload,'{packages}',
  coalesce((select jsonb_agg(p) from jsonb_array_elements(payload->'packages') p where p->'published'='true'::jsonb),'[]'::jsonb)),
 '{gallery}', coalesce((select jsonb_agg(g) from jsonb_array_elements(payload->'gallery') g where g->'published'='true'::jsonb),'[]'::jsonb)),
 'revision',revision) from public.sinteria_content where id=true
$$;

revoke all on function public.sinteria_claim_owner(uuid,text),public.sinteria_reserve_upload(text,text,text,bigint,text,text,numeric),
 public.sinteria_commit_upload(text),public.sinteria_release_upload(text),public.sinteria_save_content(jsonb,bigint),
 public.sinteria_begin_delete(text),public.sinteria_public_content() from public,anon,authenticated;
grant execute on function public.sinteria_claim_owner(uuid,text),public.sinteria_reserve_upload(text,text,text,bigint,text,text,numeric),
 public.sinteria_commit_upload(text),public.sinteria_release_upload(text),public.sinteria_save_content(jsonb,bigint),
 public.sinteria_begin_delete(text) to service_role;
grant execute on function public.sinteria_public_content() to anon,authenticated,service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('sinteria-media','sinteria-media',true,20971520,array['image/jpeg','image/png','image/webp','video/mp4','video/webm'])
on conflict(id) do update set public=true,file_size_limit=20971520,allowed_mime_types=excluded.allowed_mime_types;

