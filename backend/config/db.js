const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    if (
      error.message.includes('Could not connect to any servers') ||
      error.message.includes('whitelist') ||
      error.name === 'MongoServerSelectionError'
    ) {
      console.error('\n=============================================================');
      console.error('📌 MONGODB ATLAS NETWORK ACCESS / IP WHITELIST ISSUE:');
      console.error('1. Log in to MongoDB Atlas: https://cloud.mongodb.com');
      console.error('2. Go to "Network Access" under the Security section in the left sidebar.');
      console.error('3. Click "+ Add IP Address".');
      console.error('4. Click "ALLOW ACCESS FROM ANYWHERE" (0.0.0.0/0) or "ADD CURRENT IP ADDRESS".');
      console.error('5. Click "Confirm" and wait ~1 minute for changes to apply.');
      console.error('=============================================================\n');
    }
    process.exit(1);
  }
};

module.exports = connectDB;

