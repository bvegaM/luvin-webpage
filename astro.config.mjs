// Sitio de Luvin. Inglés en / y español en /es/.
// Las páginas son estáticas; solo /api/waitlist corre en el servidor (envía los correos).
import { defineConfig, envField } from 'astro/config'
import vercel from '@astrojs/vercel'

export default defineConfig({
  // Cambiar por el dominio real antes de publicar (se usa en las URLs canónicas, de redes y en el correo).
  site: 'https://luvin.dev',
  adapter: vercel(),
  // Variables del formulario (ver .env.example). Se leen al ejecutar, no al compilar.
  env: {
    schema: {
      SMTP_USER: envField.string({ context: 'server', access: 'secret', optional: true }),
      SMTP_PASS: envField.string({ context: 'server', access: 'secret', optional: true }),
      SMTP_HOST: envField.string({ context: 'server', access: 'secret', default: 'smtp.gmail.com' }),
      SMTP_PORT: envField.number({ context: 'server', access: 'secret', default: 465 }),
      WAITLIST_FROM: envField.string({ context: 'server', access: 'secret', optional: true }),
      WAITLIST_FROM_NAME: envField.string({ context: 'server', access: 'secret', default: 'Luvin' }),
      WAITLIST_NOTIFY_TO: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
  i18n: { defaultLocale: 'en', locales: ['en', 'es'], routing: { prefixDefaultLocale: false } },
})
