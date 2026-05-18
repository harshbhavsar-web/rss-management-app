const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.registerUser = async (req, res) => {
  const { name, identifier, password } = req.body;

  try {
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
    const otpType = isEmail ? 'email' : 'phone';
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry
    
    console.log(`[DEBUG] Generated New OTP - ${otpType}: ${otp}`);

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

    // Send OTP
    let sent = false;
    if (otpType === 'email') {
      sent = await sendEmail({
        email: user.email,
        subject: 'RSS Sardar Nagar - Verification OTP',
        message: `Your OTP for verification is: ${otp}. It is valid for 10 minutes.`,
      });
    } else {
      const smsMessage = `Welcome to RSS! Your mobile verification OTP is ${otp}. Valid for 10 minutes.`;
      sent = await sendSMS(user.phone, smsMessage);
    }

    res.status(201).json({
      message: `Registration initiated. OTP sent successfully to ${otpType}.`,
      userId: user._id,
      sent,
      testOtp: otp
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resendOTP = async (req, res) => {
  const { userId } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    const otp = generateOTP();
    console.log(`[DEBUG] Re-generated OTP - ${user.otpType}: ${otp}`);
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry
    await user.save();

    if (user.otpType === 'email') {
      await sendEmail({
        email: user.email,
        subject: 'RSS Sardar Nagar - New OTP',
        message: `Your new OTP for verification is: ${otp}.`,
      });
    } else {
       await sendSMS(user.phone, `New OTP for RSS verification is ${otp}.`);
    }

    res.json({ 
      message: 'New OTP sent successfully.',
      testOtp: otp
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyOTP = async (req, res) => {
  const { userId, otp } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.isVerified) return res.status(400).json({ message: 'User already verified' });
    if (user.otpExpiry < new Date()) return res.status(400).json({ message: 'OTP has expired' });
    
    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    user.isVerified = true;
    await user.save();

    res.json({ message: 'Verified successfully', isVerified: user.isVerified });
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
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No user registered with this email address.' });
    }

    const otp = generateOTP();
    user.resetOtp = otp;
    user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry
    await user.save();

    await sendEmail({
      email: user.email,
      subject: 'RSS Sardar Nagar - Password Reset OTP',
      message: `Your OTP to reset password is: ${otp}. It is valid for 10 minutes.`,
    });

    res.json({ message: 'Password reset OTP sent to your email.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
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
    await user.save();

    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with this email' });

    const resetOtp = generateOTP();
    user.resetOtp = resetOtp;
    user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    await user.save();

    await sendEmail({
      email: user.email,
      subject: 'RSS Sardar Nagar - Password Reset OTP',
      message: `Your OTP for password reset is: ${resetOtp}. It is valid for 10 minutes.`,
    });

    res.json({ message: 'Password reset OTP sent to your email' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.resetOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    
    if (user.resetOtpExpiry < new Date()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
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

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      shakha: updatedUser.shakha,
      profilePhoto: updatedUser.profilePhoto,
      hasJoinRequest: updatedUser.hasJoinRequest
    });
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
    const users = await User.find().select('-password -otp -resetOtp').populate('shakha', 'name location');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateUserAdmin = async (req, res) => {
  try {
    const { nagar, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (nagar !== undefined) user.nagar = nagar;

    if (role !== undefined) user.role = role;
    
    const updatedUser = await user.save();
    const populatedUser = await User.findById(updatedUser._id).select('-password -otp -resetOtp').populate('shakha', 'name location');
    res.json(populatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
