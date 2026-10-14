# Sinteria Producciones

Web pública: https://sinteriaproducciones.github.io/sinteria-producciones./

Cuenta verificada GitHub: sinteriaproducciones.
WhatsApp de Producciones: 952391268. RUC: 10742038551.
Perteneciente a Sinteria Group.

## Estado de esta actualización

Panel implementado y compilado. Pendiente conectar Supabase, crear un proyecto
Free, aplicar la migración y validar el acceso real del administrador. Esta rama
no debe fusionarse con main hasta completar esas comprobaciones. La web de
clientes sigue publicada con la versión actual.

## Funciones

Acceso mediante Supabase Auth; escritura reservada al propietario verificado.
Catálogos de planes, personajes, combos y shows con foto, descripción, precio,
incluidos, orden y visibilidad. Galería de fotos, clips y enlaces YouTube/Shorts.
Edición de portada, contacto, redes, RUC y WhatsApp. Guardado compartido entre
dispositivos y control de conflictos entre sesiones.

La portada Dúo urbano y las fotos del catálogo se conservan. Las tarifas iniciales
son S/180, S/280 y S/380. No se procesan pagos ni reservas automáticas.

## Activación

1. Conectar Supabase con la cuenta de Sinteria: sinteriaproducciones@gmail.com,
   verificada en la cuenta GitHub. Elegir exclusivamente un proyecto y una
   organización del plan Free; no activar Pro ni complementos de pago.
2. Aplicar supabase/migrations/20261013_panel.sql y supabase/seed.sql al proyecto
   exclusivo de esta web.
3. Desplegar supabase/functions/sinteria-admin/index.ts con los archivos de
   supabase/functions/_shared. Usar verify_jwt=false en la plataforma: la función
   valida por sí misma el token del propietario para todas las operaciones
   protegidas, además del origen. El endpoint de inicio de sesión es público.
4. Crear el usuario administrador en Supabase Auth. El propietario establece
   su contraseña de forma privada. Desactivar nuevas altas después.
5. Configurar public-page/backend-config.json con projectUrl y la clave pública.
   Nunca publicar service_role ni la contraseña. Las variables privadas de la
   función son las que proporciona Supabase automáticamente.
6. Compilar, probar acceso y subida reales, fusionar con main y verificar Pages.
   El panel quedará en la carpeta admin de la misma web pública.

## Espacio y subidas

Fotos JPG, PNG o WebP: 8 MB. Clips MP4 o WebM: 20 MB y 60 segundos. El servidor
comprueba la duración desde el archivo recibido. El navegador también la revisa.

Escala preventiva de 250 MB; nuevas subidas bloqueadas antes de rebasar 225 MB.
La reserva de espacio es atómica. Las subidas incompletas conservan su reserva
hasta su limpieza, evitando subestimar el uso. Se permiten 60 catálogos,
150 entradas de galería y 300 archivos. MB se calcula con 1024 × 1024 bytes.

Al llegar al tope, se puede seguir editando texto y precios. Para liberar espacio,
retirar el archivo de sus publicaciones, guardar y eliminarlo desde Archivos.
Ocultarlo no elimina el archivo. Los originales alojados en GitHub se conservan
como respaldo y el panel no los elimina del repositorio.

Supabase Free incluye 1 GB de archivos, 500 MB de base de datos y límites de
transferencia. Puede pausarse tras una semana sin actividad y requerir
reactivación desde la cuenta. La aplicación no compra ampliaciones ni cambia
el plan. La escala de 250 MB es preventiva, no una cuota contractual.
Fuente: https://supabase.com/pricing

## Seguridad y comprobaciones

Las sesiones usan el almacenamiento de la pestaña y se cierran tras ocho horas;
al salir se revoca el acceso en Supabase. La contraseña no se publica ni se guarda
en la sesión del navegador. Las tablas privadas y las escrituras no son
accesibles con la clave pública; solo se expone una lectura del contenido publicado.

Para compilar, instalar dependencias en panel-build con npm ci --no-audit
--no-fund --ignore-scripts y vincular sus node_modules a la raíz. Ejecutar:

- node panel-build/build.mjs
- node node_modules/typescript/bin/tsc -p panel-build/tsconfig.json
- node scripts/test-panel.mjs

Las pruebas usan PostgreSQL aislado con PGlite y solicitudes simuladas. Verifican
roles, cuota, formatos, revisiones, borradores y borrado de archivos en uso.
No sustituyen la prueba al proyecto real. El código anterior D1/R2 se conserva
como referencia; esta actualización utiliza Supabase y GitHub Pages.

