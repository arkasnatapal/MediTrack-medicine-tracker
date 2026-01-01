const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    // required: true, // Removed to support Google-only login
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  otp: {
    type: String,
    select: false,
  },
  otpExpires: {
    type: Date,
    select: false,
  },
  profilePictureUrl: {
    type: String,
    default: null,
  },
  phoneNumber: {
    type: String,
    default: "",
  },
  gender: {
    type: String,
    enum: ["male", "female", "other", ""],
    default: "",
  },
  dateOfBirth: {
    type: Date,
  },
  address: {
    type: String,
    default: "",
  },
  location: {
    type: String,
    default: "", // e.g. "New York, USA"
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  timezone: {
    type: String,
    default: "Asia/Kolkata",
  },
    settings: {
    notifications: {
      emailReminders: { type: Boolean, default: true },
      whatsappReminders: { type: Boolean, default: false },
      smsReminders: { type: Boolean, default: false },
      inAppReminders: { type: Boolean, default: true },
      reminderTime: { type: String, default: "09:00" }, // HH:mm daily reminder
      weeklySummary: { type: Boolean, default: false },
      weeklySummaryDay: { type: String, default: "sunday" }, // sunday, monday, etc.
    },
    appearance: {
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
      language: {
        type: String,
        default: "en",
      },
    },
    privacy: {
      showEmailOnProfile: { type: Boolean, default: false },
      showPhoneOnProfile: { type: Boolean, default: false },
      allowAnalytics: { type: Boolean, default: true },
      allowMarketingEmails: { type: Boolean, default: false },
    },
    allowAIAccessToFoodChart: { type: Boolean, default: false },
    security: {
      // twoFactorEnabled moved to root for easier auth handling
    },
  },
  google: {
    id: { type: String },
    email: { type: String },
    accessToken: { type: String },
    refreshToken: { type: String },
    calendarConnected: { type: Boolean, default: false },
  },
  emergencyContacts: [{
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true },
    relation: { type: String, default: "" }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
