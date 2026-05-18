const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',            // ✅ CHANGE
      port: 587,                         // ✅ CHANGE
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      requireTLS: true,
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000,
      family: 4,
    });

    const mailOptions = {
      from: `"RSS Sardar Nagar" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending email: ', error);
    return false;
  }
};

module.exports = sendEmail;
