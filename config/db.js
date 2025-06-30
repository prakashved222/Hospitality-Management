const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Remove deprecated options
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`🔌 MongoDB Connected: ${conn.connection.host} 🎉`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;