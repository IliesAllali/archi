import { Resend } from 'resend'

let _resend: Resend | null = null
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}
const FROM = process.env.EMAIL_FROM || 'Arbo <noreply@arbo.app>'
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// ─── Shared layout ──────────────────────────────────────────────────────────

function layout(content: string) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:40px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#ffffff;border-radius:12px;border:1px solid #e5e5e5;overflow:hidden">
        <!-- Header -->
        <tr><td style="padding:28px 32px 0;text-align:center">
          <img src="${BASE_URL}/static/logo-64.png" alt="Arbo" width="32" height="32" style="display:block;margin:0 auto;border-radius:8px" />
          <div style="margin-top:8px;font-size:13px;font-weight:600;color:#18181b;letter-spacing:-0.2px">arbo</div>
        </td></tr>
        <!-- Content -->
        <tr><td style="padding:24px 32px 32px">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:16px 32px;border-top:1px solid #f0f0f0;text-align:center">
          <a href="${BASE_URL}" style="color:#a3a3a3;font-size:11px;text-decoration:none">arbo.patchou.cloud</a>
          <div style="margin-top:4px;font-size:10px;color:#d4d4d4">Visual sitemap builder</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function button(href: string, label: string) {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto 0">
    <tr><td style="background:#F76B15;border-radius:8px">
      <a href="${href}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;letter-spacing:-0.1px">${label}</a>
    </td></tr>
  </table>`
}

// ─── Email verification ───────────────────────────────────────────────────────

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const link = `${BASE_URL}/api/auth/verify-email?token=${token}`

  return getResend().emails.send({
    from: FROM,
    to: email,
    subject: 'Confirmez votre email \u2014 Arbo',
    html: layout(`
      <h2 style="margin:0 0 6px;font-size:17px;font-weight:600;color:#18181b">Bienvenue sur Arbo</h2>
      <p style="margin:0;font-size:13px;color:#737373;line-height:1.5">
        Bonjour ${name}, confirmez votre adresse email pour acc\u00e9der \u00e0 votre compte.
      </p>
      ${button(link, 'Confirmer mon email')}
      <p style="margin:20px 0 0;font-size:11px;color:#a3a3a3;text-align:center;line-height:1.4">
        Ce lien expire dans 24 heures.<br>Si vous n\u2019avez pas cr\u00e9\u00e9 de compte, ignorez cet email.
      </p>
    `),
  })
}

// ─── Password reset ───────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const link = `${BASE_URL}/reset-password?token=${token}`

  return getResend().emails.send({
    from: FROM,
    to: email,
    subject: 'R\u00e9initialisation de mot de passe \u2014 Arbo',
    html: layout(`
      <h2 style="margin:0 0 6px;font-size:17px;font-weight:600;color:#18181b">R\u00e9initialiser votre mot de passe</h2>
      <p style="margin:0;font-size:13px;color:#737373;line-height:1.5">
        Bonjour ${name}, cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
      </p>
      ${button(link, 'R\u00e9initialiser')}
      <p style="margin:20px 0 0;font-size:11px;color:#a3a3a3;text-align:center;line-height:1.4">
        Ce lien expire dans 1 heure.<br>Si vous n\u2019avez pas fait cette demande, ignorez cet email.
      </p>
    `),
  })
}

// ─── Project invitation ───────────────────────────────────────────────────────

export async function sendInvitationEmail(
  email: string,
  inviterName: string,
  projectName: string,
  role: string,
  token: string
) {
  const link = `${BASE_URL}/invite?token=${token}`
  const roleLabel: Record<string, string> = {
    editor: '\u00e9diteur',
    viewer: 'lecteur',
    owner:  'propri\u00e9taire',
  }

  return getResend().emails.send({
    from: FROM,
    to: email,
    subject: `${inviterName} vous invite sur "${projectName}" \u2014 Arbo`,
    html: layout(`
      <h2 style="margin:0 0 6px;font-size:17px;font-weight:600;color:#18181b">Vous avez une invitation</h2>
      <p style="margin:0;font-size:13px;color:#737373;line-height:1.5">
        <strong style="color:#18181b">${inviterName}</strong> vous invite \u00e0 rejoindre
        <strong style="color:#18181b">\u201c${projectName}\u201d</strong> en tant que <strong style="color:#18181b">${roleLabel[role] || role}</strong>.
      </p>
      ${button(link, 'Rejoindre le projet')}
      <p style="margin:20px 0 0;font-size:11px;color:#a3a3a3;text-align:center;line-height:1.4">
        Ce lien expire dans 7 jours.
      </p>
    `),
  })
}
