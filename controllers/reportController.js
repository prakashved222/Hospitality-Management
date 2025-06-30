const asyncHandler = require('express-async-handler');
const Appointment = require('../models/Appointment');
const Referral = require('../models/Referral');

// @desc    Get report data for doctor
// @route   GET /api/reports
// @access  Private/Doctor
const getReportData = asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    const doctorId = req.user._id;
    
    console.log(`Fetching report data: ${startDate} to ${endDate}, type: ${type}`);
    
    // Convert string dates to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the entire end date
    
    // Get appointments for this doctor in the date range
    const appointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: { $gte: start, $lte: end }
    }).populate('patient', 'name email age gender')
      .sort({ appointmentDate: 1 });
    
    // Get referrals for this doctor in the date range
    const referrals = await Referral.find({
      $or: [
        { fromDoctor: doctorId },
        { toDoctor: doctorId }
      ],
      createdAt: { $gte: start, $lte: end }
    }).populate('patient', 'name email')
      .populate('fromDoctor', 'name department')
      .populate('toDoctor', 'name department')
      .sort({ createdAt: 1 });
    
    console.log(`Found ${appointments.length} appointments and ${referrals.length} referrals`);
    
    res.json({
      appointments,
      referrals
    });
  } catch (error) {
    console.error('Report controller error:', error);
    res.status(500).json({ error: 'Failed to get report data' });
  }
});

module.exports = {
  getReportData
};