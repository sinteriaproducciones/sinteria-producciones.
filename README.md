# Sinteria Producciones

Web publicada en GitHub Pages:
https://sinteriaproducciones.github.io/sinteria-producciones./

Cuenta y repositorio: sinteriaproducciones / sinteria-producciones.
El punto final del nombre del repositorio es intencional.
WhatsApp: 952391268. RUC: 10742038551. Perteneciente a Sinteria Group.

## Actualización de la página pública · 20 de octubre de 2026

La portada presenta el tercer video que entregó el propietario, 124865.mp4,
completo y optimizado para la web. Se reproduce en vertical, sin recortar el
contenido; el sonido se activa mediante un botón. Incluye pausa, pantalla
completa y respeto por la preferencia de movimiento reducido. Se pausa al salir
de la vista o cambiar de pestaña.

La navegación abre páginas HTML independientes: Inicio, Servicios, Catálogos,
Galería, Nosotros, Contacto, Condiciones y Privacidad. Cada ruta tiene su propia
dirección, título, descripción y URL canónica; funciona al abrirla o recargarla
directamente. El diseño utiliza fondos claros, colores de fiesta y disposición
adaptable para teléfono y PC.

Se conservan las nueve fotos, diez videos anteriores, fotos de los catálogos,
redes oficiales y tarifas iniciales S/180, S/280 y S/380. El nuevo video también
aparece en la galería. Los filtros y la carga progresiva evitan descargar todos
los videos a la vez; los clips de la galería se cargan al abrirlos.

El formulario de Contacto prepara un mensaje de WhatsApp que la persona revisa
y decide enviar. No procesa pagos ni crea reservas automáticamente.

## Panel administrativo: pendiente

El propietario pidió expresamente no continuar el panel en esta actualización.
No se ha conectado Supabase, creado un administrador ni publicado el panel.

Su código y estado anterior siguen guardados en la rama
admin-supabase-20261013 y en el borrador:
https://github.com/sinteriaproducciones/sinteria-producciones./pull/1

Cuando el propietario pida retomarlo, integrar primero los cambios de main
y adaptar la conexión de contenido a las nuevas páginas. No fusionar el
borrador directamente sobre esta actualización ni reemplazar la portada de
video por la foto anterior. No contratar servicios de pago.

## Archivos y compilación pública

La interfaz publicada se encuentra en app/public-pages.tsx y
app/public-pages.css. Las funciones de condiciones, privacidad y visor de
app/public-site.tsx se reutilizan sin cambiar las condiciones acordadas.

public-page/snapshot.json conserva los datos de negocio y los materiales
publicados. public-page/client.tsx activa las interacciones sobre el HTML
prerenderizado. El compilador scripts/build-public-page.mjs genera las ocho
páginas en docs sin vaciar los archivos multimedia existentes.

Las dependencias mínimas y sus versiones están en public-build. Para compilar:

1. Instalar con npm ci --prefix public-build --no-audit --no-fund --ignore-scripts.
2. Si no existe node_modules en la raíz, vincular public-build/node_modules
   como node_modules.
3. Ejecutar node scripts/build-public-page.mjs.
4. Ejecutar node node_modules/typescript/bin/tsc -p public-build/tsconfig.json.
5. Ejecutar python3 scripts/check-public-pages.py; requiere ffprobe.

El script de verificación comprueba rutas, enlaces, recursos, metadatos, campos
del formulario, precios, RUC, WhatsApp, duración del video y ausencia del panel.

## Video de portada

Se generó desde el tercer archivo original, sin nuevas escenas:
docs/media/portada-124865.mp4, H.264/AAC, 480 × 854, 24 fps, 22.38 segundos.
El video pesa 1,431,734 bytes e incluye fast start para empezar a reproducirse
antes de descargarlo por completo. Conserva la pista de audio original
recodificada; el visitante decide cuándo activarla.

El poster docs/media/portada-124865.webp es un fotograma del mismo video.
El original de 86 MB no se duplica en el repositorio.

## Publicación y conservación de materiales

GitHub Pages publica main, carpeta docs. Después de guardar una actualización,
esperar el despliegue automático y verificar la misma URL de la página pública.

Conservar todos los binarios existentes de docs/media y docs/assets al subir
nuevos archivos. El entorno de compilación puede tener solo una parte de esos
materiales; actualizar el árbol del repositorio sin borrar los que ya existen.
No publicar archivos temporales, claves privadas ni contraseñas.

