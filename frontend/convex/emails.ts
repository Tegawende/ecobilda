import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// MS Graph API Email Sending
// ============================================

const GRAPH_TOKEN_URL = "https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token";
const GRAPH_SEND_URL = "https://graph.microsoft.com/v1.0/users/{sender}/sendMail";

async function getAccessToken(): Promise<string> {
  const tenantId = process.env.MS_GRAPH_TENANT_ID!;
  const clientId = process.env.MS_GRAPH_CLIENT_ID!;
  const clientSecret = process.env.MS_GRAPH_CLIENT_SECRET!;

  const url = GRAPH_TOKEN_URL.replace("{tenantId}", tenantId);
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`MS Graph token error: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<void> {
  // mailbox = the actual Azure AD user (for the API URL)
  // fromAddress = what the recipient sees (can be an alias)
  const mailbox = process.env.MS_GRAPH_MAILBOX || "admin@ecobilda.org";
  const fromAddress = process.env.DEFAULT_FROM_EMAIL || "noreply@ecobilda.org";
  console.log(`[EMAIL] Sending to ${opts.to} via mailbox ${mailbox} from ${fromAddress}`);
  const token = await getAccessToken();
  console.log(`[EMAIL] Token obtained, sending...`);
  const url = GRAPH_SEND_URL.replace("{sender}", mailbox);

  const payload = {
    message: {
      subject: opts.subject,
      body: { contentType: "html", content: opts.html },
      from: { emailAddress: { address: fromAddress } },
      toRecipients: [{ emailAddress: { address: opts.to } }],
    },
    saveToSentItems: false,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log(`[EMAIL] Response status: ${response.status}`);

    if (!response.ok && response.status !== 202) {
      const error = await response.text();
      console.error(`[EMAIL] FAILED: ${response.status} - ${error}`);
      throw new Error(`MS Graph send error (${response.status}): ${error}`);
    }
    console.log(`[EMAIL] Sent successfully to ${opts.to}`);
  } catch (e: any) {
    console.error(`[EMAIL] Exception: ${e.message}`);
    throw e;
  }
}

// ============================================
// i18n Email Translations
// ============================================

type Locale = "en" | "fr" | "es" | "de" | "nl" | "pt";

const t: Record<string, Record<Locale, string>> = {
  // Common
  greeting: { en: "Hello", fr: "Bonjour", es: "Hola", de: "Hallo", nl: "Hallo", pt: "Ol&aacute;" },
  closing: { en: "See you soon on Ecobilda!", fr: "&Agrave; bient&ocirc;t sur Ecobilda !", es: "&iexcl;Hasta pronto en Ecobilda!", de: "Bis bald auf Ecobilda!", nl: "Tot snel op Ecobilda!", pt: "At&eacute; breve no Ecobilda!" },
  fallback: { en: "If the button doesn't work, copy and paste this link into your browser:", fr: "Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :", es: "Si el bot&oacute;n no funciona, copie y pegue este enlace en su navegador:", de: "Wenn der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:", nl: "Als de knop niet werkt, kopieer en plak deze link in je browser:", pt: "Se o bot&atilde;o n&atilde;o funcionar, copie e cole este link no seu navegador:" },
  footerVisit: { en: "Visit the website", fr: "Visiter le site", es: "Visitar el sitio", de: "Webseite besuchen", nl: "Website bezoeken", pt: "Visitar o site" },
  footerSettings: { en: "Manage my notifications", fr: "G&eacute;rer mes notifications", es: "Gestionar notificaciones", de: "Benachrichtigungen verwalten", nl: "Meldingen beheren", pt: "Gerir notifica&ccedil;&otilde;es" },
  footerRights: { en: "All rights reserved.", fr: "Tous droits r&eacute;serv&eacute;s.", es: "Todos los derechos reservados.", de: "Alle Rechte vorbehalten.", nl: "Alle rechten voorbehouden.", pt: "Todos os direitos reservados." },

  // Verify email
  verifyTitle: { en: "Verify your email address", fr: "V&eacute;rification de votre adresse email", es: "Verifica tu direcci&oacute;n de correo", de: "&Uuml;berpr&uuml;fen Sie Ihre E-Mail-Adresse", nl: "Verifieer je e-mailadres", pt: "Verifique o seu endere&ccedil;o de e-mail" },
  verifyMessage: { en: "Welcome to Ecobilda! To activate your account and start discovering eco-construction and permaculture projects, please confirm your email address.", fr: "Bienvenue sur Ecobilda ! Pour activer votre compte et commencer &agrave; d&eacute;couvrir des projets d'&eacute;co-construction et de permaculture, veuillez confirmer votre adresse email.", es: "&iexcl;Bienvenido a Ecobilda! Para activar su cuenta y comenzar a descubrir proyectos de eco-construcci&oacute;n y permacultura, confirme su direcci&oacute;n de correo.", de: "Willkommen bei Ecobilda! Um Ihr Konto zu aktivieren und &Ouml;ko-Bau- und Permakulturprojekte zu entdecken, best&auml;tigen Sie bitte Ihre E-Mail-Adresse.", nl: "Welkom bij Ecobilda! Om je account te activeren en eco-bouw- en permacultuurprojecten te ontdekken, bevestig je e-mailadres.", pt: "Bem-vindo ao Ecobilda! Para ativar a sua conta e come&ccedil;ar a descobrir projetos de eco-constru&ccedil;&atilde;o e permacultura, confirme o seu endere&ccedil;o de e-mail." },
  verifyButton: { en: "Verify my email", fr: "V&eacute;rifier mon email", es: "Verificar mi correo", de: "E-Mail best&auml;tigen", nl: "E-mail verifi&euml;ren", pt: "Verificar o meu e-mail" },
  verifyInfo: { en: "This link is valid for 48 hours. If you didn't create an account on Ecobilda, you can ignore this email.", fr: "Ce lien est valide pendant 48 heures. Si vous n'avez pas cr&eacute;&eacute; de compte sur Ecobilda, vous pouvez ignorer cet email.", es: "Este enlace es v&aacute;lido durante 48 horas. Si no ha creado una cuenta en Ecobilda, puede ignorar este correo.", de: "Dieser Link ist 48 Stunden g&uuml;ltig. Wenn Sie kein Konto bei Ecobilda erstellt haben, k&ouml;nnen Sie diese E-Mail ignorieren.", nl: "Deze link is 48 uur geldig. Als je geen account bij Ecobilda hebt aangemaakt, kun je deze e-mail negeren.", pt: "Este link &eacute; v&aacute;lido por 48 horas. Se n&atilde;o criou uma conta no Ecobilda, pode ignorar este e-mail." },
  verifySubject: { en: "Verify your email - Ecobilda", fr: "V&eacute;rifiez votre email - Ecobilda", es: "Verifica tu correo - Ecobilda", de: "Best&auml;tigen Sie Ihre E-Mail - Ecobilda", nl: "Verifieer je e-mail - Ecobilda", pt: "Verifique o seu e-mail - Ecobilda" },

  // Password reset
  resetTitle: { en: "Password reset", fr: "R&eacute;initialisation de mot de passe", es: "Restablecimiento de contrase&ntilde;a", de: "Passwort zur&uuml;cksetzen", nl: "Wachtwoord resetten", pt: "Redefini&ccedil;&atilde;o de palavra-passe" },
  resetMessage: { en: "You have requested a password reset on Ecobilda.", fr: "Vous avez demand&eacute; la r&eacute;initialisation de votre mot de passe sur Ecobilda.", es: "Ha solicitado restablecer su contrase&ntilde;a en Ecobilda.", de: "Sie haben eine Passwort-Zur&uuml;cksetzung auf Ecobilda angefordert.", nl: "Je hebt een wachtwoordreset aangevraagd op Ecobilda.", pt: "Solicitou a redefini&ccedil;&atilde;o da sua palavra-passe no Ecobilda." },
  resetButton: { en: "Reset my password", fr: "R&eacute;initialiser mon mot de passe", es: "Restablecer mi contrase&ntilde;a", de: "Passwort zur&uuml;cksetzen", nl: "Wachtwoord resetten", pt: "Redefinir a minha palavra-passe" },
  resetInfo: { en: "This link is valid for 24 hours. If you didn't request this reset, you can ignore this email.", fr: "Ce lien est valide pendant 24 heures. Si vous n'avez pas demand&eacute; cette r&eacute;initialisation, vous pouvez ignorer cet email.", es: "Este enlace es v&aacute;lido durante 24 horas. Si no solicit&oacute; este restablecimiento, puede ignorar este correo.", de: "Dieser Link ist 24 Stunden g&uuml;ltig. Wenn Sie dieses Zur&uuml;cksetzen nicht angefordert haben, k&ouml;nnen Sie diese E-Mail ignorieren.", nl: "Deze link is 24 uur geldig. Als je deze reset niet hebt aangevraagd, kun je deze e-mail negeren.", pt: "Este link &eacute; v&aacute;lido por 24 horas. Se n&atilde;o solicitou esta redefini&ccedil;&atilde;o, pode ignorar este e-mail." },
  resetSubject: { en: "Password reset - Ecobilda", fr: "R&eacute;initialisation de mot de passe - Ecobilda", es: "Restablecimiento de contrase&ntilde;a - Ecobilda", de: "Passwort zur&uuml;cksetzen - Ecobilda", nl: "Wachtwoord resetten - Ecobilda", pt: "Redefini&ccedil;&atilde;o de palavra-passe - Ecobilda" },

  // New message
  msgTitle: { en: "New message", fr: "Nouveau message", es: "Nuevo mensaje", de: "Neue Nachricht", nl: "Nieuw bericht", pt: "Nova mensagem" },
  msgBody: { en: "You received a new message from", fr: "Vous avez re&ccedil;u un nouveau message de", es: "Ha recibido un nuevo mensaje de", de: "Sie haben eine neue Nachricht von", nl: "Je hebt een nieuw bericht ontvangen van", pt: "Recebeu uma nova mensagem de" },
  msgCta: { en: "Click below to read the full message and reply:", fr: "Cliquez ci-dessous pour lire le message complet et r&eacute;pondre :", es: "Haga clic a continuaci&oacute;n para leer el mensaje completo y responder:", de: "Klicken Sie unten, um die vollst&auml;ndige Nachricht zu lesen und zu antworten:", nl: "Klik hieronder om het volledige bericht te lezen en te antwoorden:", pt: "Clique abaixo para ler a mensagem completa e responder:" },
  msgButton: { en: "View conversation", fr: "Voir la conversation", es: "Ver conversaci&oacute;n", de: "Konversation anzeigen", nl: "Gesprek bekijken", pt: "Ver conversa" },
  msgFooter: { en: "This is an automatic notification. You receive this email because you have enabled email notifications on Ecobilda.", fr: "Ceci est une notification automatique. Vous recevez cet email car vous avez activ&eacute; les notifications par email sur Ecobilda.", es: "Esta es una notificaci&oacute;n autom&aacute;tica. Recibe este correo porque ha activado las notificaciones por correo en Ecobilda.", de: "Dies ist eine automatische Benachrichtigung. Sie erhalten diese E-Mail, weil Sie E-Mail-Benachrichtigungen auf Ecobilda aktiviert haben.", nl: "Dit is een automatische melding. Je ontvangt deze e-mail omdat je e-mailmeldingen hebt ingeschakeld op Ecobilda.", pt: "Esta &eacute; uma notifica&ccedil;&atilde;o autom&aacute;tica. Recebe este e-mail porque ativou as notifica&ccedil;&otilde;es por e-mail no Ecobilda." },
  msgSubject: { en: "New message from {name} - Ecobilda", fr: "Nouveau message de {name} - Ecobilda", es: "Nuevo mensaje de {name} - Ecobilda", de: "Neue Nachricht von {name} - Ecobilda", nl: "Nieuw bericht van {name} - Ecobilda", pt: "Nova mensagem de {name} - Ecobilda" },

  // New review
  reviewTitle: { en: "You received a review", fr: "Vous avez re&ccedil;u un avis", es: "Ha recibido una rese&ntilde;a", de: "Sie haben eine Bewertung erhalten", nl: "Je hebt een beoordeling ontvangen", pt: "Recebeu uma avalia&ccedil;&atilde;o" },
  reviewBody: { en: "left you a review on Ecobilda!", fr: "vous a laiss&eacute; un avis sur Ecobilda !", es: "&iexcl;le ha dejado una rese&ntilde;a en Ecobilda!", de: "hat Ihnen eine Bewertung auf Ecobilda hinterlassen!", nl: "heeft een beoordeling voor je achtergelaten op Ecobilda!", pt: "deixou-lhe uma avalia&ccedil;&atilde;o no Ecobilda!" },
  reviewButton: { en: "View my profile", fr: "Voir mon profil", es: "Ver mi perfil", de: "Mein Profil anzeigen", nl: "Mijn profiel bekijken", pt: "Ver o meu perfil" },
  reviewSubject: { en: "New review from {name} - Ecobilda", fr: "Nouvel avis de {name} - Ecobilda", es: "Nueva rese&ntilde;a de {name} - Ecobilda", de: "Neue Bewertung von {name} - Ecobilda", nl: "Nieuwe beoordeling van {name} - Ecobilda", pt: "Nova avalia&ccedil;&atilde;o de {name} - Ecobilda" },

  // Review response
  responseTitle: { en: "Response to your review", fr: "R&eacute;ponse &agrave; votre avis", es: "Respuesta a su rese&ntilde;a", de: "Antwort auf Ihre Bewertung", nl: "Reactie op je beoordeling", pt: "Resposta &agrave; sua avalia&ccedil;&atilde;o" },
  responseBody: { en: "responded to the review you left on Ecobilda.", fr: "a r&eacute;pondu &agrave; l'avis que vous lui avez laiss&eacute; sur Ecobilda.", es: "ha respondido a la rese&ntilde;a que le dej&oacute; en Ecobilda.", de: "hat auf die Bewertung geantwortet, die Sie auf Ecobilda hinterlassen haben.", nl: "heeft gereageerd op de beoordeling die je hebt achtergelaten op Ecobilda.", pt: "respondeu &agrave; avalia&ccedil;&atilde;o que deixou no Ecobilda." },
  responseYourReview: { en: "Your review", fr: "Votre avis", es: "Su rese&ntilde;a", de: "Ihre Bewertung", nl: "Je beoordeling", pt: "A sua avalia&ccedil;&atilde;o" },
  responseTheirResponse: { en: "Their response", fr: "Sa r&eacute;ponse", es: "Su respuesta", de: "Ihre Antwort", nl: "Hun reactie", pt: "A resposta" },
  responseButton: { en: "View profile", fr: "Voir le profil", es: "Ver perfil", de: "Profil anzeigen", nl: "Profiel bekijken", pt: "Ver perfil" },
  responseSubject: { en: "Response to your review - Ecobilda", fr: "R&eacute;ponse &agrave; votre avis - Ecobilda", es: "Respuesta a su rese&ntilde;a - Ecobilda", de: "Antwort auf Ihre Bewertung - Ecobilda", nl: "Reactie op je beoordeling - Ecobilda", pt: "Resposta &agrave; sua avalia&ccedil;&atilde;o - Ecobilda" },

  // Mission completed
  missionCompletedTitle: { en: "Mission completed", fr: "Mission termin&eacute;e", es: "Misi&oacute;n completada", de: "Mission abgeschlossen", nl: "Missie voltooid", pt: "Miss&atilde;o conclu&iacute;da" },
  missionCompletedHostBody: { en: "Your mission has ended. Share a feedback to help others learn from your experience.", fr: "Votre mission est termin&eacute;e. Partagez un retour pour aider les autres &agrave; apprendre de votre exp&eacute;rience.", es: "Su misi&oacute;n ha terminado. Comparta un feedback para ayudar a otros a aprender de su experiencia.", de: "Ihre Mission ist beendet. Teilen Sie ein Feedback, damit andere von Ihrer Erfahrung lernen k&ouml;nnen.", nl: "Je missie is be&euml;indigd. Deel feedback zodat anderen kunnen leren van je ervaring.", pt: "A sua miss&atilde;o terminou. Partilhe um feedback para ajudar outros a aprender com a sua experi&ecirc;ncia." },
  missionCompletedHelperBody: { en: "Your mission has ended. You can now leave a review for the host and upload photos if you wish.", fr: "Votre mission est termin&eacute;e. Vous pouvez maintenant laisser un avis pour l'h&ocirc;te et publier des photos si vous le souhaitez.", es: "Su misi&oacute;n ha terminado. Ahora puede dejar una rese&ntilde;a para el anfitri&oacute;n y subir fotos si lo desea.", de: "Ihre Mission ist beendet. Sie k&ouml;nnen jetzt eine Bewertung f&uuml;r den Gastgeber hinterlassen und Fotos hochladen, wenn Sie m&ouml;chten.", nl: "Je missie is be&euml;indigd. Je kunt nu een beoordeling achterlaten voor de host en foto's uploaden als je dat wilt.", pt: "A sua miss&atilde;o terminou. Pode agora deixar uma avalia&ccedil;&atilde;o para o anfitri&atilde;o e carregar fotos se desejar." },
  missionCompletedHostButton: { en: "Share my feedback", fr: "Partager mon retour", es: "Compartir mi feedback", de: "Feedback teilen", nl: "Feedback delen", pt: "Partilhar o meu feedback" },
  missionCompletedHelperButton: { en: "View mission", fr: "Voir la mission", es: "Ver misi&oacute;n", de: "Mission ansehen", nl: "Missie bekijken", pt: "Ver miss&atilde;o" },
  missionCompletedSubject: { en: "Mission completed: {title} - Ecobilda", fr: "Mission termin&eacute;e : {title} - Ecobilda", es: "Misi&oacute;n completada: {title} - Ecobilda", de: "Mission abgeschlossen: {title} - Ecobilda", nl: "Missie voltooid: {title} - Ecobilda", pt: "Miss&atilde;o conclu&iacute;da: {title} - Ecobilda" },

  // Mission feedback reminder
  feedbackDueTitle: { en: "Don't forget your feedback", fr: "N'oubliez pas votre retour d'exp&eacute;rience", es: "No olvide su feedback", de: "Vergessen Sie Ihr Feedback nicht", nl: "Vergeet je feedback niet", pt: "N&atilde;o se esque&ccedil;a do seu feedback" },
  feedbackDueBody: { en: "It has been a few days since your mission ended. Share what you learned to help future builders.", fr: "Quelques jours se sont &eacute;coul&eacute;s depuis la fin de votre mission. Partagez ce que vous avez appris pour aider les futurs constructeurs.", es: "Han pasado algunos d&iacute;as desde el fin de su misi&oacute;n. Comparta lo aprendido para ayudar a futuros constructores.", de: "Es sind einige Tage vergangen, seit Ihre Mission beendet ist. Teilen Sie, was Sie gelernt haben.", nl: "Er zijn enkele dagen verstreken sinds het einde van je missie. Deel wat je hebt geleerd.", pt: "J&aacute; passaram alguns dias desde o fim da sua miss&atilde;o. Partilhe o que aprendeu." },
  feedbackDueButton: { en: "Share my feedback", fr: "Partager mon retour", es: "Compartir mi feedback", de: "Feedback teilen", nl: "Feedback delen", pt: "Partilhar o meu feedback" },
  feedbackDueSubject: { en: "Share your feedback - Ecobilda", fr: "Partagez votre retour d'exp&eacute;rience - Ecobilda", es: "Comparta su feedback - Ecobilda", de: "Teilen Sie Ihr Feedback - Ecobilda", nl: "Deel je feedback - Ecobilda", pt: "Partilhe o seu feedback - Ecobilda" },
};

function i(key: string, locale: Locale): string {
  return t[key]?.[locale] ?? t[key]?.["en"] ?? key;
}

// ============================================
// HTML Base Template
// ============================================

function baseTemplate(content: string, locale: Locale): string {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>Ecobilda</title>
<style>
:root { color-scheme: light only; }
body { margin:0; padding:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; line-height:1.6; color:#333; background-color:#f1f7f1; }
.email-container { max-width:580px; margin:0 auto; }
.header-td { background-color:#70A771; padding:22px 24px; text-align:center; }
.content-td { padding:32px 28px 24px; background-color:#fff; }
h1 { color:#1a1a1a; font-size:21px; font-weight:700; margin:0 0 18px; line-height:1.3; }
p { color:#444; font-size:15px; margin:0 0 14px; line-height:1.65; }
strong { color:#1a1a1a; }
.button-td { padding:24px 0; text-align:center; }
.button { display:inline-block; background-color:#70A771; color:#fff !important; text-decoration:none !important; padding:14px 32px; border-radius:8px; font-weight:600; font-size:15px; }
.info-box { background-color:#fef9e7; border:1px solid #e8dfa5; border-radius:8px; padding:14px 16px; margin:18px 0; font-size:13px; color:#5a5020; }
.message-box { background-color:#f1f7f1; border-left:4px solid #70A771; padding:14px 18px; margin:18px 0; border-radius:0 8px 8px 0; }
.message-box p { color:#555; font-style:italic; margin:0; font-size:14px; }
.message-box .label { font-style:normal; font-weight:600; color:#6b7280; font-size:11px; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:6px; }
.rating { font-size:18px; font-weight:700; color:#70A771; margin-bottom:6px; }
.text-muted { color:#888; font-size:13px; }
.text-small { font-size:13px; }
.fallback-url { word-break:break-all; color:#70A771; font-size:13px; }
.closing { margin-top:24px; }
.footer-td { padding:18px 28px 22px; text-align:center; background-color:#fff; border-top:1px solid #e2ede2; }
.footer-td p { color:#999; font-size:12px; margin:0 0 6px; }
.footer-td a { color:#70A771; text-decoration:none; }
.footer-links { margin-bottom:10px; }
.footer-links a { font-size:13px; }
.footer-sep { color:#ccc; margin:0 6px; }
@media only screen and (max-width:620px) {
  .email-container { width:100% !important; }
  .content-td { padding:24px 20px 18px !important; }
  .footer-td { padding:16px 20px 20px !important; }
  .button { padding:13px 24px !important; display:block !important; text-align:center !important; }
}
</style>
</head>
<body>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f7f1;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" class="email-container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
<tr><td class="header-td" bgcolor="#70A771" style="background-color:#70A771;padding:22px 24px;text-align:center;">
<img src="https://i.ibb.co/RG91Dq0d/logo-white2.png" alt="Ecobilda" width="180" style="display:inline-block;width:180px;height:auto;">
</td></tr>
<tr><td class="content-td" bgcolor="#ffffff" style="background-color:#fff;padding:32px 28px 24px;">
${content}
</td></tr>
<tr><td class="footer-td" bgcolor="#ffffff" style="background-color:#fff;padding:18px 28px 22px;text-align:center;border-top:1px solid #e2ede2;">
<div class="footer-links">
<a href="${frontendUrl}/${locale}">${i("footerVisit", locale)}</a>
<span class="footer-sep">|</span>
<a href="${frontendUrl}/${locale}/settings">${i("footerSettings", locale)}</a>
</div>
<p>&copy; 2026 Ecobilda. ${i("footerRights", locale)}</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// ============================================
// Email Template Functions
// ============================================

function verifyEmailTemplate(userName: string, verifyUrl: string, locale: Locale): string {
  return baseTemplate(`
<h1>${i("verifyTitle", locale)}</h1>
<p>${i("greeting", locale)} ${userName},</p>
<p>${i("verifyMessage", locale)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr><td align="center" class="button-td">
<a href="${verifyUrl}" class="button">${i("verifyButton", locale)}</a>
</td></tr>
</table>
<div class="info-box">${i("verifyInfo", locale)}</div>
<p class="text-small">${i("fallback", locale)}</p>
<p class="fallback-url">${verifyUrl}</p>
<p class="closing">${i("closing", locale)}</p>
  `, locale);
}

function passwordResetTemplate(userName: string, resetUrl: string, locale: Locale): string {
  return baseTemplate(`
<h1>${i("resetTitle", locale)}</h1>
<p>${i("greeting", locale)} ${userName},</p>
<p>${i("resetMessage", locale)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr><td align="center" class="button-td">
<a href="${resetUrl}" class="button">${i("resetButton", locale)}</a>
</td></tr>
</table>
<div class="info-box">${i("resetInfo", locale)}</div>
<p class="text-small">${i("fallback", locale)}</p>
<p class="fallback-url">${resetUrl}</p>
<p class="closing">${i("closing", locale)}</p>
  `, locale);
}

function newMessageTemplate(receiverName: string, senderName: string, messagePreview: string, conversationUrl: string, locale: Locale): string {
  const preview = messagePreview.length >= 200 ? messagePreview.slice(0, 200) + "..." : messagePreview;
  return baseTemplate(`
<h1>${i("msgTitle", locale)}</h1>
<p>${i("greeting", locale)} ${receiverName},</p>
<p>${i("msgBody", locale)} <strong>${senderName}</strong> sur Ecobilda.</p>
<div class="message-box"><p>${preview}</p></div>
<p>${i("msgCta", locale)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr><td align="center" class="button-td">
<a href="${conversationUrl}" class="button">${i("msgButton", locale)}</a>
</td></tr>
</table>
<p class="text-small">${i("fallback", locale)}</p>
<p class="fallback-url">${conversationUrl}</p>
<p class="closing text-muted">${i("msgFooter", locale)}</p>
  `, locale);
}

function newReviewTemplate(receiverName: string, writerName: string, rating: number, feedback: string, profileUrl: string, locale: Locale): string {
  return baseTemplate(`
<h1>${i("reviewTitle", locale)}</h1>
<p>${i("greeting", locale)} ${receiverName},</p>
<p><strong>${writerName}</strong> ${i("reviewBody", locale)}</p>
<div class="message-box">
<div class="rating">${rating}/5</div>
<p>${feedback}</p>
</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr><td align="center" class="button-td">
<a href="${profileUrl}" class="button">${i("reviewButton", locale)}</a>
</td></tr>
</table>
<p class="text-small">${i("fallback", locale)}</p>
<p class="fallback-url">${profileUrl}</p>
<p class="closing">${i("closing", locale)}</p>
  `, locale);
}

function reviewResponseTemplate(writerName: string, receiverName: string, originalFeedback: string, response: string, profileUrl: string, locale: Locale): string {
  return baseTemplate(`
<h1>${i("responseTitle", locale)}</h1>
<p>${i("greeting", locale)} ${writerName},</p>
<p><strong>${receiverName}</strong> ${i("responseBody", locale)}</p>
<div class="message-box" style="border-left-color:#c5dbca;">
<p class="label">${i("responseYourReview", locale)}</p>
<p>${originalFeedback}</p>
</div>
<div class="message-box">
<p class="label">${i("responseTheirResponse", locale)}</p>
<p>${response}</p>
</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr><td align="center" class="button-td">
<a href="${profileUrl}" class="button">${i("responseButton", locale)}</a>
</td></tr>
</table>
<p class="text-small">${i("fallback", locale)}</p>
<p class="fallback-url">${profileUrl}</p>
<p class="closing">${i("closing", locale)}</p>
  `, locale);
}

function missionCompletedTemplate(recipientName: string, missionTitle: string, missionUrl: string, isHost: boolean, locale: Locale): string {
  const body = isHost ? i("missionCompletedHostBody", locale) : i("missionCompletedHelperBody", locale);
  const button = isHost ? i("missionCompletedHostButton", locale) : i("missionCompletedHelperButton", locale);
  return baseTemplate(`
<h1>${i("missionCompletedTitle", locale)}</h1>
<p>${i("greeting", locale)} ${recipientName},</p>
<p>${body}</p>
<div class="message-box"><p><strong>${missionTitle}</strong></p></div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr><td align="center" class="button-td">
<a href="${missionUrl}" class="button">${button}</a>
</td></tr>
</table>
<p class="text-small">${i("fallback", locale)}</p>
<p class="fallback-url">${missionUrl}</p>
<p class="closing">${i("closing", locale)}</p>
  `, locale);
}

function missionFeedbackDueTemplate(recipientName: string, missionTitle: string, feedbackUrl: string, locale: Locale): string {
  return baseTemplate(`
<h1>${i("feedbackDueTitle", locale)}</h1>
<p>${i("greeting", locale)} ${recipientName},</p>
<p>${i("feedbackDueBody", locale)}</p>
<div class="message-box"><p><strong>${missionTitle}</strong></p></div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr><td align="center" class="button-td">
<a href="${feedbackUrl}" class="button">${i("feedbackDueButton", locale)}</a>
</td></tr>
</table>
<p class="text-small">${i("fallback", locale)}</p>
<p class="fallback-url">${feedbackUrl}</p>
<p class="closing">${i("closing", locale)}</p>
  `, locale);
}

// ============================================
// Exported Actions
// ============================================

export const sendVerificationEmail = internalAction({
  args: { to: v.string(), userName: v.string(), verificationToken: v.string(), locale: v.optional(v.string()) },
  handler: async (_ctx, args) => {
    const locale = (args.locale || "en") as Locale;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const verifyUrl = `${frontendUrl}/${locale}/verify-email/${args.verificationToken}`;
    const html = verifyEmailTemplate(args.userName, verifyUrl, locale);
    await sendEmail({ to: args.to, subject: i("verifySubject", locale), html });
  },
});

export const sendPasswordResetEmail = internalAction({
  args: { to: v.string(), userName: v.string(), resetToken: v.string(), locale: v.optional(v.string()) },
  handler: async (_ctx, args) => {
    const locale = (args.locale || "en") as Locale;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetUrl = `${frontendUrl}/${locale}/reset-password/_/${args.resetToken}`;
    const html = passwordResetTemplate(args.userName, resetUrl, locale);
    await sendEmail({ to: args.to, subject: i("resetSubject", locale), html });
  },
});

export const sendNewMessageEmail = internalAction({
  args: { to: v.string(), receiverName: v.string(), senderName: v.string(), messagePreview: v.string(), conversationId: v.string(), locale: v.optional(v.string()) },
  handler: async (_ctx, args) => {
    const locale = (args.locale || "en") as Locale;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const conversationUrl = `${frontendUrl}/${locale}/messages/${args.conversationId}`;
    const html = newMessageTemplate(args.receiverName, args.senderName, args.messagePreview, conversationUrl, locale);
    await sendEmail({ to: args.to, subject: i("msgSubject", locale).replace("{name}", args.senderName), html });
  },
});

export const sendNewReviewEmail = internalAction({
  args: { to: v.string(), receiverName: v.string(), writerName: v.string(), rating: v.number(), feedback: v.string(), locale: v.optional(v.string()) },
  handler: async (_ctx, args) => {
    const locale = (args.locale || "en") as Locale;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const profileUrl = `${frontendUrl}/${locale}/profile`;
    const html = newReviewTemplate(args.receiverName, args.writerName, args.rating, args.feedback, profileUrl, locale);
    await sendEmail({ to: args.to, subject: i("reviewSubject", locale).replace("{name}", args.writerName), html });
  },
});

export const sendReviewResponseEmail = internalAction({
  args: { to: v.string(), writerName: v.string(), receiverName: v.string(), originalFeedback: v.string(), response: v.string(), locale: v.optional(v.string()) },
  handler: async (_ctx, args) => {
    const locale = (args.locale || "en") as Locale;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const profileUrl = `${frontendUrl}/${locale}/profile`;
    const html = reviewResponseTemplate(args.writerName, args.receiverName, args.originalFeedback, args.response, profileUrl, locale);
    await sendEmail({ to: args.to, subject: i("responseSubject", locale), html });
  },
});

export const sendMissionCompletedEmail = internalAction({
  args: {
    to: v.string(),
    recipientName: v.string(),
    missionTitle: v.string(),
    missionId: v.string(),
    isHost: v.boolean(),
    locale: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const locale = (args.locale || "en") as Locale;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const missionUrl = args.isHost
      ? `${frontendUrl}/${locale}/missions/${args.missionId}/feedback`
      : `${frontendUrl}/${locale}/missions/${args.missionId}`;
    const html = missionCompletedTemplate(
      args.recipientName,
      args.missionTitle,
      missionUrl,
      args.isHost,
      locale
    );
    await sendEmail({
      to: args.to,
      subject: i("missionCompletedSubject", locale).replace("{title}", args.missionTitle),
      html,
    });
  },
});

export const sendMissionFeedbackDueEmail = internalAction({
  args: {
    to: v.string(),
    recipientName: v.string(),
    missionTitle: v.string(),
    missionId: v.string(),
    locale: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const locale = (args.locale || "en") as Locale;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const feedbackUrl = `${frontendUrl}/${locale}/missions/${args.missionId}/feedback`;
    const html = missionFeedbackDueTemplate(
      args.recipientName,
      args.missionTitle,
      feedbackUrl,
      locale
    );
    await sendEmail({ to: args.to, subject: i("feedbackDueSubject", locale), html });
  },
});

// Test action (callable from CLI)
export const sendTestEmail = action({
  args: { to: v.string(), locale: v.optional(v.string()) },
  handler: async (_ctx, args) => {
    const locale = (args.locale || "en") as Locale;
    const html = baseTemplate(`
<h1>Email de test</h1>
<p>${i("greeting", locale)},</p>
<p>Ceci est un email de test envoy&eacute; depuis Ecobilda via Microsoft Graph API.</p>
<p>Si vous recevez cet email, la configuration fonctionne correctement !</p>
<p class="closing">${i("closing", locale)}</p>
    `, locale);
    await sendEmail({ to: args.to, subject: "Test email - Ecobilda", html });
    return { success: true, sentTo: args.to };
  },
});
