const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Patient'
  },
  fromDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Doctor'
  },
  toDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Doctor'
  },
  referralDate: {
    type: Date,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  }
}, {
  timestamps: true
});

const Referral = mongoose.model('Referral', referralSchema);
module.exports = Referral;