# Verificación de Cloudflare — Sinteria Producciones

Realizada: 25/10/2026 22:00, hora de Lima.

Servidor publicado: https://sinteria-producciones.genrrytm16.chatgpt.site
Panel: https://sinteria-producciones.genrrytm16.chatgpt.site/admin
Web pública conservada: https://sinteriaproducciones.github.io/sinteria-producciones./

## Resultados

- 93 pruebas locales funcionales y de seguridad aprobadas con D1 y R2.
- 25 comprobaciones aprobadas contra el servidor de producción, con autenticación real.
- Ocho páginas públicas verificadas: navegación, medios, portada, cabeceras e imágenes de servicios y celebraciones.
- Revisión de tipos y compilaciones del frontend público y del Worker aprobadas.
- Inicio de sesión con el correo del propietario y la contraseña solicitada: correcto.
- Cambio temporal del precio de Fiesta en dúo a S/300 y lectura por una solicitud independiente: correcto. Se restauró S/280.
- Subida a R2 de una fotografía original y descarga pública con comprobación de integridad SHA-256: correcta. El archivo temporal fue eliminado después de restaurar la foto original.
- Archivos no publicados privados y bloqueo del borrado de archivos en uso: correcto.
- Registro de solicitud de reserva, lectura administrativa, actualización de estado y notas privadas: correcto. La solicitud técnica fue eliminada.
- Escrituras sin sesión y solicitudes desde un origen ajeno: rechazadas.
- Cierre de sesión e intento de reutilizar la cookie revocada: acceso rechazado.
- Precios y contenido conservados tras cerrar sesión y consultar desde otra solicitud: correcto.
- Contenido real conservado: 3 catálogos, 21 publicaciones de galería y 4 servicios.

Las pruebas de lectura independiente se realizaron mediante clientes HTTP separados. No se utilizó un teléfono físico ni se enviaron mensajes de WhatsApp.

## Acceso e infraestructura

Cloudflare Workers, D1 y R2 se alojan en el proyecto Sites existente. No se contrató un plan de pago ni se configuró una cuenta personal nueva de Cloudflare. La protección del panel usa correo, contraseña y sesiones verificadas por el servidor. Cloudflare Access no está activado.

La web mantiene su dirección de GitHub Pages y consulta la API central al abrir, al recuperar el foco y cada 30 segundos mientras está visible. Los cambios se publican al pulsar Guardar cambios. No se guarda el contenido en localStorage.

Las pruebas temporales se revirtieron. No quedan precios de prueba, reservas técnicas ni subidas temporales en producción.
