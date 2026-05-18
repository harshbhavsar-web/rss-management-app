const axios = require('axios');

const sendSMS = async (phone, message) => {
  try {
    // Ensure phone number format (extract last 10 digits, removing +91 if present)
    const formattedPhone = phone.toString().slice(-10);

    // Fast2SMS API example
    const response = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        route: 'q', // transactional route or quick route
        message: message,
        language: 'english',
        flash: 0,
        numbers: formattedPhone,
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('SMS Sent Successfully: ', response.data);
    return true;
  } catch (error) {
    console.error('Error sending SMS: ', error.response ? JSON.stringify(error.response.data) : error.message);
    return false;
  }
};

module.exports = sendSMS;
