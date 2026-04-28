const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { User } = require('../models'); // adjust path if needed
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'youremail@gmail.com',
    pass: 'your-app-password'
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
  const { email } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(404).json({ message: 'Email not found' });

  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 3600000); // 1 hour

  await user.update({ resetToken: token, resetTokenExpiry: expiry });

  const resetLink = `http://YOUR_LOCAL_IP:3000/auth/reset-password?token=${token}`;

  await transporter.sendMail({
    from: 'youremail@gmail.com',
    to: email,
    subject: 'Bandmates Password Reset',
    html: `
      <h2>Reset Your Password</h2>
      <p>Tap the link below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>This link expires in 1 hour.</p>
    `
  });

  res.json({ message: 'Reset link sent!' });
};

const resetPassword = async (req, res) => {
  const { token } = req.query;

  const user = await User.findOne({
    where: {
      resetToken: token,
      resetTokenExpiry: { [Op.gt]: new Date() }  // ← this was broken in your paste
    }
  });

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