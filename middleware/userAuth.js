// middleware/auth.js
const jwt  = require('jsonwebtoken');
const { User } = require('../models');

const auth = async (req, res, next) => {
  try {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please login again.'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.'
      });
    }

    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'username', 'email', 'avatar', 'membership', 'is_active']
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.'
      });
    }
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }
    req.user = user;
    next();

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = auth;