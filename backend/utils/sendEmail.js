const brevo = require('@getbrevo/brevo');

const sendEmail = async (options) => {
  try {
    let defaultClient = brevo.ApiClient.instance;
    let apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    let apiInstance = new brevo.TransactionalEmailsApi();
    let sendSmtpEmail = new brevo.SendSmtpEmail();

    const fromAddress = process.env.EMAIL_FROM || 'RSS Sardar Nagar <[EMAIL_ADDRESS]>';

    let senderName = 'RSS Sardar Nagar';
    let senderEmail = fromAddress;

    const match = fromAddress.match(/(.*)<(.*)>/);
    if (match) {
      senderName = match[1].trim();
      senderEmail = match[2].trim();
    }

    sendSmtpEmail.sender = { name: senderName, email: senderEmail };
    sendSmtpEmail.to = [{ email: options.email }];
    sendSmtpEmail.subject = options.subject;
    sendSmtpEmail.textContent = options.message;

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    return true;
  } catch (error) {
    console.error('Error sending email via Brevo: ', error.response ? error.response.text : error.message);
    return false;
  }
};

module.exports = sendEmail;
