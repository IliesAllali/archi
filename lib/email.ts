import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM || 'Arbo <noreply@arbo.app>'
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// ─── Email verification ───────────────────────────────────────────────────────

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const link = `${BASE_URL}/api/auth/verify-email?token=${token}`

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Confirmez votre adresse email — Arbo',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h2 style="margin:0 0 8px">Bonjour ${name},</h2>
        <p style="color:#555;margin:0 0 24px">
          Cliquez sur le bouton ci-dessous pour confirmer votre adresse email et accéder à Arbo.
        </p>
        <a href="${link}"
           style="display:inline-block;background:#5E6AD2;color:#fff;text-decoration:none;
                  padding:12px 24px;border-radius:6px;font-weight:600">
          Confirmer mon email
        </a>
        <p style="color:#999;font-size:12px;margin:24px 0 0">
          Ce lien expire dans 24 heures. Si vous n'avez pas créé de compte, ignorez cet email.
        </p>
      </div>
    `,
  })
}

// ─── Password reset ───────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const link = `${BASE_URL}/reset-password?token=${token}`

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Réinitialisation de votre mot de passe — Arbo',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h2 style="margin:0 0 8px">Bonjour ${name},</h2>
        <p style="color:#555;margin:0 0 24px">
          Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous.
        </p>
        <a href="${link}"
           style="display:inline-block;background:#5E6AD2;color:#fff;text-decoration:none;
                  padding:12px 24px;border-radius:6px;font-weight:600">
          Réinitialiser mon mot de passe
        </a>
        <p style="color:#999;font-size:12px;margin:24px 0 0">
          Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.
        </p>
      </div>
    `,
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
    editor: 'éditeur',
    viewer: 'lecteur',
    owner:  'propriétaire',
  }

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `${inviterName} vous invite à collaborer sur "${projectName}" — Arbo`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h2 style="margin:0 0 8px">Vous avez une invitation</h2>
        <p style="color:#555;margin:0 0 24px">
          <strong>${inviterName}</strong> vous invite à rejoindre le projet
          <strong>"${projectName}"</strong> en tant que <strong>${roleLabel[role] || role}</strong>.
        </p>
        <a href="${link}"
           style="display:inline-block;background:#5E6AD2;color:#fff;text-decoration:none;
                  padding:12px 24px;border-radius:6px;font-weight:600">
          Rejoindre le projet
        </a>
        <p style="color:#999;font-size:12px;margin:24px 0 0">
          Ce lien expire dans 24 heures.
        </p>
      </div>
    `,
  })
}
