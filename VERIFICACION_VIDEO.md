# Recorte y reducción de videos

El panel abre un editor antes de subir cualquier video. El archivo original puede superar 20 MB o 60 segundos. El usuario selecciona cualquier fragmento de hasta un minuto, elige calidad y decide si conserva el sonido. Después revisa el resultado y confirma la subida. La información pública se publica al guardar los cambios del panel.

La preparación ocurre en el dispositivo. Se usa conversión mediante WebCodecs cuando está disponible y una alternativa con MediaRecorder y remultiplexado cuando no lo está o falla. Los archivos se preparan en MP4 o WebM según las capacidades del navegador. Se conserva el límite de 20 MB del archivo final en el servidor y se calcula el peso objetivo antes de procesar. Se mantienen la autenticación, la cuota y el almacenamiento de Cloudflare existentes.

## Comprobaciones realizadas

- 15 pruebas de selección de fragmentos, medidas horizontales y verticales, presupuesto de tamaño, calidad, silencio y validación de rangos.
- 93 pruebas funcionales y de seguridad existentes aprobadas.
- Revisión de tipos y compilación del Worker.
- Prueba de navegador con un MP4 original de 72 segundos y 32.781.381 bytes (31,3 MiB). Se seleccionó el fragmento de los segundos 12 a 24.
- Archivo generado en el navegador: WebM de 3.020.063 bytes (2,9 MiB), duración de 12,066 segundos, video VP8 a 1280 × 720 y sonido Opus estéreo a 48 kHz. Los datos se comprobaron con ffprobe y con el mismo lector de duración que usa la API.
- El archivo generado se subió realmente a R2 mediante la API autenticada. El servidor aceptó su tamaño y duración. Se descargó y se verificó su integridad SHA-256. El archivo temporal se eliminó y se cerró la sesión de prueba.
- Vista móvil a 390 px: el contenido no desborda horizontalmente. Se comprobó la selección de calidad y la preparación de un fragmento de dos segundos con la opción sin sonido.

El entorno de vista previa usa HTTP, por lo que se verificó la alternativa de compatibilidad con MediaRecorder. El panel publicado usa HTTPS y puede utilizar WebCodecs si el dispositivo lo admite. No se utilizó un teléfono físico ni se alteraron videos del propietario durante las pruebas. Las páginas de prueba se retiraron antes de la publicación.
