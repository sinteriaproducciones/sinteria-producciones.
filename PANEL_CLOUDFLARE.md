# Administración de Sinteria Producciones

Web pública: https://sinteriaproducciones.github.io/sinteria-producciones./
Panel: https://sinteria-producciones.genrrytm16.chatgpt.site/admin
Administrador: sinteria.producciones@gmail.com

La contraseña se configura únicamente como hash en los secretos del servidor. No se guarda en este repositorio.

## Uso desde el celular

- Abre el panel e ingresa con tu correo y contraseña.
- Desliza el menú de secciones horizontalmente cuando uses un celular.
- En **Catálogos y precios**, abre un catálogo, cambia el precio en soles y pulsa **Guardar cambios**. El tipo **Personaje individual** permite añadir personajes; también hay planes, combos y shows.
- Para cambiar fotos de un catálogo o de la portada, selecciona **Cambiar imagen**, elige la foto y guarda. En **Fotos y videos** puedes subir, titular, ordenar y ocultar publicaciones. Una foto se puede reemplazar desde **Cambiar fotografía**.
- Al seleccionar un video se abre **Recortar y reducir video**. El original puede superar 20 MB o 60 segundos: elige cualquier fragmento de hasta un minuto, ajusta su inicio y final, revisa la selección y pulsa **Recortar y reducir**. Puedes elegir la calidad y quitar el sonido. Revisa el resultado y pulsa **Subir este video**. El archivo original del celular se conserva. Los videos que ya cumplen los límites pueden subirse con **Subir original**. Después pulsa **Guardar cambios** para publicar.
- En **Servicios** puedes editar su nombre, precio, descripción, foto y visibilidad.
- En **Promociones**, elige porcentaje o monto en soles, los catálogos afectados y las fechas opcionales en hora de Lima. Los descuentos activos se aplican al catálogo. Si coinciden varios se usa el mejor precio, sin acumularlos.
- En **Textos e imágenes** puedes buscar textos públicos y reemplazar imágenes de las secciones internas.
- En **Marca y contacto**, cambia la portada, sus títulos, WhatsApp, correo, cobertura y redes.
- Las **Solicitudes de reserva** se guardan al enviar el formulario público. Puedes consultar los datos, añadir notas privadas y cambiar su estado. El formulario no confirma pagos ni separa automáticamente la fecha.
- Para borrar un archivo de R2, quítalo primero de los contenidos que lo usan, guarda y elimínalo desde **Archivos**.

## Infraestructura

Se conserva GitHub Pages y su dirección pública. El frontend consulta `/api/site` del servidor de Sinteria al entrar, al recuperar el foco y cada 30 segundos mientras está visible. Usa `cache: no-store`; los precios se mantienen ocultos hasta obtener la respuesta central y se ofrece reintentar si falla la conexión. No se guardan contenidos ni sesiones administrativas en localStorage.

El proyecto Sites existente aloja el servidor en Cloudflare Workers y conecta D1 (`DB`) y R2 (`BUCKET`). Es infraestructura gestionada por Sites, no una cuenta personal de Cloudflare ni una nueva suscripción contratada. No se configuran planes de pago. Se conserva un límite preventivo de 225 MB para nuevas subidas, 8 MB por foto, 20 MB y 60 segundos por clip; se pueden usar enlaces de YouTube para videos largos.

El panel utiliza la autenticación de correo y contraseña pedida por el propietario, validada en Workers. No utiliza Cloudflare Access. Solo el correo configurado en el secreto del servidor puede iniciar sesión; no existe registro público de administradores. Las sesiones aleatorias duran hasta ocho horas, se guardan como hashes en D1 y usan cookies `HttpOnly`, `Secure` y `SameSite=Lax`. Todas las operaciones administrativas validan sesión en el servidor, y las escrituras comprueban el origen. La contraseña usa PBKDF2 con sal aleatoria. Se limitan los intentos de acceso y el envío de consultas.

Las subidas se reservan atómicamente en D1 y se guardan en R2. Los archivos ocultos solo los puede consultar el administrador. La API rechaza enlaces peligrosos, precios negativos, formatos de archivo incorrectos y revisiones antiguas. La eliminación bloquea archivos utilizados, incluso ante guardados simultáneos.

El PR #1 original contenía una adaptación pendiente a Supabase y estaba en conflicto con las mejoras de las páginas públicas. Se revisó para recuperar el panel y se retomaron sus componentes y controles existentes desde `main`, conservando las mejoras posteriores y utilizando el servidor Cloudflare existente. Esa rama histórica no se fusiona.

## Verificación

- `node scripts/test-site.mjs`: 93 comprobaciones funcionales y de seguridad con D1/R2 locales.
- `node node_modules/typescript/bin/tsc --noEmit`: revisión de tipos.
- `python scripts/check-public-pages.py`: ocho páginas, navegación, medios, portada, cabeceras y diseño neón.
- Compilación del frontend público y del Worker con los helpers de Sites.

Los resultados de producción se registran en `VERIFICACION_CLOUDFLARE.md` después de la publicación.
