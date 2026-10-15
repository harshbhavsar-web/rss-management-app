const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// In-memory OTP attempt tracker (resets on server restart)
const otpAttempts = {};
const OTP_MAX_ATTEMPTS = 5;
const OTP_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

exports.registerUser = async (req, res) => {
  console.log('[registerUser] Route hit');
  const { name, identifier, password } = req.body;

  try {
    if (!identifier) {
      return res.status(400).json({ message: 'Email or phone identifier is required.' });
    }
    const isEmail = identifier.includes('@');
    const query = isEmail ? { email: identifier } : { phone: identifier };

    let userExists = await User.findOne(query);
    if (userExists) {
      if (userExists.isVerified) {
        return res.status(400).json({ message: 'User already exists and is verified. Please log in.' });
      }
      // If user exists but NOT verified, we can overwrite their OTP and let them verify again.
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const otp = generateOTP();
    console.log('[registerUser] OTP generated successfully');
    const otpType = isEmail ? 'email' : 'phone';
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry

    let user;
    if (userExists) {
      userExists.name = name;
      userExists.password = hashedPassword;
      userExists.otp = otp;
      userExists.otpType = otpType;
      userExists.otpExpiry = otpExpiry;
      await userExists.save();
      user = userExists;
    } else {
      const userData = {
        name, password: hashedPassword, otp, otpType, otpExpiry
      };
      if (isEmail) userData.email = identifier;
      else userData.phone = identifier;

      user = new User(userData);
      await user.save();
    }
    console.log(`[registerUser] OTP saved to database for user: ${user._id}`);

    // Send OTP — await to surface real delivery failures
    let sent = false;
    if (otpType === 'email') {
      console.log('[registerUser] Sending OTP email...');
      sent = await sendEmail({
        email: user.email,
        subject: 'RSS Sardar Nagar - Verification OTP',
        message: `Your OTP for RSS Sardar Nagar verification is: ${otp}\n\nThis OTP is valid for 10 minutes. Do not share it with anyone.`,
        html: `<div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#b45309">RSS Sardar Nagar</h2>
          <p>Your email verification OTP is:</p>
          <h1 style="letter-spacing:8px;color:#1f2937;font-size:40px">${otp}</h1>
          <p style="color:#6b7280">This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
        </div>`,
      });
    } else {
      console.log('[registerUser] Sending OTP SMS...');
      const smsMessage = `Welcome to RSS! Your mobile verification OTP is ${otp}. Valid for 10 minutes.`;
      sent = await sendSMS(user.phone, smsMessage).catch(() => false);
    }

    if (!sent) {
      console.error(`[registerUser] Failed to deliver OTP to ${otpType}: ${otpType === 'email' ? user.email : user.phone}`);
      return res.status(500).json({
        message: `Failed to send OTP to your ${otpType}. Please check the address and try again.`,
        userId: user._id,
        sent: false
      });
    }

    res.status(201).json({
      message: `Registration initiated. OTP sent successfully to your ${otpType}.`,
      userId: user._id,
      sent: true
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resendOTP = async (req, res) => {
  console.log('[resendOTP] Route hit');
  const { userId } = req.body;
  try {
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified.' });
    }

    // Rate limit: prevent resend if OTP was sent less than 60 seconds ago
    if (user.otpExpiry) {
      const otpAgeMs = (user.otpExpiry.getTime() - 10 * 60 * 1000) - Date.now() + 10 * 60 * 1000;
      // otpExpiry is set to now + 10min, so (otpExpiry - 10min) is when it was generated
      const generatedAt = user.otpExpiry.getTime() - 10 * 60 * 1000;
      const secondsSinceGenerated = (Date.now() - generatedAt) / 1000;
      if (secondsSinceGenerated < 60) {
        const waitSeconds = Math.ceil(60 - secondsSinceGenerated);
        return res.status(429).json({ message: `Please wait ${waitSeconds} seconds before requesting a new OTP.` });
      }
    }

    const otp = generateOTP();
    console.log('[resendOTP] OTP generated successfully');
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    console.log(`[resendOTP] OTP saved to database for user: ${user._id}`);

    let sent = false;
    if (user.otpType === 'email') {
      console.log('[resendOTP] Sending OTP email...');
      sent = await sendEmail({
        email: user.email,
        subject: 'RSS Sardar Nagar - New Verification OTP',
        message: `Your new OTP for RSS Sardar Nagar verification is: ${otp}\n\nThis OTP is valid for 10 minutes. Do not share it with anyone.`,
        html: `<div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#b45309">RSS Sardar Nagar</h2>
          <p>Your new email verification OTP is:</p>
          <h1 style="letter-spacing:8px;color:#1f2937;font-size:40px">${otp}</h1>
          <p style="color:#6b7280">This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
        </div>`,
      });
    } else {
      console.log('[resendOTP] Sending OTP SMS...');
      sent = await sendSMS(user.phone, `New OTP for RSS verification is ${otp}. Valid 10 mins.`).catch(() => false);
    }

    if (!sent) {
      return res.status(500).json({ message: `Failed to resend OTP. Please try again later.` });
    }

    res.json({ message: 'New OTP sent successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyOTP = async (req, res) => {
  const { userId, otp } = req.body;
  try {
    if (!userId || !otp) {
      return res.status(400).json({ message: 'User ID and OTP are required.' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (user.isVerified) return res.status(400).json({ message: 'User is already verified.' });

    // Check OTP existence
    if (!user.otp) {
      return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
    }

    // Check expiry
    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Track failed attempts (in-memory)
    const key = userId.toString();
    if (!otpAttempts[key]) otpAttempts[key] = { count: 0, resetAt: Date.now() + OTP_WINDOW_MS };
    if (Date.now() > otpAttempts[key].resetAt) otpAttempts[key] = { count: 0, resetAt: Date.now() + OTP_WINDOW_MS };

    if (otpAttempts[key].count >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ message: 'Too many incorrect OTP attempts. Please request a new OTP.' });
    }

    if (user.otp !== otp) {
      otpAttempts[key].count += 1;
      const remaining = OTP_MAX_ATTEMPTS - otpAttempts[key].count;
      return res.status(400).json({ message: `Invalid OTP. ${remaining} attempt(s) remaining.` });
    }

    // OTP is correct — mark verified and clear OTP fields to prevent reuse
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Clean up attempt tracker
    delete otpAttempts[key];

    res.json({ message: 'Verified successfully.', isVerified: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.loginUser = async (req, res) => {
  const { identifier, password } = req.body;

  try {
    let user;
    if (identifier.includes('@')) {
      user = await User.findOne({ email: identifier });
    } else {
      user = await User.findOne({ phone: identifier });
    }

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // Removed isVerified check to allow seamless login if credentials are correct

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        shakha: user.shakha,
        hasJoinRequest: user.hasJoinRequest
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  console.log('[forgotPassword] Route hit');
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No user registered with this email address.' });
    }

    const otp = generateOTP();
    console.log('[forgotPassword] OTP generated successfully');
    user.resetOtp = otp;
    user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry
    await user.save();
    console.log(`[forgotPassword] OTP saved to database for user: ${user._id}`);

    console.log('[forgotPassword] Sending password reset OTP email...');
    const sent = await sendEmail({
      email: user.email,
      subject: 'RSS Sardar Nagar - Password Reset OTP',
      message: `Your OTP to reset password is: ${otp}\n\nIt is valid for 10 minutes. Do not share it with anyone.`,
      html: `<div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#b45309">RSS Sardar Nagar</h2>
        <p>Your password reset OTP is:</p>
        <h1 style="letter-spacing:8px;color:#1f2937;font-size:40px">${otp}</h1>
        <p style="color:#6b7280">This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <p style="color:#9ca3af;font-size:12px">If you did not request this, please ignore this email.</p>
      </div>`,
    });

    if (!sent) {
      return res.status(500).json({ message: 'Failed to send password reset OTP. Please try again.' });
    }

    res.json({ message: 'Password reset OTP sent to your email.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required.' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!user.resetOtp || user.resetOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    if (user.resetOtpExpiry < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    user.isVerified = true; // Ensure user is verified after password reset
    await user.save();

    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').populate('shakha');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = req.body.name || user.name;

    if (req.body.profilePhoto !== undefined) {
      user.profilePhoto = req.body.profilePhoto;
    }

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedUser = await user.save();
    const populatedUser = await User.findById(updatedUser._id).select('-password').populate('shakha');
    res.json(populatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.onboardUser = async (req, res) => {
  const { shakhaId } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (shakhaId && shakhaId !== 'other') {
      user.shakha = shakhaId;
      await user.save();
    }

    // For "other", we do nothing on the User model here because 
    // the frontend will redirect them to the Join form, 
    // where submission updates the user.

    res.json({ message: 'Onboarding completed', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    let query = {};
    if (req.user && req.user.role !== 'admin') {
      if (!req.user.shakha) {
        return res.json([]);
      }
      query = { shakha: req.user.shakha };
    }
    const users = await User.find(query).select('-password -otp -resetOtp').populate('shakha', 'name location');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateUserAdmin = async (req, res) => {
  try {
    const { nagar, role, shakha } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const finalRole = role !== undefined ? role : user.role;
    const finalShakha = shakha !== undefined ? (shakha === '' ? null : shakha) : user.shakha;

    if ((finalRole === 'karyvah' || finalRole === 'mukhya_shikshak') && !finalShakha) {
      return res.status(400).json({ message: 'Shakha assignment is mandatory for Karyvah and Mukhya Shikshak roles.' });
    }

    if (nagar !== undefined) user.nagar = nagar;
    if (role !== undefined) user.role = role;
    if (shakha !== undefined) user.shakha = shakha === '' ? null : shakha;

    const updatedUser = await user.save();
    const populatedUser = await User.findById(updatedUser._id).select('-password -otp -resetOtp').populate('shakha', 'name location');
    res.json(populatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
