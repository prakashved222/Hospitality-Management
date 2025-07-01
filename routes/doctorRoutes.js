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
  getDoctorReports
} = require('../controllers/doctorController');

// Public routes that don't need authentication
router.post('/request-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.get('/all', getAllDoctors);
router.get('/department/:department', getDoctorsByDepartment);  // Keep only this one

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
router.get('/reports', protect, doctorOnly, getDoctorReports);

// Remove this duplicate line:
// router.get('/department/:department', getDoctorsByDepartment);

module.exports = router;