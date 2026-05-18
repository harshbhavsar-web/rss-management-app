const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const allUsers = await User.find({ email: '2403031267003@paruluniversity.ac.in' });
    console.log("Users in DB with this email:", allUsers.map(u => ({ email: u.email, id: u._id, role: u.role, name: u.name })));
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
