const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const generateToken = require('../utils/generateToken');

// Register a doctor
const registerDoctor = asyncHandler(async (req, res) => {
  try {
    const { name, email, password, department, specialization, fee, phoneNumber } = req.body;

    // Check if doctor already exists
    const doctorExists = await Doctor.findOne({ email });
    if (doctorExists) {
      return res.status(400).json({ error: 'Doctor already exists' });
    }

    // Create new doctor
    const doctor = await Doctor.create({
      name,
      email,
      password,
      department,
      specialization: specialization || [],
      fee,
      phoneNumber
    });

    if (doctor) {
      res.status(201).json({
        _id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        department: doctor.department,
        token: generateToken(doctor._id, 'doctor'),
      });
    } else {
      res.status(400).json({ error: 'Invalid doctor data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Register a patient
const registerPatient = asyncHandler(async (req, res) => {
  try {
    const { name, email, password, age, gender, phoneNumber, address } = req.body;

    // Check if patient already exists
    const patientExists = await Patient.findOne({ email });
    if (patientExists) {
      return res.status(400).json({ error: 'Patient already exists' });
    }

    // Create new patient
    const patient = await Patient.create({
      name,
      email,
      password,
      age,
      gender,
      phoneNumber,
      address
    });

    if (patient) {
      res.status(201).json({
        _id: patient._id,
        name: patient.name,
        email: patient.email,
        age: patient.age,
        gender: patient.gender,
        token: generateToken(patient._id, 'patient'),
      });
    } else {
      res.status(400).json({ error: 'Invalid patient data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login doctor - IMPORTANT: Make sure this name matches what you're exporting
const loginDoctor = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const doctor = await Doctor.findOne({ email });

  if (doctor && (await doctor.matchPassword(password))) {
    res.json({
      _id: doctor._id,
      name: doctor.name,
      email: doctor.email,
      role: 'doctor',
      token: generateToken(doctor._id, 'doctor', doctor.tokenVersion || 0)
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// Login patient
const loginPatient = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find patient by email
    const patient = await Patient.findOne({ email });

    // Check if patient exists and password matches
    if (patient && (await patient.matchPassword(password))) {
      res.json({
        _id: patient._id,
        name: patient.name,
        email: patient.email,
        age: patient.age,
        gender: patient.gender,
        token: generateToken(patient._id, 'patient'),
      });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// IMPORTANT: Make sure all functions are properly exported
module.exports = {
  registerDoctor,
  registerPatient,
  loginDoctor,  // This name must match the function name above
  loginPatient
};