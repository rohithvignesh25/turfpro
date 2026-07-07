const nodemailer = require('nodemailer');
const dns = require('dns');

// Force IPv4 resolution (Render containers do not support IPv6 routing)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

// Custom DNS lookup to guarantee IPv4 resolution for Nodemailer sockets
const forceIPv4Lookup = (hostname, options, callback) => {
  const cb = typeof options === 'function' ? options : callback;
  const opts = typeof options === 'object' && options !== null ? { ...options, family: 4 } : { family: 4 };
  return dns.lookup(hostname, opts, cb);
};

// Create reusable transporter object using SMTP transport
const createTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const isGmail = process.env.SMTP_HOST.includes('gmail') || process.env.SMTP_USER.includes('@gmail.com');
    
    if (isGmail) {
      return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        lookup: forceIPv4Lookup, // Guarantee IPv4
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    }

    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
      lookup: forceIPv4Lookup, // Guarantee IPv4
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  } else {
    // Fallback for development/MVP when SMTP credentials aren't set in .env
    // We create a test account using nodemailer Ethereal email or log to console
    try {
      const testAccount = await nodemailer.createTestAccount();
      console.log('Nodemailer Ethereal test account created:', testAccount.user);
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (error) {
      console.log('Using console log fallback for email (Ethereal test account failed)');
      return null;
    }
  }
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = await createTransporter();
    
    if (!transporter) {
      console.log('----------------------------------------------------');
      console.log(`[EMAIL SIMULATION] To: ${to} | Subject: ${subject}`);
      console.log(`Content: ${text || html}`);
      console.log('----------------------------------------------------');
      return { status: true, message: 'Email simulated in console' };
    }

    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || '"TurfPro Admin" <no-reply@turfpro.com>',
      to,
      subject,
      text: text || '',
      html: html || text || '',
    });

    console.log('Message sent: %s', info.messageId);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('Preview URL: %s', previewUrl);
    }
    return { status: true, message: 'Email sent successfully', info, previewUrl };
  } catch (error) {
    console.error('Error sending email:', error.message);
    // Do not throw error so it doesn't break user API flows
    return { status: false, message: error.message };
  }
};

module.exports = {
  sendEmail,
};
