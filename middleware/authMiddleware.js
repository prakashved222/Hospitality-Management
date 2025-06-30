const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

// Update the protect middleware

const protect = asyncHandler(async (req, res, next) => {
  let token;
  
  console.log('Headers:', req.headers); // Add for debugging
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token received:', token ? 'Yes' : 'No'); // Add for debugging
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded); // Add for debugging
      
      // Find user by ID and role
      let user;
      if (decoded.role === 'doctor') {
        user = await Doctor.findById(decoded.id).select('-password');
      } else if (decoded.role === 'patient') {
        user = await Patient.findById(decoded.id).select('-password');
      } else {
        console.log('Invalid role in token:', decoded.role);
        return res.status(401).json({ message: 'Invalid user role' });
      }
      
      if (!user) {
        console.log('User not found with ID:', decoded.id);
        return res.status(401).json({ message: 'User not found' });
      }
      
      req.user = user;
      req.user.role = decoded.role; // Explicitly set role from token
      next();
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(401).json({ 
        message: 'Not authorized, token failed',
        error: error.message 
      });
    }
  } else {
    console.log('No authorization header found');
    return res.status(401).json({ message: 'No token provided' });
  }
});

// Update the doctorOnly middleware:

// Middleware to check if user is a doctor
const doctorOnly = asyncHandler(async (req, res, next) => {
  // If no user attached to request, they're not authenticated
  if (!req.user) {
    res.status(401);
    throw new Error('Not authenticated');
  }
  
  // Check if the user is a Doctor model instance - this is more reliable than checking role
  if (req.user instanceof Doctor || req.user.constructor.modelName === 'Doctor') {
    next();
  } else {
    console.log('User trying to access doctor route:', req.user);
    res.status(403);
    throw new Error('Not authorized as a doctor');
  }
});

// Middleware to check if user is a patient
const patientOnly = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === 'patient') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as a patient');
  }
});

// Middleware to check if user is an admin
const adminOnly = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as an admin');
  }
});

module.exports = { protect, doctorOnly, patientOnly, adminOnly };