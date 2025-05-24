import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { to, subject, html, text } = req.body;

    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: to, subject, and content (html or text)'
      });
    }

    console.log('Attempting to send email to:', to);

    // Create Zoho transporter - FIX: Use createTransport, not createTransporter
    const transporter = nodemailer.createTransport({
      host: process.env.VITE_ZOHO_SMTP_HOST || 'smtp.zoho.com',
      port: parseInt(process.env.VITE_ZOHO_SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.VITE_ZOHO_SMTP_USER,
        pass: process.env.VITE_ZOHO_SMTP_PASSWORD?.replace(/['"]/g, '') // Remove quotes
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify connection
    try {
      await transporter.verify();
      console.log('SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('SMTP verification failed:', verifyError);
      throw new Error('SMTP configuration error: ' + verifyError.message);
    }

    const mailOptions = {
      from: process.env.VITE_ZOHO_FROM_EMAIL || `"TuduAI" <${process.env.VITE_ZOHO_SMTP_USER}>`,
      to,
      subject,
      html,
      text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);

    res.json({
      success: true,
      messageId: info.messageId,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send email'
    });
  }
}
