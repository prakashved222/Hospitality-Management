const asyncHandler = require('express-async-handler');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const generateToken = require('../utils/generateToken');

// Initialize Razorpay with better error handling
let razorpay;
try {
  // Debug logging to see what values are actually available
  console.log('Razorpay Key ID:', process.env.RAZORPAY_KEY_ID);
  console.log('Razorpay Key Secret exists:', !!process.env.RAZORPAY_KEY_SECRET);
  
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    console.log('Razorpay initialized successfully');
  } else {
    throw new Error('Razorpay credentials missing in environment variables');
  }
} catch (error) {
  console.error('Error initializing Razorpay:', error.message);
  // Create a mock razorpay for development
  razorpay = {
    orders: {
      create: async (options) => ({
        id: `order_mock_${Date.now()}`,
        amount: options.amount,
        currency: options.currency
      })
    }
  };
  console.log('Using mock Razorpay implementation');
}

// Get patient profile
const getPatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user._id).select('-password');
    
    if (patient) {
      res.json(patient);
    } else {
      res.status(404).json({ error: 'Patient not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update patient profile
const updatePatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user._id);
    
    if (patient) {
      patient.name = req.body.name || patient.name;
      patient.email = req.body.email || patient.email;
      patient.age = req.body.age || patient.age;
      patient.gender = req.body.gender || patient.gender;
      patient.bloodGroup = req.body.bloodGroup || patient.bloodGroup;
      patient.medicalHistory = req.body.medicalHistory || patient.medicalHistory;
      patient.allergies = req.body.allergies || patient.allergies;
      patient.phoneNumber = req.body.phoneNumber || patient.phoneNumber;
      patient.address = req.body.address || patient.address;
      patient.emergencyContact = req.body.emergencyContact || patient.emergencyContact;
      
      if (req.body.password) {
        patient.password = req.body.password;
      }
      
      const updatedPatient = await patient.save();
      
      res.json({
        _id: updatedPatient._id,
        name: updatedPatient.name,
        email: updatedPatient.email,
        age: updatedPatient.age,
        gender: updatedPatient.gender,
        bloodGroup: updatedPatient.bloodGroup,
        phoneNumber: updatedPatient.phoneNumber,
        address: updatedPatient.address
      });
    } else {
      res.status(404).json({ error: 'Patient not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Book an appointment
const bookAppointment = async (req, res) => {
  try {
    const { doctorId, appointmentDate, timeSlot, problem } = req.body;
    
    // Verify doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    // Create appointment
    const appointment = new Appointment({
      patient: req.user._id,
      doctor: doctorId,
      appointmentDate,
      timeSlot,
      problem,
      payment: {
        amount: doctor.fee
      }
    });
    
    // Create Razorpay order
    const options = {
      amount: doctor.fee * 100, // Razorpay amount in paisa
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1
    };
    
    const razorpayOrder = await razorpay.orders.create(options);
    
    // Save Razorpay order ID to appointment
    appointment.payment.razorpayOrderId = razorpayOrder.id;
    
    // Save appointment
    const createdAppointment = await appointment.save();
    
    res.status(201).json({
      appointment: createdAppointment,
      razorpayOrder
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Verify payment and update appointment
const verifyPayment = async (req, res) => {
  try {
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature, appointmentId } = req.body;
    
    // Generate signature for verification
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");
    
    // Verify signature
    if (expectedSignature === razorpaySignature) {
      // Update appointment payment status
      const appointment = await Appointment.findById(appointmentId);
      
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      
      appointment.payment.status = 'Completed';
      appointment.payment.razorpayPaymentId = razorpayPaymentId;
      appointment.status = 'Confirmed';
      
      const updatedAppointment = await appointment.save();
      
      res.json({
        status: 'success',
        appointment: updatedAppointment
      });
    } else {
      res.status(400).json({ error: 'Invalid signature' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get patient's appointments
const getPatientAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .populate('doctor', 'name department specialization fee')
      .sort({ appointmentDate: 1 });
    
    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Cancel appointment
const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    if (appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to cancel this appointment' });
    }
    
    if (appointment.status === 'Completed') {
      return res.status(400).json({ error: 'Cannot cancel completed appointment' });
    }
    
    appointment.status = 'Cancelled';
    
    // If payment was made, initiate refund (simplified)
    if (appointment.payment.status === 'Completed') {
      appointment.payment.status = 'Refunded';
    }
    
    const updatedAppointment = await appointment.save();
    
    res.json(updatedAppointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Generate bill
const generateBill = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    const appointment = await Appointment.findById(appointmentId)
      .populate('doctor', 'name department fee')
      .populate('patient', 'name email phoneNumber');
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    if (appointment.patient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to view this bill' });
    }
    
    // Generate bill data
    const billData = {
      billNumber: `BILL-${Date.now()}`,
      date: new Date(),
      patientDetails: {
        name: appointment.patient.name,
        email: appointment.patient.email,
        phoneNumber: appointment.patient.phoneNumber
      },
      doctorDetails: {
        name: appointment.doctor.name,
        department: appointment.doctor.department
      },
      appointmentDetails: {
        date: appointment.appointmentDate,
        timeSlot: appointment.timeSlot,
        problem: appointment.problem
      },
      paymentDetails: {
        amount: appointment.payment.amount,
        status: appointment.payment.status,
        paymentId: appointment.payment.razorpayPaymentId
      }
    };
    
    res.json(billData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Add this function to your existing controller
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Please provide current and new passwords');
  }
  
  const patient = await Patient.findById(req.user._id);
  
  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }
  
  // Check if current password matches
  const isMatch = await patient.matchPassword(currentPassword);
  
  if (!isMatch) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }
  
  // Update password
  patient.password = newPassword;
  await patient.save();
  
  // Generate new token
  const token = generateToken(patient._id);
  
  res.json({
    message: 'Password updated successfully',
    token
  });
});

// Add these methods to your patientController

// Request password reset
const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Please provide an email address');
  }

  const patient = await Patient.findOne({ email });

  if (!patient) {
    res.status(404);
    throw new Error('Patient not found with this email');
  }

  // Generate a random 6-digit reset code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Save reset code to patient document with expiration (1 hour)
  patient.resetCode = resetCode;
  patient.resetCodeExpires = Date.now() + 3600000; // 1 hour
  await patient.save();

  // In a real application, you would send an email with the reset code
  // For development purposes, we'll just log it to console
  console.log(`Password reset code for ${email}: ${resetCode}`);

  res.status(200).json({ message: 'Password reset code sent to your email' });
});

// Reset password with code
const resetPassword = asyncHandler(async (req, res) => {
  const { email, resetCode, newPassword } = req.body;

  if (!email || !resetCode || !newPassword) {
    res.status(400);
    throw new Error('Please provide email, reset code and new password');
  }

  const patient = await Patient.findOne({ 
    email, 
    resetCode,
    resetCodeExpires: { $gt: Date.now() }
  });

  if (!patient) {
    res.status(400);
    throw new Error('Invalid or expired reset code');
  }

  // Set new password
  patient.password = newPassword;
  patient.resetCode = undefined;
  patient.resetCodeExpires = undefined;
  await patient.save();

  // Generate token
  const token = generateToken(patient._id);

  res.json({
    message: 'Password reset successfully',
    token
  });
});

// Logout from all devices
const logoutAllDevices = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.user._id);
  
  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  // Update the patient's tokenVersion to invalidate all existing tokens
  patient.tokenVersion = (patient.tokenVersion || 0) + 1;
  await patient.save();

  res.status(200).json({ message: 'Logged out from all devices' });
});

module.exports = {
  getPatientProfile,
  updatePatientProfile,
  bookAppointment,
  verifyPayment,
  getPatientAppointments,
  cancelAppointment,
  generateBill,
  changePassword,
  requestPasswordReset,
  resetPassword,
  logoutAllDevices
};