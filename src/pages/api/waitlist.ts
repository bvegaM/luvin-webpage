// Recibe el formulario de la lista de espera y envía por SMTP:
//   1. un correo de bienvenida a la persona con todo sobre Luvin,
//   2. un aviso al equipo con los datos del formulario.
// Por defecto usa Gmail; con otro proveedor SMTP (Resend, Brevo...) solo cambian las variables.
// Corre en el servidor; el resto del sitio sigue siendo estático.
import type { APIRoute } from 'astro'
import nodemailer from 'nodemailer'
import { SMTP_USER, SMTP_PASS, SMTP_HOST, SMTP_PORT, WAITLIST_FROM, WAITLIST_FROM_NAME, WAITLIST_NOTIFY_TO } from 'astro:env/server'
import { welcomeEmail, notifyEmail, type Signup } from '../../lib/waitlist-email'

export const prerender = false

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const field = (form: FormData, key: string, max: number) => String(form.get(key) ?? '').trim().slice(0, max)

export const POST: APIRoute = async ({ request, site }) => {
  const user = SMTP_USER
  const pass = SMTP_PASS?.replace(/\s/g, '') // Google la muestra con espacios
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

  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user, pass },
  })
  // Con Gmail el remitente tiene que ser la misma cuenta; solo se puede cambiar el nombre visible.
  const from = { name: WAITLIST_FROM_NAME, address: WAITLIST_FROM || user }
  const notifyTo = WAITLIST_NOTIFY_TO || user
  const siteUrl = (site ?? new URL(request.url).origin).toString()

  try {
    const { images, ...welcome } = welcomeEmail(signup, siteUrl)
    // Las imágenes se leen del propio sitio (public/media/email) y van adjuntas en línea.
    const origin = new URL(request.url).origin
    const attachments = (
      await Promise.all(
        images.map(async ({ cid, path }) => {
          try {
            const res = await fetch(new URL(path, origin))
            if (!res.ok) throw new Error(`${res.status}`)
            return { cid, filename: path.split('/').pop(), content: Buffer.from(await res.arrayBuffer()), contentType: 'image/jpeg' }
          } catch (err) {
            console.error('[waitlist] image not attached', path, err)
            return null
          }
        }),
      )
    ).filter((a) => a !== null)
    await transport.sendMail({ from, to: signup.email, replyTo: notifyTo, ...welcome, attachments })
  } catch (err) {
    console.error('[waitlist] welcome email failed', err)
    return json({ ok: false, error: 'send_failed' }, 502)
  }

  // Secundario: si falla, la persona igual recibió su correo.
  try {
    await transport.sendMail({ from, to: notifyTo, replyTo: signup.email, ...notifyEmail(signup) })
  } catch (err) {
    console.error('[waitlist] notify email failed', err)
  }

  return json({ ok: true })
}
