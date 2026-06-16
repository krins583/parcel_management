// api/send-email.js
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Sirf POST request allow karein
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { toEmail, studentName, parcelName, senderName, roomNumber, receiveTime } = req.body;

  // Vercel Environment Variables se Email aur App Password lena
  const EMAIL_USER = process.env.VITE_EMAIL_USER; 
  const EMAIL_PASS = process.env.VITE_EMAIL_APP_PASSWORD;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Hostel Parcel Desk" <${EMAIL_USER}>`,
    to: toEmail,
    subject: `📦 Parcel Delivered: ${parcelName}`,
    text: `Hello ${studentName},\n\nYour parcel from ${senderName} (Items: ${parcelName}) has been successfully delivered to the hostel desk.\n\nRoom: ${roomNumber}\nReceived At: ${receiveTime}\n\nPlease collect it soon.\n\nRegards,\nSGVP Parcel Desk`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error("Email Error:", error);
    res.status(500).json({ success: false, message: 'Failed to send email', error: error.message });
  }
}