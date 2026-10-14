# Retomar el panel administrativo de Sinteria Producciones

## Estado guardado

El propietario pidió pausar el trabajo el 14 de octubre de 2026 hasta tener
Supabase. No continuar con la activación mientras no indique que ya tiene su
cuenta. No se creó ni modificó ningún proyecto de Supabase para esta web.

Repositorio correcto: `sinteriaproducciones/sinteria-producciones.`; el punto
final del nombre es intencional. Cuenta GitHub verificada: `sinteriaproducciones`,
correo `sinteriaproducciones@gmail.com`.

El panel está guardado en la rama `admin-supabase-20261013` y en el borrador de
cambios número 1. Código del panel: commit
`4264a3dfb554da22c61421f2b1b38538044bd052`; los commits posteriores de esta pausa
añaden documentación. Consultar siempre la cabeza actual de la rama antes de
guardar nuevos cambios.

La página de clientes permanece publicada en:
https://sinteriaproducciones.github.io/sinteria-producciones./

La rama `main` no recibió el panel. Su versión al guardar esta pausa es
`8f4e1ca02f27bb27f4b61294a1d04805209f9d88`. El acceso `/admin/` todavía no se
publicó ni se verificó. No informar que el panel ya está activo.

## Trabajo terminado

- Panel responsive para catálogos de planes, personajes, combos y shows: fotos,
  descripción, precio, orden y visibilidad.
- Galería de fotos y videos, gestión de archivos y contador de almacenamiento.
- Edición de portada, contacto, WhatsApp, redes y RUC.
- Cliente de Supabase Auth y guardado compartido con protección de conflictos.
- Migración PostgreSQL, datos iniciales y función de servidor para operaciones
  del único propietario autorizado.
- Compilaciones de página y panel; TypeScript sin errores; 36 comprobaciones
  locales de permisos, cuota, revisiones, borradores, formatos y eliminación.

Estas comprobaciones fueron locales y con solicitudes simuladas. Todavía faltan
la prueba de acceso, la subida real y la persistencia en el proyecto de Supabase.

Se conserva la portada Dúo urbano, las fotos existentes, precios S/180, S/280 y
S/380, WhatsApp 952391268, RUC 10742038551 y pertenencia a Sinteria Group.
Mantener la identidad de Producciones y el sitio colorido aprobado.

## Archivos principales

- `app/admin/panel.tsx`, `app/admin/storage-guide.tsx`: interfaz administrativa.
- `lib/admin-api-client.ts`: acceso, renovación y guardado de la sesión.
- `app/public-site.tsx`, `public-page/client.tsx`: lectura del catálogo publicado.
- `public-page/backend-config.json`: URL del proyecto y clave pública; aún vacío.
- `supabase/migrations/20261013_panel.sql`: esquema, permisos y límites atómicos.
- `supabase/seed.sql`, `supabase/legacy-assets.json`: datos y archivos existentes.
- `supabase/functions/sinteria-admin/index.ts` y `supabase/functions/_shared/`:
  autenticación del propietario, validación y operaciones de archivos.
- `panel-build/`: dependencias y compilación independiente para GitHub Pages.
- `scripts/test-panel.mjs`: las 36 comprobaciones aisladas.
- `docs/`: página y panel compilados; configuración todavía sin conexión.

## Activación pendiente cuando el propietario vuelva

1. Verificar que Supabase sea la cuenta elegida por Sinteria Producciones.
   Comprobar organización y coste real antes de crear un proyecto exclusivo en
   plan Free. No contratar planes, tarjetas, pruebas de pago ni ampliaciones.
   No reutilizar ni modificar proyectos de otras actividades de Sinteria.
2. Leer la documentación vigente de Supabase y los archivos actuales de la rama.
   Aplicar la migración y los datos iniciales al proyecto elegido. Verificar
   permisos y datos con consultas reales.
3. Desplegar `sinteria-admin` incluyendo sus tres dependencias de `_shared`.
   Configurar `verify_jwt=false` en la plataforma porque la función valida el
   token y propietario por sí misma para cada operación protegida, mientras
   inicio de sesión y renovación requieren acceso público. Comprobar que esa
   validación funcione después del despliegue.
4. Crear el administrador con `sinteriaproducciones@gmail.com`. El propietario
   introduce o establece su contraseña de forma privada; no guardarla en el
   repositorio, archivos de trabajo ni respuestas. No publicar claves privadas.
5. Completar `public-page/backend-config.json` con la URL real del proyecto y
   una clave pública activa. La compilación copia esa configuración a `docs`.
   La función usa las variables de servidor que proporciona Supabase.
6. Compilar y comprobar acceso, renovación, guardado, fotos, video, límites y
   visibilidad pública con solicitudes reales. Retirar cualquier contenido de
   prueba y conservar precios y materiales del negocio.
7. Guardar cambios en esta rama, revisar y fusionar solo cuando esté operativo.
   Comprobar el despliegue de Pages y abrir la web y el panel publicados.
8. Entregar el enlace verificado y explicar los límites y cómo liberar espacio.

## Límites implementados

Fotos JPG/PNG/WebP de hasta 8 MiB. Videos MP4/WebM de hasta 20 MiB y 60 segundos.
Escala preventiva de 250 MiB, con bloqueo de nuevas subidas antes de rebasar
225 MiB. Máximo 60 catálogos, 150 entradas de galería y 300 archivos.

Los 31 archivos originales de GitHub suman 86,725,303 bytes y se contabilizan
una sola vez. Esos originales no se borran desde el panel. Retirar una foto de
una publicación no elimina el archivo. Para liberar espacio de una subida nueva,
quitar sus referencias, guardar y eliminarla desde Archivos.

Mantener las reservas de subidas con resultado incierto hasta confirmar su
limpieza. Liberarlas antes podría subestimar el espacio y permitir rebasar el
tope. No permitir eliminar archivos todavía usados por catálogos, galería,
portada o borradores. Los archivos subidos usan un bucket público; ocultarlos
del catálogo no vuelve confidencial su URL.

## Compilación y cuidado del repositorio

Instalar las dependencias del `panel-build/package-lock.json` en `panel-build`
y vincular `panel-build/node_modules` como `node_modules` en la raíz. Ejecutar:

```sh
node panel-build/build.mjs
node node_modules/typescript/bin/tsc -p panel-build/tsconfig.json
node scripts/test-panel.mjs
```

La compilación local genera los textos HTML, JS y CSS. Al actualizar el árbol
de GitHub, conservar los archivos binarios existentes en `docs`: fotos, logos,
videos y posters. No reemplazar toda la carpeta remota con una copia local que
no incluya esos materiales. Guardar mediante cambios sobre el árbol remoto y
actualizar la rama con comprobación de su versión actual.

El sitio debe seguir publicado en la cuenta GitHub de Sinteria Producciones.
No trasladarlo a ChatGPT ni a las cuentas de Genrry, Identical o Sinteria
Automatizaciones. Esta pausa no autoriza una activación automática futura:
retomar cuando el propietario indique que ya está listo.
