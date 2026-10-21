# Sinteria Producciones

Web publicada en GitHub Pages:
https://sinteriaproducciones.github.io/sinteria-producciones./

Cuenta y repositorio: sinteriaproducciones / sinteria-producciones.
El punto final del nombre del repositorio es intencional.
WhatsApp: 952391268. RUC: 10742038551. Perteneciente a Sinteria Group.

## Actualización de la página pública · 21 de octubre de 2026

La portada usa la segunda imagen entregada por el propietario el 20 de octubre:
un grupo de invitados con los dos personajes de pelo rubio y el logo Sinteria.
Se conserva su encuadre completo 4:3, sin reconstruir personas ni usar las
composiciones irreales de las referencias. Se entrega en WebP de 1536 y 768 px
según la pantalla. En teléfono, la foto se muestra completa y el texto aparece
debajo; en PC, el texto se superpone con un degradado para facilitar su lectura.

El estilo neón se aplica a las ocho páginas y a todas sus secciones: fondos
violeta con luces fucsia/cian, tarjetas oscuras con bordes luminosos y texto
claro. La portada aprobada mantiene su foto, encuadre, textos y disposición.
Cada página interna incorpora una cabecera con foto de los materiales
existentes. Las cuatro tarjetas de servicios y las cuatro opciones de
celebración incluyen imágenes; también las secciones de reserva, nosotros,
contacto y preguntas frecuentes. El formulario, los filtros, los visores de
fotos/videos, las condiciones y la privacidad comparten el mismo acabado.
No se generan fotos nuevas ni se usan las capturas de pantalla como contenido.

La navegación conserva las páginas HTML independientes: Inicio, Servicios,
Catálogos, Galería, Nosotros, Contacto, Condiciones y Privacidad. Cada ruta
tiene su dirección, título, descripción y URL canónica y funciona al abrirla
o recargarla directamente.

Se conservan las nueve fotos y diez videos anteriores, las fotos de los
catálogos, redes oficiales y tarifas S/180, S/280 y S/380. La foto nueva también
se puede ampliar desde la galería. El video 124865.mp4 se retiró de la portada
y sigue disponible en la galería junto a los demás clips. La galería reúne
10 fotos y 11 videos y solo descarga los clips al abrirlos.

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
borrador directamente sobre esta actualización ni reemplazar la nueva portada
y el diseño. No contratar servicios de pago.

## Archivos y compilación pública

La interfaz publicada se encuentra en app/public-pages.tsx y
app/public-pages.css, con la portada en app/party-theme.css y el acabado
global en app/neon-world.css. Las funciones de condiciones, privacidad y visor de
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
del formulario, precios, RUC, WhatsApp, fotos de portada, fotos de cada página, acabado neón
global y ausencia del panel.

## Foto de portada y video conservado

La foto recibida como 02-130966.png se convirtió a WebP sin recortar:
- docs/media/portada-fiesta-1536.webp: 1536 × 1152, 319,622 bytes.
- docs/media/portada-fiesta-768.webp: 768 × 576, 131,462 bytes.

El diseño se construye con HTML y CSS; las capturas de referencia no se usan
como sustituto de la página. El logo, textos, enlaces y tarjetas siguen siendo
elementos independientes, accesibles y adaptables.

El clip docs/media/portada-124865.mp4 (H.264/AAC, 480 × 854, 22.38 segundos,
1,431,734 bytes) y su poster permanecen en la galería. El original de 86 MB
no se duplica en el repositorio.

## Publicación y conservación de materiales

GitHub Pages publica main, carpeta docs. Después de guardar una actualización,
esperar el despliegue automático y verificar la misma URL de la página pública.

Conservar todos los binarios existentes de docs/media y docs/assets al subir
nuevos archivos. El entorno de compilación puede tener solo una parte de esos
materiales; actualizar el árbol del repositorio sin borrar los que ya existen.
No publicar archivos temporales, claves privadas ni contraseñas.

