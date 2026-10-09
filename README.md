# Sinteria Producciones

Publicación actual: web pública estática con catálogo, precios, fotos, videos,
contacto y redes. El panel administrativo queda para una etapa posterior. Perteneciente a Sinteria Group.
Diseño actualizado: fondos claros, fucsia, turquesa, amarillo y morado,
con detalles de carnaval y una composición adaptada a celular y PC.

- WhatsApp: 952391268 (Perú).
- RUC facilitado por el propietario: 10742038551.
- Correo de contacto y acceso al panel:
  sinteria.produciones@gmail.com.
- Cuenta GitHub verificada del propietario: `sinteriaproducciones`.
  El código se guarda en [sinteriaproducciones/sinteria-producciones.](https://github.com/sinteriaproducciones/sinteria-producciones.).
  La cuenta está asociada a sinteriaproducciones@gmail.com.
- Publicación pública autorizada por el propietario en GitHub Pages.
- La carpeta `docs` contiene exclusivamente la web para clientes.
- El panel no forma parte de esta publicación.
- La activación de Pages requiere acceso a la configuración del repositorio.
- Facebook: https://www.facebook.com/share/1C4UkSgPaq/
- TikTok: https://www.tiktok.com/@sinteria.producci
- Material recibido: 9 fotos reales y 10 videos completos publicados;
  4 imágenes promocionales permanecen como borradores. Las fotos de eventos
  conservan sus bytes originales y el formato JPEG real. Los videos se
  optimizaron a MP4 H.264/AAC para la web sin recortarlos.
- La portada inicial es un concepto ilustrativo, identificado en la web.
- Tarifas recuperadas del trabajo previo: S/180, S/280 y S/380 para uno, dos
  y tres personajes. La edición desde un panel se retomará después.
- El adelanto separa la fecha. Cancelación del cliente con más de 72 horas:
  devolución del adelanto. Con 72 horas o menos: adelanto no reembolsable.
  La regla no limita los derechos del consumidor ni las devoluciones por
  cancelación o incumplimiento de Sinteria.

## Código y alojamiento

La versión pública se publica desde `main`, carpeta `/docs`. El contenido y
los archivos multimedia se sirven desde el mismo alojamiento estático;
no necesita ChatGPT, una cuenta de visitante, una API o un panel para abrirse.
El código del servidor y del panel anterior se conserva para la siguiente etapa;
no se ejecuta al publicar `docs`. No se han contratado servicios de pago.

Para que la transferencia no dependa de subir un archivo grande de una vez,
el logo y la imagen de portada originales están conservados sin pérdida en
`source-assets`, divididos en partes. El script verifica su tamaño y SHA-256 y
los reconstruye en `public/assets`. No descarga nada ni modifica las imágenes.
La instalación, el desarrollo y la compilación ejecutan esta restauración.

Preparación desde una descarga nueva del repositorio, con Node.js >= 22.13.0
y pnpm 11.25.0:

```sh
node scripts/restore-assets.mjs
pnpm install --frozen-lockfile
pnpm dev
```

Para compilar: `pnpm build`. Para ejecutar fuera de Sites, hay que configurar
los recursos D1/R2 y los secretos de ejecución por separado. La contraseña,
su hash y las sesiones no se incluyen en el repositorio.

## Página pública estática

`pnpm build:public` genera `docs` a partir de `public-page/snapshot.json`.
Conserva los archivos de `docs/media` durante las compilaciones. La página
no consulta el servidor anterior y no muestra un enlace de Administración.

Las 9 fotos mantienen sus bytes JPEG originales. Los 10 videos están en
MP4 H.264/AAC a 720 píxeles de ancho y conservan su duración completa.
Los carteles de video se cargan antes de reproducir, sin descargar todos
los videos cuando se abre la página.

Preparar el material original extraído de los ZIP, con FFmpeg instalado:

```sh
python scripts/prepare-public-media.py /ruta/a/los/archivos/originales
pnpm build:public
```

El enlace canónico previsto es
`https://sinteriaproducciones.github.io/sinteria-producciones./`.
Ese enlace no debe anunciarse como publicado hasta que Pages indique
una publicación completada y la página responda correctamente.
`PUBLIC_SITE_URL` permite cambiar el enlace canónico al compilar.

Para activar: Settings → Pages → Deploy from a branch → `main` → `/docs` → Save.
GitHub publica los cambios posteriores en esa carpeta. Las condiciones de uso
de Pages incluyen restricciones al alojamiento gratuito comercial:
https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits

## Servidor y panel conservados para la siguiente etapa

## Operación

`/` muestra la web. `/admin` muestra el acceso y el panel. Los cambios se
publican al pulsar Guardar cambios. El contenido se guarda en D1 y los archivos
en R2, y se comparte entre dispositivos. Los borradores ocultos no se incluyen
en el catálogo público. Las imágenes identificables de clientes requieren las
autorizaciones correspondientes.

Los catálogos pueden ser planes, personajes, combos o shows, cada uno con foto,
descripción, precio, lista de incluidos y estado visible u oculto. Los filtros
aparecen cuando hay más de un tipo publicado. La galería carga seis tarjetas
al principio y permite mostrar más; los videos usan una vista previa hasta
que el visitante decide reproducirlos.

El servidor utiliza `ADMIN_EMAIL` y `ADMIN_PASSWORD_HASH` configurados como
valores de ejecución. Nunca incorporar la contraseña al código o al repositorio.
Las sesiones caducan a las ocho horas, se revocan al salir y se guardan como
hashes. Las escrituras requieren sesión y origen de la página.

Las fotos admiten JPG, PNG y WebP, hasta 8 MB. Los clips admiten MP4 y WebM,
hasta 20 MB y 60 segundos. La duración se comprueba en el navegador y en los
metadatos del archivo recibido por el servidor. Para videos largos se admiten
enlaces de YouTube y Shorts, que no ocupan espacio de archivos en esta web.

El panel muestra una escala preventiva de 250 MB y bloquea nuevas subidas y
catálogos al llegar a 225 MB (90 %). Una subida que rebase ese tope se rechaza
antes de guardarse. La reserva de espacio es atómica para que dos subidas
simultáneas no superen el límite. Se cuentan los borradores, fotos de catálogo,
videos, vistas previas y archivos retirados que todavía no se han eliminado.
También se limita a 60 catálogos, 150 entradas de galería y 300 archivos.
Las unidades del panel son MB calculados con 1024 × 1024 bytes.

Los archivos retirados de la galería permanecen en Archivos hasta eliminarlos
expresamente. Para liberar espacio: quitar la foto, video o catálogo que lo
usa, guardar los cambios y eliminar el archivo sin uso en Archivos. Se permite
seguir editando precios, descripciones y publicaciones al llegar al tope.
La guía de espacio y subidas está dentro del panel, en Inicio y Archivos.
Los 33 archivos recibidos, incluidos los diez pósteres, ocupan 115.545.559 bytes,
unos 110,2 MB; el resto de archivos que suba el propietario se sumará a esa cifra.

El formulario de consulta prepara un enlace a WhatsApp con los detalles del
evento; el visitante decide enviar el mensaje. No se crean reservas automáticas
ni se procesan pagos. Las fechas y horas se validan usando America/Lima.

El canal de atención por correo no se presenta como Libro de Reclamaciones.
Para completar un libro formal se requieren datos legales y domicilio del
proveedor, además del flujo correspondiente.

## Validación

`node node_modules/typescript/bin/tsc --noEmit`

`node --experimental-strip-types scripts/test-site.mjs`

Las pruebas utilizan D1 y R2 aislados con Miniflare. Verifican autenticación,
sesiones, protección de escritura, guardado compartido, conflictos de edición,
publicaciones ocultas, validación de enlaces y formatos, subida, rangos de
lectura de medios y eliminación de archivos en uso. La etapa 2 añade pruebas
con archivos MP4 y WebM reales, rechazo de duración y tamaño excesivos, fotos
de catálogo, pósteres, cuota simultánea, bloqueo de catálogos, recuperación de
espacio y liberación de reservas tras un fallo de almacenamiento.

Los videos pequeños de `scripts/fixtures` son colores sólidos generados con
FFmpeg para las pruebas; no son contenido comercial de la galería.

La creación inicial no pudo realizar QA visual de navegador: la capacidad de
control-browser no estaba disponible en el entorno administrado. Se realizaron
comprobación de tipos, pruebas de funciones y compilación de producción.

## Costos

No se contratan servicios, dominio, licencias ni complementos de pago.
Sites está incluido durante la beta hasta los límites del plan actual de ChatGPT.
El tope del panel es un límite preventivo de la aplicación, no una cuota de
alojamiento prometida por la plataforma. Los límites del plan se comparten con
los demás Sites de la cuenta y pueden impedir nuevas subidas o limitar el uso
del sitio antes de llegar a este tope. La web no contrata planes ni amplía cupos
automáticamente al quedarse sin espacio.
No se promete gratuidad perpetua o independencia del plan de ChatGPT.
Fuente: https://help.openai.com/en/articles/20001339-creating-and-using-chatgpt-sites

## Imagen de portada

Generada con la herramienta integrada ImageGen; archivo del proyecto:
`public/assets/fiesta-hero.png`.

Concepto actualizado: máscara de carnaval dorada, plumas fucsia, turquesa,
lila y amarillo, globos, cintas y confeti sobre fondo crema claro. Composición
horizontal con los objetos a la derecha y espacio a la izquierda para el texto;
sin personas, palabras ni logotipos. Sigue identificado como concepto visual.

Prompt usado con la herramienta integrada:

```text
Use case: ads-marketing
Asset type: bright hero artwork for a Peruvian hora loca and event entertainment website.
Primary request: joyful, colorful, polished carnival party artwork that immediately feels like celebration, dance, hora loca and fun.
Scene/backdrop: warm ivory cream studio background, open and very light. A spectacular gold carnival eye mask with fuchsia, turquoise, lilac and sunny yellow feathers, glossy colorful balloons and curled ribbons, playful scattered paper confetti. No people.
Style/medium: premium photographic party still life with a vibrant editorial feel, natural material detail, soft daylight.
Composition/framing: landscape wide 3:2 image. All major party objects form one beautiful arrangement on the RIGHT half, occupying the rightmost 55 percent, while the LEFT half stays cream and mostly empty for dark website headline overlay. Sparse confetti along edges. Fill right side vertically with feathers and balloons. Attractive even cropped on mobile.
Lighting/mood: bright, warm, exuberant and welcoming, high key light, gentle realistic shadows.
Color palette: cream white background with vivid fuchsia, turquoise, purple, sunny yellow and gold accents.
Constraints: no words, no letters, no logos, no watermark, no people or faces. Keep background very light, never black or dark. No technology, neon grids, screens or futuristic imagery.
```
