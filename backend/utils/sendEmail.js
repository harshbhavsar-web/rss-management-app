const nodemailer = require('nodemailer');

/**
 * Sends an email using either Brevo HTTP API or Gmail SMTP as fallback.
 * @param {Object} options - { email, subject, message, html? }
 * @returns {boolean} true if sent, false otherwise
 */
const sendEmail = async (options) => {
  // --- Primary: Brevo HTTP API ---
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (brevoApiKey) {
    try {
      const fromAddress = process.env.EMAIL_FROM || 'RSS Sardar Nagar <onboarding@brevo.com>';
      let senderName = 'RSS Sardar Nagar';
      let senderEmail = fromAddress;

      const match = fromAddress.match(/(.*)<(.*)>/);
      if (match) {
        senderName = match[1].trim();
        senderEmail = match[2].trim();
      }

      const payload = {
        sender: { name: senderName, email: senderEmail },
        to: [{ email: options.email }],
        subject: options.subject,
        textContent: options.message,
        ...(options.html && { htmlContent: options.html }),
      };

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return true;
      }

      const errorData = await response.json().catch(() => ({}));
      // If key is disabled/invalid, fall through to SMTP fallback
      if (response.status === 401) {
        console.warn('[sendEmail] Brevo API key unauthorized, trying SMTP fallback...');
      } else {
        console.error('[sendEmail] Brevo API error:', response.status, errorData.message || '');
        // Don't fall through for other Brevo errors (e.g., bad recipient)
        return false;
      }
    } catch (err) {
      console.error('[sendEmail] Brevo request failed:', err.message);
      // Fall through to SMTP fallback
    }
  }

  // --- Fallback: Nodemailer SMTP (Gmail or custom SMTP) ---
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);

  if (!smtpUser || !smtpPass) {
    console.error('[sendEmail] No working email provider configured. Set BREVO_API_KEY or SMTP_USER/SMTP_PASS in .env');
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const fromAddress = process.env.EMAIL_FROM || `RSS Sardar Nagar <${smtpUser}>`;
    await transporter.sendMail({
      from: fromAddress,
      to: options.email,
      subject: options.subject,
      text: options.message,
      ...(options.html && { html: options.html }),
    });

    return true;
  } catch (err) {
    console.error('[sendEmail] SMTP fallback failed:', err.message);
    return false;
  }
};

module.exports = sendEmail;
