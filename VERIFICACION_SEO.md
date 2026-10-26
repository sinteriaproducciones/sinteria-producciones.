# SEO de Sinteria Producciones

Se conserva la dirección pública de GitHub Pages y el panel protegido en Cloudflare. No se contrató publicidad ni ningún servicio de pago.

## Publicado

- Títulos y descripciones propios para inicio, servicios, catálogos, galería, contacto y páginas informativas. Se incluyen de forma natural hora loca, shows, personajes y Lima sur, que ya figuraban en la web.
- Encabezados visibles de servicios y catálogos más descriptivos. Se conservan las fotografías, los textos de los paquetes, las tarifas y el estilo oscuro/neón.
- Datos estructurados Organization, WebSite, WebPage / CollectionPage / ItemPage, BreadcrumbList y Service / OfferCatalog donde corresponden. Contacto, redes, RUC y precios proceden del contenido centralizado. Sin direcciones, reseñas, valoraciones ni fechas inventadas.
- 11 páginas individuales para los videos publicados, con reproductor HTML visible, título, descripción y enlaces desde la galería. La página genérica videos/ permite abrir también nuevos videos mediante su identificador, sin enlaces rotos; esa página vacía no se indexa.
- sitemap.xml con 19 direcciones canónicas y video-sitemap.xml con 11 videos y sus miniaturas reales. Sin fechas de publicación inventadas ni marcado VideoObject incompleto.
- Metadatos sociales, imágenes de vista previa, idioma es-PE, etiquetas canónicas y controles de indexación. El panel permanece noindex y con autenticación en el servidor.
- El HTML inicial se construye con una captura de la API pública, exclusivamente con contenido publicado. Tras cargar, la misma API actualiza contenido, títulos, canónica y datos estructurados; la web continúa consultando D1 al entrar, al volver a la pestaña y cada 30 segundos.

## Comprobaciones

- 111 pruebas funcionales y de seguridad de D1/R2, incluidas selección del inicio, orden independiente, varios archivos por catálogo, permisos y protección de adjuntos.
- 15 comprobaciones del editor de recorte y reducción de videos.
- TypeScript, compilación de Worker y cliente público.
- Validación del HTML y datos estructurados de 20 páginas, un h1 por página, enlaces internos, recursos, canónicas únicas, reproductores, sitemaps y ausencia de datos privados.
- La ampliación multimedia pasó 11 comprobaciones en producción: inicio de sesión, órdenes, adjuntos, otro visitante, cierre y reapertura de sesión, bloqueo de escritura anónima y conflictos de edición. Se restauró exactamente el contenido previo tras las pruebas.

## Límites y acceso a Google

El robots.txt incluido en el proyecto documenta los mapas del sitio. GitHub Pages publica este proyecto bajo una subcarpeta; los rastreadores solo aplican las reglas robots.txt del origen. El robots.txt del origen devuelve 404, por lo que no hay un bloqueo de rastreo por esa vía. No se afirma controlar el robots.txt de todo github.io.

La captura HTML y las páginas individuales se actualizan al publicar el frontend. Las ediciones posteriores del panel llegan al público y al metadato que procesa JavaScript mediante la API centralizada; un nuevo video usa la página genérica hasta la siguiente compilación. Google puede renderizar JavaScript, pero su rastreo e indexación no son inmediatos ni se garantiza una posición.

Search Console requiere autorizar la cuenta de Google y verificar la propiedad de prefijo de URL https://sinteriaproducciones.github.io/sinteria-producciones./. El conector encontrado consulta estadísticas y no registra propiedades ni envía mapas. No se ha afirmado una verificación, envío o indexación sin confirmación de Google. La web puede ser rastreada sin completar ese registro.

Referencias primarias: documentación de Google Search Central sobre JavaScript SEO, sitemaps, sitemaps de video y buenas prácticas de video; ayuda oficial de Search Console sobre propiedades de prefijo y verificación de propiedad.
