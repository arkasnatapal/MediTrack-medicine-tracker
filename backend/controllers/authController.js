const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendOtpEmail, sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/email');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user',
      otp,
      otpExpires,
      isVerified: false
    });

    // Send OTP Email
    await sendOtpEmail({
      to: email,
      otp,
      name
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      requireVerification: true,
      email: user.email
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find user with matching email and include OTP fields
    const user = await User.findOne({ email }).select('+otp +otpExpires');

    if (!user) {
      return res.status(400).json({ message: 'Invalid email' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    // Verify user
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Send Welcome Email
    await sendWelcomeEmail({
      to: user.email,
      name: user.name
    });

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePictureUrl: user.profilePictureUrl,
        settings: user.settings,
        google: user.google,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP Email
    await sendOtpEmail({
      to: email,
      otp,
      name: user.name
    });

    res.json({
      success: true,
      message: 'OTP resent successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Password mismatch');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check verification status
    if (!user.isVerified) {
      console.log('User not verified');
      return res.status(403).json({ 
        message: 'Please verify your email address',
        requireVerification: true,
        email: user.email
      });
    }

    console.log('2FA Check - Enabled:', user.twoFactorEnabled);

    // Check 2FA
    if (user.twoFactorEnabled) {
      console.log('2FA is enabled, generating OTP');
      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();

      // Send OTP Email
      try {
        await sendOtpEmail({
          to: email,
          otp,
          name: user.name
        });
        console.log('OTP email sent');
      } catch (emailError) {
        console.error('Failed to send OTP email:', emailError);
        // Continue anyway? Or fail? Failsafe: return error
        return res.status(500).json({ message: 'Failed to send OTP email' });
      }

      return res.json({
        success: true,
        requireTwoFactor: true,
        email: user.email,
        message: 'OTP sent to your email'
      });
    }

    console.log('Login successful, generating token');
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePictureUrl: user.profilePictureUrl,
        settings: user.settings,
        twoFactorEnabled: user.twoFactorEnabled,
        google: user.google
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email }).select('+otp +otpExpires');

    if (!user || !user.otp || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Clear OTP
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePictureUrl: user.profilePictureUrl,
        settings: user.settings,
        twoFactorEnabled: user.twoFactorEnabled,
        google: user.google
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.toggleTwoFactor = async (req, res) => {
  try {
    console.log('Toggling 2FA for user:', req.user.id);
    const user = await User.findById(req.user.id);
    user.twoFactorEnabled = !user.twoFactorEnabled;
    await user.save();
    console.log('2FA toggled. New status:', user.twoFactorEnabled);

    res.json({ 
      success: true, 
      message: `Two-factor authentication ${user.twoFactorEnabled ? 'enabled' : 'disabled'}`,
      twoFactorEnabled: user.twoFactorEnabled
    });
  } catch (error) {
    console.error('Toggle 2FA error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // For security, don't reveal if user exists
      return res.json({ success: true, message: 'If an account exists, an OTP has been sent.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await sendPasswordResetEmail({
      to: email,
      otp,
      name: user.name
    });

    res.json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email }).select('+otp +otpExpires');

    if (!user || !user.otp || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Generate a temporary reset token
    const resetToken = jwt.sign(
      { id: user._id, type: 'reset' }, 
      process.env.JWT_SECRET, 
      { expiresIn: '15m' }
    );

    res.json({ success: true, resetToken });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken) {
      return res.status(400).json({ message: 'Reset token is required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    if (decoded.type !== 'reset') {
      return res.status(400).json({ message: 'Invalid token type' });
    }

    const user = await User.findById(decoded.id).select('+otp +otpExpires');
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    user.password = newPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    // Also mark as verified if they reset password successfully (implies ownership)
    user.isVerified = true; 
    await user.save();

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
