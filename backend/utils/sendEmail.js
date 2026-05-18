const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465, // Using port 465 for secure connection
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 60000,
      socketTimeout: 60000,
      family: 4, // Prefer IPv4 to avoid ENETUNREACH on Render
    });

    const mailOptions = {
      from: `"RSS Sardar Nagar" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
    };

    // We do not wait for this if we want fire-and-forget, but since this is an async function, 
    // the controller will call it without await.
    const info = await transporter.sendMail(mailOptions);
    // console.log(`Email sent: ${info.messageId}`); // Remove log to clean up production logs
    return true;
  } catch (error) {
    console.error('Error sending email: ', error.message); // Only log the message to avoid huge stack traces
    return false;
  }
};

module.exports = sendEmail;
