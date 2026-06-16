// api/send-email.js
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Sirf POST request allow karein
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { toEmail, studentName, parcelName, roomNumber, receiveTime, handedBy } = req.body;

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
    from: `"SGVP Hostel Office" <${EMAIL_USER}>`,
    to: toEmail,
    subject: `📦 Delivery Confirmation: Parcel Received`,
    text: `Dear ${studentName},\n\nThis is a confirmation email to inform you that your parcel (${parcelName}) has been successfully handed over to you.\n\nDelivery Details:\n- Parcel Items: ${parcelName}\n- Room Number: ${roomNumber}\n- Handed Over At: ${receiveTime}\n- Processed By: ${handedBy || 'Hostel Staff'}\n\nIf you did not receive this parcel, please contact the hostel office immediately.\n\nWarm Regards,\nSGVP Hostel Office`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error("Email Error:", error);
    res.status(500).json({ success: false, message: 'Failed to send email', error: error.message });
  }
}