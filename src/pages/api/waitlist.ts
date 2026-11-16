// Recibe el formulario de la lista de espera y envía por SMTP (Gmail por defecto):
//   1. a la persona, un correo de bienvenida con todo sobre Luvin, en el idioma de la página,
//   2. al equipo, un aviso con los datos del formulario.
// Corre en Cloudflare Workers; el resto del sitio es estático. Usa worker-mailer porque nodemailer
// no funciona en Workers. Para cambiar de proveedor SMTP solo cambian las variables.
import type { APIRoute } from 'astro'
import { getSecret } from 'astro:env/server'
import { WorkerMailer } from 'worker-mailer'
import { welcomeEmail, notifyEmail, type Signup } from '../../lib/waitlist-email'

export const prerender = false

const GITHUB_ASSETS = 'https://raw.githubusercontent.com/bvegaM/luvin-webpage/main/public'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const field = (form: FormData, key: string, max: number) => String(form.get(key) ?? '').trim().slice(0, max)

export const POST: APIRoute = async ({ request, site }) => {
  // En Cloudflare los secretos llegan con cada petición, por eso se leen aquí y no al importar.
  const user = getSecret('SMTP_USER')
  const pass = getSecret('SMTP_PASS')?.replace(/\s/g, '') // Google muestra la contraseña de aplicación con espacios
  if (!user || !pass) return json({ ok: false, error: 'not_configured' }, 503)

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return json({ ok: false, error: 'invalid' }, 400)
  }

  // Campo trampa: las personas no lo ven; si viene lleno es un bot. Respondemos ok sin enviar nada.
  if (field(form, 'website', 200)) return json({ ok: true })

  const signup: Signup = {
    name: field(form, 'name', 120),
    email: field(form, 'email', 254).toLowerCase(),
    company: field(form, 'company', 160),
    role: field(form, 'role', 120),
    useCase: field(form, 'useCase', 2000),
    lang: field(form, 'lang', 2) === 'es' ? 'es' : 'en',
  }
  if (!signup.name || !EMAIL_RE.test(signup.email)) return json({ ok: false, error: 'invalid' }, 400)

  const port = Number(getSecret('SMTP_PORT') || 465)
  // Con Gmail el remitente tiene que ser la misma cuenta; solo cambia el nombre visible.
  // WAITLIST_FROM acepta "correo" o "Nombre <correo>".
  const fromRaw = getSecret('WAITLIST_FROM') || user
  const fromMatch = fromRaw.match(/^\s*(.*?)\s*<([^>]+)>\s*$/)
  const from = {
    name: getSecret('WAITLIST_FROM_NAME') || fromMatch?.[1]?.replace(/^"|"$/g, '') || 'Luvin',
    email: fromMatch?.[2] ?? fromRaw.trim(),
  }
  const notifyTo = (getSecret('WAITLIST_NOTIFY_TO') || user).split(',').map((s) => s.trim())
  const origin = new URL(request.url).origin
  const siteUrl = (site ?? origin).toString()
  // Imágenes del correo: desde el mismo sitio que recibió el formulario (existe seguro, sea el dominio o
  // *.workers.dev). En local, Gmail no puede ver localhost, así que se usan las del repo público en GitHub.
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin)
  const assetsUrl = isLocal ? GITHUB_ASSETS : origin

  let mailer: WorkerMailer
  try {
    mailer = await WorkerMailer.connect({
      host: getSecret('SMTP_HOST') || 'smtp.gmail.com',
      port,
      secure: port === 465,
      credentials: { username: user, password: pass },
      authType: ['plain', 'login'],
    })
  } catch (err) {
    console.error('[waitlist] SMTP connection failed', err)
    return json({ ok: false, error: 'send_failed' }, 502)
  }

  try {
    await mailer.send({ from, to: signup.email, reply: notifyTo[0], ...welcomeEmail(signup, siteUrl, assetsUrl) })
  } catch (err) {
    console.error('[waitlist] welcome email failed', err)
    await mailer.close().catch(() => {})
    return json({ ok: false, error: 'send_failed' }, 502)
  }

  // Secundario: si falla, la persona igual recibió su correo.
  try {
    await mailer.send({ from, to: notifyTo, reply: signup.email, ...notifyEmail(signup) })
  } catch (err) {
    console.error('[waitlist] notify email failed', err)
  }
  await mailer.close().catch(() => {})

  return json({ ok: true })
}
