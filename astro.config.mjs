// Sitio de Luvin. Inglés en / y español en /es/.
// Las páginas son estáticas; solo /api/waitlist corre en el servidor (Cloudflare Workers) y envía los correos.
import { defineConfig, envField } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'

export default defineConfig({
  // Tu dominio real: se usa en las URLs canónicas, en las imágenes para redes y en los enlaces e imágenes del correo.
  site: 'https://luvin.dev',
  // Sin sesiones ni Cloudflare Images: Luvin no los usa y así no hace falta crear recursos extra en Cloudflare.
  adapter: cloudflare({ imageService: 'passthrough' }),
  session: false,
  // Variables del formulario (ver .env.example). Se leen al ejecutar, no al compilar.
  env: {
    schema: {
      SMTP_USER: envField.string({ context: 'server', access: 'secret', optional: true }),
      SMTP_PASS: envField.string({ context: 'server', access: 'secret', optional: true }),
      SMTP_HOST: envField.string({ context: 'server', access: 'secret', optional: true }),
      SMTP_PORT: envField.string({ context: 'server', access: 'secret', optional: true }),
      WAITLIST_FROM: envField.string({ context: 'server', access: 'secret', optional: true }),
      WAITLIST_FROM_NAME: envField.string({ context: 'server', access: 'secret', optional: true }),
      WAITLIST_NOTIFY_TO: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
  i18n: { defaultLocale: 'en', locales: ['en', 'es'], routing: { prefixDefaultLocale: false } },
})
