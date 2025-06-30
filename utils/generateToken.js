const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id, role, tokenVersion = 0) => {
  return jwt.sign({ id, role, tokenVersion }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = generateToken;