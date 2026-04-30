const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'Mr.sadaqatalisaqii@gmail.com',
    pass: 'wzpjyzixpicoyhyy'
  }
});

const sendFeedback = async (req, res) => {
  try {
    const { name, contactNumber, email, feedback } = req.body;

    if (!name || !contactNumber || !email || !feedback) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    await transporter.sendMail({
      from: 'Mr.sadaqatalisaqii@gmail.com',
      to: 'Mr.sadaqatalisaqii@gmail.com',
      subject: `📩 New Feedback from ${name}`,
      html: `
        <h2>New Help & Support Request</h2>
        <table style="font-family:sans-serif;font-size:15px;line-height:2">
          <tr><td><b>Name:</b></td><td>${name}</td></tr>
          <tr><td><b>Contact:</b></td><td>${contactNumber}</td></tr>
          <tr><td><b>Email:</b></td><td>${email}</td></tr>
          <tr><td><b>Feedback:</b></td><td>${feedback}</td></tr>
        </table>
      `
    });

    return res.status(200).json({ success: true, message: 'Feedback sent successfully' });

  } catch (err) {
    console.error('🔥 Feedback error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to send feedback' });
  }
};

module.exports = { sendFeedback };