const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const patientSchema = new mongoose.Schema({
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
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other']
  },
  bloodGroup: String,
  medicalHistory: [String],
  allergies: [String],
  phoneNumber: {
    type: String,
    required: true
  },
  address: String,
  profilePicture: {
    type: String,
    default: ''
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phoneNumber: String
  },
  resetCode: String,
  resetCodeExpires: Date,
  tokenVersion: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Hash password before saving
patientSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
patientSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Patient = mongoose.model('Patient', patientSchema);
module.exports = Patient;