const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.loginAdmin = async (req, res) => {
  // Support both 'username' and 'email' fields from frontend forms
  const emailInput = req.body.email || req.body.username;
  const passwordInput = req.body.password;
  
  try {
    if (!emailInput || !passwordInput) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Normalize and trim email
    const email = emailInput.trim().toLowerCase();

    // Find the user by email AND ensure they have admin privileges
    const admin = await User.findOne({ email, role: 'admin' });
    
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare the provided password against the hashed password in db
    const isMatch = await bcrypt.compare(passwordInput, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Sign the JWT token
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
        role: admin.role
      }
    });

  } catch (error) {
    console.error("❌ Admin Login Error:", error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id).select('-password');
    if (admin && admin.role === 'admin') {
      res.json(admin);
    } else {
      res.status(401).json({ message: 'Not authorized as admin' });
    }
  } catch (error) {
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
      res.json({
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role
      });
    } else {
      res.status(401).json({ message: 'Not authorized as admin' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error updating admin profile' });
  }
};
