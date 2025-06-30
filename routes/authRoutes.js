const express = require('express');
const { 
  registerDoctor, 
  registerPatient, 
  loginDoctor,  // Make sure these names match your controller exports
  loginPatient
} = require('../controllers/authController');

const router = express.Router();

// Auth routes
router.post('/register/doctor', registerDoctor);
router.post('/register/patient', registerPatient);
router.post('/login/doctor', loginDoctor);   // Line 15 - this function is undefined
router.post('/login/patient', loginPatient);

module.exports = router;