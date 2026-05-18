const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // 👈 ADD
const connectDB = require('./config/db');
const User = require('./models/User'); // 👈 ADD (path check karje)

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

/* ================== 🔥 CREATE ADMIN FUNCTION ================== */
const createAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || "Admin";

    if (!adminEmail || !adminPassword) {
      console.log("⚠️ Missing ADMIN_EMAIL or ADMIN_PASSWORD in .env file. Skipping admin creation.");
      return;
    }

    const adminExists = await User.findOne({ email: adminEmail });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      await User.create({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
      });

      console.log(`✅ Admin (${adminEmail}) created successfully`);
    } else {
      const isMatch = await bcrypt.compare(adminPassword, adminExists.password);
      if (adminExists.role !== 'admin' || !isMatch) {
         adminExists.role = 'admin';
         adminExists.password = await bcrypt.hash(adminPassword, 10);
         await adminExists.save();
         console.log(`✅ Elevated existing user (${adminEmail}) to Admin and synced password.`);
      } else {
         console.log(`⚡ Admin (${adminEmail}) already exists`);
      }
    }
  } catch (error) {
    console.error("❌ Admin creation error:", error);
  }
};
/* ============================================================= */

// Routes
app.use('/api/shakhas', require('./routes/shakhaRoutes'));
app.use('/api/meetings', require('./routes/meetingRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/join', require('./routes/joinRoutes'));
app.use('/api/admin', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));

const PORT = process.env.PORT || 5000;

/* ================== 🔥 SERVER START ================== */
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);

    await createAdmin(); // 👈 ADD (auto admin create)
});
/* ===================================================== */