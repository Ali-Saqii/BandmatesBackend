const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User } = require('../models');
const fs     = require('fs'); 

const signup = async (req, res) => {
  try {
    const { username, email, password } = req.validatedBody;

    const existingUser = await User.findOne({
      where: { [Op.or]: [{ email }, { username }] }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(409).json({
          success: false,
          message: "email already registered",
          errors: { email: 'Email already registered' }
        });
      }
      if (existingUser.username === username) {
        return res.status(409).json({
          success: false,
            message: "Username already taken",
          errors: { username: 'Username already taken' }
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    // const avatar = req.file ? req.file.path : null;
let avatar = null;
if (req.file && req.file.buffer) {
  const filename = `${Date.now()}_${req.file.originalname}`;
  const savePath = `uploads/avatars/${filename}`;

  if (!fs.existsSync('uploads/avatars')) {
    fs.mkdirSync('uploads/avatars', { recursive: true });
  }

  fs.writeFileSync(savePath, req.file.buffer);
  avatar = savePath;
  console.log("✅ Avatar saved:", avatar);
} else {
  console.log("❌ No file received");
}   
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
      { expiresIn: '30d' }
    );
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token: token
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error'});
  }
};
const login = async (req, res) => {
  try {
    const { email, password } = req.validatedBody;
 console.log('📧 Email:', email);
    console.log('🔑 Password received:', password); // ← what does this print?
    console.log('📦 req.body:', req.body);           // ← compare with this
    console.log('📦 req.validatedBody:', req.validatedBody);
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No account found with this email',
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
        message:"Incorrect password",
        errors: { password: 'Incorrect password' }
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, membership: user.membership },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

       res.json({
      success: true,
      message: 'Login successful',
      token: token
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message:  'Internal server error' });
  }
};

module.exports = { signup, login };