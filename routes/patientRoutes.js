const express = require('express');
const patientController = require('../controllers/patientController');
const { protect, patientOnly } = require('../middleware/authMiddleware');

const router = express.Router();

const { 
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
} = require('../controllers/patientController');

// Protected routes (patients only)
router.get('/profile', protect, patientOnly, getPatientProfile);
router.put('/profile', protect, patientOnly, updatePatientProfile);
router.post('/appointment', protect, patientOnly, bookAppointment);
router.post('/payment/verify', protect, patientOnly, verifyPayment);
router.get('/appointments', protect, patientOnly, getPatientAppointments);
router.put('/appointment/:appointmentId/cancel', protect, patientOnly, cancelAppointment);
router.get('/bill/:appointmentId', protect, patientOnly, generateBill);
router.put('/change-password', protect, patientOnly, changePassword);

// Password reset routes
router.post('/request-reset', patientController.requestPasswordReset);
router.post('/reset-password', patientController.resetPassword);
router.post('/logout-all', protect, patientController.logoutAllDevices);

module.exports = router;