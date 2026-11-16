# luvin-web

Sitio de Luvin: *Test the chain, not just the call.* Página única en inglés (`/`) y español (`/es/`), hecha con [Astro](https://astro.build) y sin JavaScript de frameworks (solo un script chico para el formulario). Las páginas son estáticas; la única ruta de servidor es `/api/waitlist`, que envía los correos.

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
2. **Lista de espera:** crear `.env` a partir de `.env.example`. Los correos salen por SMTP, por defecto desde una cuenta de Gmail:
   - `SMTP_USER`: tu dirección de Gmail.
   - `SMTP_PASS`: una [contraseña de aplicación](https://myaccount.google.com/apppasswords) de Google (requiere la verificación en 2 pasos), no tu contraseña normal. Sin estas dos variables, el formulario avisa que la lista abre pronto.
   - `WAITLIST_NOTIFY_TO` (opcional): a dónde llega cada registro con todos los datos. Por defecto, la misma cuenta de Gmail.
   - Con dominio propio conviene pasar a un proveedor como Resend o Brevo: basta con poner `SMTP_HOST`, `SMTP_PORT` y `WAITLIST_FROM` (ver `.env.example`), sin tocar código. Gmail admite unos 500 envíos por día.

   Al enviar el formulario, la persona recibe en su idioma un correo con todo sobre Luvin: qué es, el problema, cómo funciona, funciones, para quién es y qué sigue.
3. **Hosting:** está configurado para Vercel (`@astrojs/vercel` en `astro.config.mjs`); hay que cargar las variables del paso 2 en el proyecto de Vercel. Para Netlify o Cloudflare, cambiar el adaptador por `@astrojs/netlify` o `@astrojs/cloudflare`. GitHub Pages no sirve, porque el formulario necesita servidor.
