const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.loginAdmin = async (req, res) => {
  const emailInput = req.body.email || req.body.username;
  const passwordInput = req.body.password;

  try {
    if (!emailInput || !passwordInput) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const email = emailInput.trim().toLowerCase();

    const admin = await User.findOne({ email, role: 'admin' });

    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(passwordInput, admin.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('❌ Admin Login Error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id).select('-password');

    if (admin && admin.role === 'admin') {
      return res.json(admin);
    }

    return res.status(401).json({ message: 'Not authorized as admin' });
  } catch (error) {
    console.error('❌ Get Admin Profile Error:', error);
    res.status(500).json({ message: 'Server error fetching admin profile' });
  }
};

exports.updateAdminProfile = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);

    if (admin && admin.role === 'admin') {
      admin.name = req.body.name || admin.name;

      if (req.body.password) {
        admin.password = await bcrypt.hash(req.body.password, 10);
      }

      await admin.save();

      return res.json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      });
    }

    return res.status(401).json({ message: 'Not authorized as admin' });
  } catch (error) {
    console.error('❌ Update Admin Profile Error:', error);
    res.status(500).json({ message: 'Server error updating admin profile' });
  }
};