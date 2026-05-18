const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (options) => {
  try {
    const fromAddress = process.env.EMAIL_FROM || 'RSS Sardar Nagar <onboarding@resend.dev>';

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: options.email,
      subject: options.subject,
      text: options.message,
    });

    if (error) {
      console.error('Resend API Error sending email: ', error.message || error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending email via Resend: ', error.message);
    return false;
  }
};

module.exports = sendEmail;
