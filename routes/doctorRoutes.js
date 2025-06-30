const express = require('express');
const router = express.Router();
const { protect, doctorOnly } = require('../middleware/authMiddleware');

// Import all the required controller functions
const { 
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
  getDoctorReports  // Add this import
} = require('../controllers/doctorController');

// Public routes that don't need authentication
router.post('/request-reset', requestPasswordReset); // No auth needed for password reset request
router.post('/reset-password', resetPassword); // No auth needed for resetting with code
router.get('/all', getAllDoctors); // Add this route - making it public so any doctor can see other doctors

// Protected routes (doctors only)
router.get('/profile', protect, doctorOnly, getDoctorProfile);
router.put('/profile', protect, doctorOnly, updateDoctorProfile);
router.get('/appointments', protect, doctorOnly, getDoctorAppointments);
router.put('/appointment/status', protect, doctorOnly, updateAppointmentStatus);
router.post('/appointment/prescription', protect, doctorOnly, addPrescription);
router.get('/patients', protect, doctorOnly, getDoctorPatients);
router.post('/referral', protect, doctorOnly, createReferral);
router.get('/referrals/sent', protect, doctorOnly, getSentReferrals);
router.get('/referrals/received', protect, doctorOnly, getReceivedReferrals);
router.put('/referral/:referralId/:action', protect, doctorOnly, updateReferralStatus);
router.put('/change-password', protect, doctorOnly, changePassword);
router.post('/logout-all', protect, doctorOnly, logoutAllDevices);
router.get('/reports', protect, doctorOnly, getDoctorReports); // Add this route to your existing routes

module.exports = router;