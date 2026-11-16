# luvin-web

Sitio de Luvin: *Test the chain, not just the call.* Página única en inglés (`/`) y español (`/es/`), hecha con [Astro](https://astro.build) y sin JavaScript de frameworks (solo un script chico para el formulario). Las páginas son estáticas; la única ruta de servidor es `/api/waitlist`, que envía los correos. Se publica en Cloudflare Workers.

## Comandos

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # genera el sitio estático en dist/
npm run preview   # sirve dist/ para revisarlo
```

## Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Textos en inglés y español | `src/i18n/strings.ts` (mismas claves en los dos idiomas) |
| Secciones de la página | `src/components/Landing.astro` |
| Cabecera, pie y etiquetas de SEO/redes | `src/layouts/Base.astro` |
| Colores y estilos | `src/styles/global.css` |
| Logo, teaser, capturas, iconos | `public/` |
| Formulario de la lista de espera (servidor) | `src/pages/api/waitlist.ts` |
| Correo de bienvenida y aviso al equipo | `src/lib/waitlist-email.ts` (usa los textos de `strings.ts`, clave `email`) |

Las imágenes vienen del repo de Luvin: el teaser de `marketing/teaser/`, la animación A→B→C de `docs/readme/` y las capturas de `docs/screenshots/`.

## Antes de publicar

1. **Dominio:** cambiar `site` en `astro.config.mjs` por el dominio real (se usa en las URLs canónicas y en las imágenes para redes).
2. **Lista de espera:** los correos salen por SMTP desde una cuenta de Gmail (con [worker-mailer](https://github.com/zou-yu/worker-mailer), porque nodemailer no funciona en Cloudflare Workers).
   - `SMTP_USER`: la dirección de Gmail. `SMTP_PASS`: una [contraseña de aplicación](https://myaccount.google.com/apppasswords) de Google (requiere verificación en 2 pasos), no la contraseña normal.
   - `WAITLIST_NOTIFY_TO` (opcional): a dónde llega cada registro con todos los datos. Por defecto, la misma cuenta de Gmail.
   - En local: copiar `.dev.vars.example` como `.dev.vars`, completar y reiniciar `npm run dev`.
   - En producción: las mismas variables como *Secrets* en Cloudflare (Workers & Pages → luvin-web → Settings → Variables and Secrets).
   - Sin `SMTP_USER` y `SMTP_PASS`, el formulario avisa que la lista abre pronto.
   - Gmail admite unos 500 envíos por día. Para enviar desde el dominio propio, pasar a un proveedor SMTP como Resend o Brevo cambiando `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` y `WAITLIST_FROM` (ver `.dev.vars.example`), sin tocar código.

   Al enviar el formulario, la persona recibe en su idioma un correo con todo sobre Luvin: qué es, el problema, cómo funciona, funciones, para quién es y qué sigue.
3. **Hosting:** Cloudflare Workers (`@astrojs/cloudflare`, configuración en `wrangler.jsonc`). Para publicar en cada push: en Cloudflare, Workers & Pages → Create → Import a repository → este repo, con *Build command* `npm run build` y *Deploy command* `npx wrangler deploy`. Luego, en Settings → Domains & Routes, agregar el dominio. A mano: `npm run build && npx wrangler deploy`.
