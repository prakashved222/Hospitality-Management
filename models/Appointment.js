const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Patient'
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Doctor'
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  problem: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  payment: {
    amount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
      default: 'Pending'
    },
    razorpayPaymentId: String,
    razorpayOrderId: String
  },
  prescription: {
    medications: [String],
    notes: String,
    followUpDate: Date
  },
  notes: String
}, {
  timestamps: true
});

const Appointment = mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment;