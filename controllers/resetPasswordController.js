const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User } = require('../models'); // adjust path if needed
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'Mr.sadaqatalisaqii@gmail.com',
    pass: 'wzpjyzixpicoyhyy'
  }
});

const generatePassword = () => {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const symbols = '!@#$%^&*';
  const all = upper + lower + digits + symbols;

  let password = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];

  for (let i = 0; i < 4; i++) {
    password.push(all[Math.floor(Math.random() * all.length)]);
  }

  return password.sort(() => Math.random() - 0.5).join('');
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'Email not found' });

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000);

    await user.update({ resetToken: token, resetTokenExpiry: expiry });
    console.log('✅ Token saved');

    const resetLink = `http://localhost:3000/user/auth/reset-password?token=${token}`;

    try {
      await transporter.sendMail({
        from: 'Mr.sadaqatalisaqii@gmail.com',
        to: email,
        subject: 'Bandmates Password Reset',
        html: `
          <h2>Reset Your Password</h2>
          <p>Tap the link below to reset your password:</p>
          <a href="${resetLink}">Reset Password</a>
          <p>This link expires in 1 hour.</p>
        `
      });
      console.log('✅ Email sent');
      return res.status(200).json({ message: 'Reset link sent!', token });

    } catch (mailErr) {
      console.error('📧 Mail error:', mailErr.message);
      return res.status(500).json({ message: 'Failed to send email', error: mailErr.message });
    }

  } catch (err) {
    console.error('🔥 Error:', err.message);
    return res.status(500).json({ message: err.message });
  }
};

const resetPassword = async (req, res) => {
  const { token } = req.query;


 console.log('🔑 Token received:', token);
  console.log('🕐 Current time:', new Date());

  const userByToken = await User.findOne({
    where: { resetToken: token }
  });
  
  console.log('👤 User by token only:', userByToken ? userByToken.email : 'NOT FOUND');
  
  if (userByToken) {
    console.log('⏰ Token expiry in DB:', userByToken.resetTokenExpiry);
    console.log('✅ Is expiry valid:', new Date(userByToken.resetTokenExpiry) > new Date());
  }



  const user = await User.findOne({
    where: {
      resetToken: token,
      resetTokenExpiry: { [Op.gt]: new Date() }  
    }
  });
  console.log('👤 User with expiry check:', user ? user.email : 'NOT FOUND');

  if (!user) {
    return res.send(`
      <html>
        <body style="font-family:sans-serif;text-align:center;padding:50px">
          <h2>❌ Link Invalid or Expired</h2>
          <p>Please request a new password reset.</p>
        </body>
      </html>
    `);
  }

  const newPassword = generatePassword();
  const hashed = await bcrypt.hash(newPassword, 10);

  await user.update({
    password: hashed,
    resetToken: null,
    resetTokenExpiry: null
  });

  return res.send(`
    <html>
      <body style="font-family:sans-serif;text-align:center;padding:50px;background:#fff">
        <div style="max-width:400px;margin:auto;border:1px solid #eee;border-radius:12px;padding:40px;box-shadow:0 2px 12px rgba(0,0,0,0.1)">
          <h2 style="color:#e91e8c">✅ Email Confirmed!</h2>
          <p>Your new temporary password is:</p>
          <div style="font-size:28px;font-weight:bold;letter-spacing:4px;background:#f5f5f5;padding:16px;border-radius:8px;margin:20px 0;color:#333">
            ${newPassword}
          </div>
          <p style="color:#888;font-size:14px">Please log in and change this password.</p>
        </div>
      </body>
    </html>
  `);
};

module.exports = { forgotPassword, resetPassword };