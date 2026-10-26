# Sinteria Producciones

Página pública: https://sinteriaproducciones.github.io/sinteria-producciones./

Panel administrativo: https://sinteria-producciones.genrrytm16.chatgpt.site/admin

El panel está conectado con Cloudflare Workers, D1 y R2 mediante el proyecto Sites existente. Gestiona servicios, personajes, paquetes, catálogos, fotos, clips, promociones, textos, portada, contacto y solicitudes de reserva. La web pública conserva sus ocho páginas y consulta la información centralizada del servidor.

- [Cómo administrar la página y detalles técnicos](PANEL_CLOUDFLARE.md)
- [Resultados de las pruebas](VERIFICACION_CLOUDFLARE.md)

El acceso utiliza el correo sinteria.producciones@gmail.com y la contraseña configurada como secreto del servidor. No hay contraseñas ni tokens administrativos en el repositorio. Cloudflare Access no se utiliza; Workers valida la autenticación y los permisos de cada operación.

## Desarrollo y comprobaciones

```sh
node scripts/restore-assets.mjs
node /root/.codex/plugins/cache/openai-curated-remote/sites/1.1.2/scripts/install-dependencies.mjs
node node_modules/typescript/bin/tsc --noEmit
node scripts/test-site.mjs
node scripts/build-public-page.mjs
python scripts/check-public-pages.py
```

`docs/` contiene la versión pública de GitHub Pages. `app/admin/` contiene el panel; `lib/site-api.ts`, el servidor. Las migraciones de D1 se encuentran en `drizzle/`. La publicación del servidor se realiza con el flujo de Sites y su proyecto existente en `.openai/hosting.json`. Los secretos ADMIN_EMAIL y ADMIN_PASSWORD_HASH se configuran únicamente en el entorno del servidor; PUBLIC_SITE_ORIGIN permite la lectura pública desde GitHub Pages.

Las fotografías y videos originales permanecen disponibles. Las nuevas subidas se guardan en R2 y los cambios de contenido en D1. El PR #1 histórico fue revisado y no se fusionó porque usaba una infraestructura descartada y entraba en conflicto con las mejoras posteriores de la web.
