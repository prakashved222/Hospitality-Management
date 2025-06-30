const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  specialization: [String],
  experience: {
    type: Number,
    default: 0
  },
  fee: {
    type: Number,
    required: true
  },
  availability: [{
    day: String,
    startTime: String,
    endTime: String
  }],
  profilePicture: {
    type: String,
    default: ''
  },
  bio: String,
  phoneNumber: String,
  address: String,
  isApproved: {
    type: Boolean,
    default: false
  },
  resetCode: String,
  resetCodeExpires: Date,
  tokenVersion: {
    type: Number,
    default: 0
  },
  role: {
    type: String,
    default: 'doctor',
    required: true
  }
}, {
  timestamps: true
});

// Hash password before saving
doctorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
doctorSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Doctor = mongoose.model('Doctor', doctorSchema);
module.exports = Doctor;