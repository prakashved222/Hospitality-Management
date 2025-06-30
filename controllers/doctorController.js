const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Referral = require('../models/Referral');
const Patient = require('../models/Patient'); // Add this missing import
const asyncHandler = require('express-async-handler'); // Add this missing import
const generateToken = require('../utils/generateToken'); // Add this missing import

// Get doctor profile
const getDoctorProfile = asyncHandler(async (req, res) => {
  try {
    console.log('Doctor ID:', req.user._id); // Add this for debugging
    
    const doctor = await Doctor.findById(req.user._id)
      .select('-password')
      .populate('department', 'name');
    
    if (!doctor) {
      console.log('Doctor not found in database');
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    res.status(200).json(doctor);
  } catch (error) {
    console.error('Error in getDoctorProfile:', error);
    res.status(500).json({ 
      message: 'Server error while fetching doctor profile',
      error: error.message 
    });
  }
});

// Update doctor profile
const updateDoctorProfile = asyncHandler(async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user._id);
    
    if (doctor) {
      doctor.name = req.body.name || doctor.name;
      doctor.email = req.body.email || doctor.email;
      doctor.department = req.body.department || doctor.department;
      doctor.specialization = req.body.specialization || doctor.specialization;
      doctor.experience = req.body.experience || doctor.experience;
      doctor.fee = req.body.fee || doctor.fee;
      doctor.availability = req.body.availability || doctor.availability;
      doctor.bio = req.body.bio || doctor.bio;
      doctor.phoneNumber = req.body.phoneNumber || doctor.phoneNumber;
      doctor.address = req.body.address || doctor.address;
      
      if (req.body.password) {
        doctor.password = req.body.password;
      }
      
      const updatedDoctor = await doctor.save();
      
      res.json({
        _id: updatedDoctor._id,
        name: updatedDoctor.name,
        email: updatedDoctor.email,
        department: updatedDoctor.department,
        specialization: updatedDoctor.specialization,
        experience: updatedDoctor.experience,
        fee: updatedDoctor.fee,
        availability: updatedDoctor.availability,
        bio: updatedDoctor.bio,
        phoneNumber: updatedDoctor.phoneNumber,
        address: updatedDoctor.address
      });
    } else {
      res.status(404).json({ error: 'Doctor not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get doctor's appointments
const getDoctorAppointments = asyncHandler(async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctor: req.user._id })
      .populate('patient', 'name email phoneNumber age gender')
      .sort({ appointmentDate: 1 });
    
    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update appointment status
const updateAppointmentStatus = asyncHandler(async (req, res) => {
  try {
    const { appointmentId, status } = req.body;
    
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    if (appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this appointment' });
    }
    
    appointment.status = status;
    
    const updatedAppointment = await appointment.save();
    
    res.json(updatedAppointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add prescription to appointment
const addPrescription = asyncHandler(async (req, res) => {
  try {
    const { appointmentId, medications, notes, followUpDate } = req.body;
    
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    if (appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this appointment' });
    }
    
    appointment.prescription = {
      medications,
      notes,
      followUpDate
    };
    
    const updatedAppointment = await appointment.save();
    
    res.json(updatedAppointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all doctors (for patient booking)
const getAllDoctors = asyncHandler(async (req, res) => {
  try {
    console.log('Fetching all doctors...');
    
    // Find all approved doctors (excluding the requesting doctor if authenticated)
    let query = { isApproved: true };
    
    // If there's an authenticated user, exclude them from results
    if (req.user && req.user._id) {
      query._id = { $ne: req.user._id };
    }
    
    console.log('Query:', query);
    
    const doctors = await Doctor.find(query)
      .select('name department specialization')
      .sort({ name: 1 });
    
    console.log(`Found ${doctors.length} doctors`);
    
    res.status(200).json(doctors);
  } catch (error) {
    console.error('Error in getAllDoctors:', error);
    res.status(500).json({ 
      message: 'Server error while fetching doctors list',
      error: error.message 
    });
  }
});

// Get doctors by department
const getDoctorsByDepartment = asyncHandler(async (req, res) => {
  try {
    const { department } = req.params;
    
    // Modified to return all doctors in a department regardless of approval
    const doctors = await Doctor.find({ department })
      .select('-password')
      .sort({ name: 1 });
    
    res.json(doctors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get patients for a doctor
const getDoctorPatients = asyncHandler(async (req, res) => {
  try {
    console.log('Getting patients for doctor:', req.user._id);
    
    // Get all appointments for this doctor
    const appointments = await Appointment.find({ doctor: req.user._id })
      .populate('patient', 'name email phoneNumber age gender bloodGroup medicalHistory allergies')
      .sort({ appointmentDate: -1 });
    
    // Create a map to store unique patients with their appointment history
    const patientMap = new Map();
    
    // Process appointments to build patient data
    appointments.forEach(app => {
      if (!app.patient) return;
      
      const patientId = app.patient._id.toString();
      
      if (!patientMap.has(patientId)) {
        // For first occurrence, create the patient object
        patientMap.set(patientId, {
          _id: app.patient._id,
          name: app.patient.name,
          email: app.patient.email,
          phone: app.patient.phoneNumber,
          age: app.patient.age,
          gender: app.patient.gender,
          bloodGroup: app.patient.bloodGroup,
          medicalHistory: app.patient.medicalHistory || [],
          allergies: app.patient.allergies || [],
          lastVisit: new Date(app.appointmentDate), // Initial value
          totalVisits: app.status === 'Completed' ? 1 : 0,
          appointments: [{
            _id: app._id,
            appointmentDate: app.appointmentDate,
            timeSlot: app.timeSlot,
            status: app.status,
            type: app.type || 'Consultation',
            problem: app.problem,
            prescription: app.prescription
          }]
        });
      } else {
        // For existing patients, update data and add appointment
        const patient = patientMap.get(patientId);
        
        // Update last visit if newer
        const appDate = new Date(app.appointmentDate);
        if (appDate > patient.lastVisit) {
          patient.lastVisit = appDate;
        }
        
        // Increment total visits if completed
        if (app.status === 'Completed') {
          patient.totalVisits += 1;
        }
        
        // Add appointment to history
        patient.appointments.push({
          _id: app._id,
          appointmentDate: app.appointmentDate,
          timeSlot: app.timeSlot,
          status: app.status,
          type: app.type || 'Consultation',
          problem: app.problem,
          prescription: app.prescription
        });
      }
    });
    
    // Convert map to array
    const patients = Array.from(patientMap.values());
    
    console.log(`Found ${patients.length} patients for doctor ${req.user._id}`);
    
    res.json(patients);
  } catch (error) {
    console.error('Error in getDoctorPatients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Create a referral to another doctor
const createReferral = asyncHandler(async (req, res) => {
  try {
    const { patientId, doctorId, referralDate, notes } = req.body;
    
    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Check if doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    // Create referral
    const referral = new Referral({
      patient: patientId,
      fromDoctor: req.user._id,
      toDoctor: doctorId,
      referralDate: new Date(referralDate),
      notes
    });
    
    const savedReferral = await referral.save();
    
    // Populate doctor and patient info for response
    const populatedReferral = await Referral.findById(savedReferral._id)
      .populate('patient', 'name email age gender')
      .populate('fromDoctor', 'name department specialization')
      .populate('toDoctor', 'name department specialization');
    
    res.status(201).json(populatedReferral);
  } catch (error) {
    console.error('Error creating referral:', error);
    res.status(500).json({ error: 'Failed to create referral' });
  }
});

// Get referrals sent by this doctor
const getSentReferrals = asyncHandler(async (req, res) => {
  try {
    const referrals = await Referral.find({ fromDoctor: req.user._id })
      .populate('patient', 'name email age gender')
      .populate('toDoctor', 'name department specialization')
      .sort({ createdAt: -1 });
    
    res.json(referrals);
  } catch (error) {
    console.error('Error getting sent referrals:', error);
    res.status(500).json({ error: 'Failed to get referrals' });
  }
});

// Update the getReceivedReferrals function with better error handling

const getReceivedReferrals = asyncHandler(async (req, res) => {
  try {
    console.log('Doctor ID for referrals:', req.user._id); // Add this for debugging
    
    const referrals = await Referral.find({ receivingDoctor: req.user._id })
      .populate('patient', 'name email phone')
      .populate('referringDoctor', 'name department')
      .sort({ createdAt: -1 });
      
    res.status(200).json(referrals);
  } catch (error) {
    console.error('Error in getReceivedReferrals:', error);
    res.status(500).json({ 
      message: 'Server error while fetching received referrals',
      error: error.message 
    });
  }
});

// Update referral status (accept/decline)
const updateReferralStatus = asyncHandler(async (req, res) => {
  try {
    const { referralId } = req.params;
    const { action } = req.params;
    
    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    const referral = await Referral.findById(referralId);
    if (!referral) {
      return res.status(404).json({ error: 'Referral not found' });
    }
    
    // Check if this doctor is authorized to update this referral
    if (referral.toDoctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this referral' });
    }
    
    referral.status = action === 'accept' ? 'accepted' : 'declined';
    const updatedReferral = await referral.save();
    
    res.json(updatedReferral);
  } catch (error) {
    console.error(`Error ${req.params.action}ing referral:`, error);
    res.status(500).json({ error: `Failed to ${req.params.action} referral` });
  }
});

// Add or update the changePassword function
const changePassword = asyncHandler(async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new password' });
    }
    
    const doctor = await Doctor.findById(req.user._id);
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Check if current password is correct
    const isMatch = await doctor.matchPassword(currentPassword);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Update the password
    doctor.password = newPassword;
    
    // Increment token version to invalidate old tokens (optional)
    if (typeof doctor.tokenVersion === 'number') {
      doctor.tokenVersion += 1;
    } else {
      doctor.tokenVersion = 1;
    }
    
    await doctor.save();
    
    // Generate new token with updated version
    const token = generateToken(doctor._id, 'doctor', doctor.tokenVersion);
    
    res.json({
      message: 'Password changed successfully',
      token
    });
  } catch (error) {
    console.error('Error in changePassword:', error);
    res.status(500).json({ 
      message: 'Server error while changing password',
      error: error.message
    });
  }
});

// Add these methods to your doctorController

// Request password reset
const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Please provide an email address');
  }

  const doctor = await Doctor.findOne({ email });

  if (!doctor) {
    res.status(404);
    throw new Error('Doctor not found with this email');
  }

  // Generate a random 6-digit reset code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Save reset code to doctor document with expiration (1 hour)
  doctor.resetCode = resetCode;
  doctor.resetCodeExpires = Date.now() + 3600000; // 1 hour
  await doctor.save();

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

  const doctor = await Doctor.findOne({ 
    email, 
    resetCode,
    resetCodeExpires: { $gt: Date.now() }
  });

  if (!doctor) {
    res.status(400);
    throw new Error('Invalid or expired reset code');
  }

  // Set new password
  doctor.password = newPassword;
  doctor.resetCode = undefined;
  doctor.resetCodeExpires = undefined;
  await doctor.save();

  // Generate token
  const token = generateToken(doctor._id);

  res.json({
    message: 'Password reset successfully',
    token
  });
});

// Logout from all devices
const logoutAllDevices = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.user._id);
  
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor not found');
  }

  // Update the doctor's tokenVersion to invalidate all existing tokens
  doctor.tokenVersion = (doctor.tokenVersion || 0) + 1;
  await doctor.save();

  res.status(200).json({ message: 'Logged out from all devices' });
});

// Add this function to your controller

const getDoctorReports = asyncHandler(async (req, res) => {
  try {
    const { type = 'all', timeRange = 'month' } = req.query;
    const doctorId = req.user._id;
    
    // Get the date range based on timeRange parameter
    const endDate = new Date();
    let startDate = new Date();
    
    if (timeRange === 'week') {
      startDate.setDate(endDate.getDate() - 7);
    } else if (timeRange === 'month') {
      startDate.setMonth(endDate.getMonth() - 1);
    } else if (timeRange === 'year') {
      startDate.setFullYear(endDate.getFullYear() - 1);
    }
    
    // Query for doctor's appointments in the date range
    const appointmentsQuery = {
      doctor: doctorId,
      appointmentDate: { $gte: startDate, $lte: endDate }
    };
    
    // Aggregate appointment data
    const appointments = await Appointment.find(appointmentsQuery)
      .populate('patient', 'name age gender')
      .sort({ appointmentDate: -1 });
    
    // Calculate basic metrics
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(a => a.status === 'Completed').length;
    const pendingAppointments = appointments.filter(a => a.status === 'Pending').length;
    const cancelledAppointments = appointments.filter(a => a.status === 'Cancelled').length;
    
    // Calculate revenue if billing information is available
    let totalRevenue = 0;
    appointments.forEach(appointment => {
      if (appointment.billing && appointment.billing.totalAmount) {
        totalRevenue += appointment.billing.totalAmount;
      }
    });
    
    // Patient demographics
    const patientGenders = {};
    const patientAgeGroups = {
      'Under 18': 0,
      '18-30': 0,
      '31-45': 0,
      '46-60': 0,
      'Over 60': 0
    };
    
    appointments.forEach(appointment => {
      const patient = appointment.patient;
      if (patient) {
        // Gender count
        if (patient.gender) {
          patientGenders[patient.gender] = (patientGenders[patient.gender] || 0) + 1;
        }
        
        // Age group count
        if (patient.age) {
          if (patient.age < 18) patientAgeGroups['Under 18']++;
          else if (patient.age <= 30) patientAgeGroups['18-30']++;
          else if (patient.age <= 45) patientAgeGroups['31-45']++;
          else if (patient.age <= 60) patientAgeGroups['46-60']++;
          else patientAgeGroups['Over 60']++;
        }
      }
    });
    
    // Create the report object
    const report = {
      timeRange,
      metrics: {
        totalAppointments,
        completedAppointments,
        pendingAppointments,
        cancelledAppointments,
        completionRate: totalAppointments > 0 
          ? Math.round((completedAppointments / totalAppointments) * 100) 
          : 0,
        totalRevenue
      },
      demographics: {
        genderDistribution: patientGenders,
        ageGroupDistribution: patientAgeGroups
      },
      recentAppointments: appointments.slice(0, 5).map(a => ({
        id: a._id,
        patientName: a.patient?.name || 'Unknown',
        date: a.appointmentDate,
        status: a.status,
        revenue: a.billing?.totalAmount || 0
      }))
    };
    
    res.status(200).json(report);
  } catch (error) {
    console.error('Error generating doctor reports:', error);
    res.status(500).json({ 
      message: 'Failed to generate report data',
      error: error.message 
    });
  }
});

// Don't forget to export the function
module.exports = {
  getDoctorProfile,
  updateDoctorProfile,
  getDoctorAppointments,
  updateAppointmentStatus,
  addPrescription,
  getAllDoctors,
  getDoctorsByDepartment,
  getDoctorPatients,
  createReferral,
  getSentReferrals,
  getReceivedReferrals,
  updateReferralStatus,
  changePassword,
  requestPasswordReset,
  resetPassword,
  logoutAllDevices,
  getDoctorReports
};