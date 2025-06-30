/**
 * Hospital Management System API
 * 
 * @copyright Copyright (c) 2025 Shivam Prakash
 * @author Shivam Prakash
 * @license Proprietary and confidential
 * 
 * This source code is the exclusive property of Shivam Prakash.
 * Unauthorized copying, modification, distribution, or use of this file,
 * via any medium, is strictly prohibited.
 */

// Load environment variables FIRST, before any other imports
const dotenv = require('dotenv');
dotenv.config();

// Now other imports
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const patientRoutes = require('./routes/patientRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Connect to database
connectDB();

// Initialize app
const app = express();

// Middleware
app.use(cors({
  origin: ['https://frontend-hospitality.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Define routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);

// Home route
app.get('/', (req, res) => {
  res.send('Hospital Management System API is running...');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});