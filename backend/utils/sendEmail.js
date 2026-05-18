const sendEmail = async (options) => {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    const fromAddress = process.env.EMAIL_FROM || 'RSS Sardar Nagar <onboarding@brevo.dev>';

    // Parse the from address (e.g., "RSS Sardar Nagar <email@domain.com>" or just "email@domain.com")
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
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Brevo HTTP API Error:', response.status, errorText);
      return false;
    }

    // Success
    // const data = await response.json();
    return true;
  } catch (error) {
    console.error('Error sending email via Brevo HTTP API: ', error.message);
    return false;
  }
};

module.exports = sendEmail;
