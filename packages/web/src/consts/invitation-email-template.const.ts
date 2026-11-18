import { INVITATION_EMAIL_SUBJECT } from './mail.const.js'
import { INVITATION_EMAIL_KIND } from '../enums/invitation-email.enum.js'
import type { IInvitationEmailContent } from '../interfaces/mail.interface.js'

/** Gabarit du mail d invitation (F-66), repris de docs/design/ui/happy-hour/mail-invitation.html et .txt. Marqueurs : {{greeting}} {{link}} {{ttl}} {{siteUrl}} {{siteHost}} ; {{preview}} {{eyebrow}} {{intro}} {{body}} {{activation}} {{closing}} viennent de la variante (INVITATION_EMAIL_CONTENT). */
export const INVITATION_EMAIL_HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Votre invitation au CCC</title>
  <style>
    /* Amélioration seulement : les clients qui chargent les polices distantes affichent Gabarito, les autres la pile de secours. */
    @font-face { font-family: 'Gabarito'; font-style: normal; font-weight: 400 900; src: url('{{siteUrl}}/gabarito-latin.woff2') format('woff2'); }
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
    .cta:hover { background-color: #e7b16a !important; }
    @media (max-width: 480px) {
      .px { padding-left: 20px !important; padding-right: 20px !important; }
      .h1 { font-size: 26px !important; line-height: 32px !important; }
      .cta-cell { width: 100% !important; }
      .cta { display: block !important; padding-left: 0 !important; padding-right: 0 !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#0b1e28;" bgcolor="#0b1e28">
  <!-- Texte d'aperçu (affiché par la boîte de réception sous le sujet), masqué dans le corps. -->
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#0b1e28; opacity:0;">
    {{preview}}&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0b1e28" style="background-color:#0b1e28;">
    <tr>
      <td align="center" style="padding:32px 12px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px;">

          <!-- En-tête : logo (PNG hébergé par le site). Images bloquées : l'alt « Cotentin Caps Cup » s'affiche en ambre, gras. -->
          <tr>
            <td class="px" align="left" style="padding:0 32px 24px 32px;">
              <a href="{{siteUrl}}" style="text-decoration:none; color:#e2ac65;">
                <img src="{{siteUrl}}/logo-ccc-email.png" width="141" height="58" alt="Cotentin Caps Cup"
                     style="display:block; border:0; outline:none; text-decoration:none; height:auto; max-width:141px; font-family:'Gabarito','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:22px; font-weight:800; line-height:28px; color:#e2ac65;">
              </a>
            </td>
          </tr>

          <!-- Carte -->
          <tr>
            <td bgcolor="#112631" style="background-color:#112631; border:1px solid #284758; border-radius:16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

                <!-- Liseré ambre, rappel de la capsule -->
                <tr>
                  <td height="6" bgcolor="#e2ac65" style="height:6px; line-height:6px; font-size:6px; background-color:#e2ac65; border-radius:16px 16px 0 0;">&nbsp;</td>
                </tr>

                <tr>
                  <td class="px" style="padding:36px 40px 8px 40px; font-family:'Gabarito','Helvetica Neue',Helvetica,Arial,sans-serif;">
                    <p style="margin:0 0 12px 0; font-size:13px; line-height:18px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; color:#e2ac65;">
                      {{eyebrow}}
                    </p>
                    <h1 class="h1" style="margin:0 0 20px 0; font-size:30px; line-height:36px; font-weight:800; color:#f3eedd;">
                      {{greeting}}
                    </h1>
                    <p style="margin:0 0 16px 0; font-size:17px; line-height:26px; color:#f3eedd;">
                      {{intro}}
                    </p>
                    <p style="margin:0 0 28px 0; font-size:17px; line-height:26px; color:#f3eedd;">
                      {{body}}
                    </p>
                  </td>
                </tr>

{{activation}}
                <!-- Filet + message de sécurité -->
                <tr>
                  <td class="px" style="padding:28px 40px 36px 40px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr><td height="1" bgcolor="#284758" style="height:1px; line-height:1px; font-size:1px; background-color:#284758;">&nbsp;</td></tr>
                      <tr>
                        <td style="padding-top:20px; font-family:'Gabarito','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:14px; line-height:21px; color:#a9c3d1;">
                          {{closing}}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Pied de page : nom du site et adresse, rien d'autre (aucune info légale inventée). -->
          <tr>
            <td class="px" align="center" style="padding:28px 32px 0 32px; font-family:'Gabarito','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:13px; line-height:20px; color:#a9c3d1;">
              <p style="margin:0 0 4px 0; font-weight:700; color:#f3eedd;">Cotentin Caps Cup</p>
              <p style="margin:0;">
                <a href="{{siteUrl}}" style="color:#a9c3d1; text-decoration:underline;">{{siteHost}}</a>
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`

export const INVITATION_EMAIL_TEXT_TEMPLATE = `{{greeting}}

{{intro}}

{{body}}{{activation}}

{{closing}}

--
Cotentin Caps Cup
{{siteUrl}}`


/** Bloc d'activation (bouton, validité, lien brut) : seulement dans les variantes qui portent un lien. Marqueurs : {{link}} {{ttl}}. */
export const INVITATION_EMAIL_HTML_ACTIVATION = `                <!-- Bouton (« bulletproof » : la couleur est sur la cellule, le lien couvre toute la surface). -->
                <tr>
                  <td class="px" align="left" style="padding:0 40px 12px 40px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="cta-cell">
                      <tr>
                        <td align="center" bgcolor="#e2ac65" style="background-color:#e2ac65; border-radius:9999px;">
                          <a class="cta" href="{{link}}"
                             style="display:inline-block; padding:16px 36px; border-radius:9999px; font-family:'Gabarito','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:18px; line-height:24px; font-weight:800; color:#0e242f; text-decoration:none; text-align:center;">
                            Activer mon compte
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Validité -->
                <tr>
                  <td class="px" style="padding:16px 40px 0 40px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td bgcolor="#1c3745" style="background-color:#1c3745; border-left:4px solid #e2ac65; border-radius:8px; padding:14px 18px; font-family:'Gabarito','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:15px; line-height:22px; color:#f3eedd;">
                          Ce lien est valable <strong style="color:#f3eedd;">{{ttl}}&nbsp;jours</strong> et ne peut servir qu'une fois.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Lien brut en secours, en petit -->
                <tr>
                  <td class="px" style="padding:24px 40px 0 40px; font-family:'Gabarito','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:13px; line-height:20px; color:#a9c3d1;">
                    <p style="margin:0 0 4px 0;">Le bouton ne fonctionne pas&nbsp;? Copiez ce lien dans votre navigateur&nbsp;:</p>
                    <p style="margin:0; word-break:break-all;">
                      <a href="{{link}}" style="color:#a9c3d1; text-decoration:underline;">{{link}}</a>
                    </p>
                  </td>
                </tr>
`

/** Suite du corps texte : le « : » prolonge la phrase d'invitation à activer. */
export const INVITATION_EMAIL_TEXT_ACTIVATION = ` :

{{link}}

Ce lien est valable {{ttl}} jours et ne peut servir qu'une fois.`

const INTRO_PREFIX_HTML = `L'organisateur de la <strong style="color:#f3eedd;">Cotentin Caps Cup</strong>`
const ACTIVATION_BODY = 'Activez-le pour définir votre mot de passe, compléter votre profil et retrouver vos résultats et statistiques.'
const ACTIVATION_PREVIEW = 'Activez-le en un clic, le lien est valable {{ttl}} jours.'

/** Textes fixes de chaque variante du mail (F-66 participant, B-31 administrateur et promotion). Seul `introHtml` est inséré tel quel dans le HTML. */
export const INVITATION_EMAIL_CONTENT: Record<INVITATION_EMAIL_KIND, IInvitationEmailContent> = {
  [INVITATION_EMAIL_KIND.PARTICIPANT]: {
    subject: INVITATION_EMAIL_SUBJECT,
    eyebrow: 'Invitation',
    preview: `L'organisateur de la Cotentin Caps Cup vous a créé un compte. ${ACTIVATION_PREVIEW}`,
    introHtml: `${INTRO_PREFIX_HTML} vous a inscrit comme participant&nbsp;: un compte vient de vous être créé sur le site du CCC.`,
    introText: "L'organisateur de la Cotentin Caps Cup vous a inscrit comme participant : un compte vient de vous être créé sur le site du CCC.",
    body: ACTIVATION_BODY,
    closing: "Si vous n'attendiez pas ce message, ignorez-le.",
    withActivation: true
  },
  // Texte validé mot pour mot (Q10) : seule la phrase « vous a inscrit comme participant » change.
  [INVITATION_EMAIL_KIND.ADMIN]: {
    subject: 'Votre accès administrateur à la Cotentin Caps Cup',
    eyebrow: 'Invitation',
    preview: `L'organisateur de la Cotentin Caps Cup vous a donné un accès administrateur. ${ACTIVATION_PREVIEW}`,
    introHtml: `${INTRO_PREFIX_HTML} vous a donné un accès administrateur&nbsp;: un compte vient de vous être créé sur le site du CCC.`,
    introText: "L'organisateur de la Cotentin Caps Cup vous a donné un accès administrateur : un compte vient de vous être créé sur le site du CCC.",
    body: ACTIVATION_BODY,
    closing: "Si vous n'attendiez pas ce message, ignorez-le.",
    withActivation: true
  },
  // Q5 : joueur actif promu. Information seulement, sans lien de connexion (rien à activer).
  [INVITATION_EMAIL_KIND.ADMIN_PROMOTED]: {
    subject: 'Vous êtes maintenant administrateur de la Cotentin Caps Cup',
    eyebrow: 'Information',
    preview: "L'organisateur de la Cotentin Caps Cup a ajouté un accès administrateur à votre compte. Aucune action n'est nécessaire.",
    introHtml: `${INTRO_PREFIX_HTML} a ajouté un accès administrateur à votre compte existant sur le site du CCC.`,
    introText: "L'organisateur de la Cotentin Caps Cup a ajouté un accès administrateur à votre compte existant sur le site du CCC.",
    body: "Aucune action n'est nécessaire : connectez-vous comme d'habitude avec votre adresse email et votre mot de passe. Votre fiche joueur, vos résultats et vos statistiques ne changent pas.",
    closing: "Si vous n'attendiez pas ce message, contactez l'organisateur.",
    withActivation: false
  }
}
