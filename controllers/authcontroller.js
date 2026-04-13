// controllers/authController.js
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User } = require('../models');

const signup = async (req, res) => {
  try {
    // ── Joi already validate kar chuka — req.validatedBody se lo
    const { username, email, password } = req.validatedBody;

    // Check existing user
    const existingUser = await User.findOne({
      where: { [Op.or]: [{ email }, { username }] }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(409).json({
          success: false,
          errors: { email: 'Email already registered' }
        });
      }
      if (existingUser.username === username) {
        return res.status(409).json({
          success: false,
          errors: { username: 'Username already taken' }
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const avatar = req.file ? req.file.path : null;

    const newUser = await User.create({
      username:   username.trim(),
      email:      email.toLowerCase().trim(),
      password:   hashedPassword,
      avatar,
      membership: 'club',
      is_active:  true
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, membership: newUser.membership },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id:         newUser.id,
        username:   newUser.username,
        email:      newUser.email,
        avatar:     newUser.avatar,
        membership: newUser.membership
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.validatedBody;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({
        success: false,
        errors: { email: 'No account found with this email' }
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        errors: { password: 'Incorrect password' }
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, membership: user.membership },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id:         user.id,
        username:   user.username,
        email:      user.email,
        avatar:     user.avatar,
        membership: user.membership
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { signup, login };