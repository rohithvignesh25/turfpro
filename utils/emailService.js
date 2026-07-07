const nodemailer = require('nodemailer');
const dns = require('dns');
const https = require('https');

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

// 1. HTTP-based Email Sending via Brevo (Sendinblue) over Port 443
const sendViaBrevo = async ({ to, subject, html, text }) => {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      sender: {
        name: "TurfPro Admin",
        email: process.env.FROM_EMAIL_ONLY || process.env.SMTP_USER || "rohithvignesh2@gmail.com"
      },
      to: [{ email: to }],
      subject: subject,
      htmlContent: html || text || "",
      textContent: text || ""
    });

    const options = {
      hostname: 'api.brevo.com',
      port: 443,
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('Brevo HTTP email sent successfully:', body);
          resolve({ status: true, message: 'Email sent successfully via Brevo HTTP API (Port 443)', info: JSON.parse(body || '{}') });
        } else {
          console.error(`Brevo HTTP Error (${res.statusCode}):`, body);
          resolve({ status: false, message: `Brevo HTTP Error (${res.statusCode}): ${body}` });
        }
      });
    });

    req.on('error', (e) => {
      console.error('Brevo HTTPS request error:', e.message);
      resolve({ status: false, message: e.message });
    });
    req.write(data);
    req.end();
  });
};

// 2. HTTP-based Email Sending via Resend over Port 443
const sendViaResend = async ({ to, subject, html, text }) => {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      from: process.env.FROM_EMAIL || "TurfPro <onboarding@resend.dev>",
      to: [to],
      subject: subject,
      html: html || text || "",
      text: text || ""
    });

    const options = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('Resend HTTP email sent successfully:', body);
          resolve({ status: true, message: 'Email sent successfully via Resend HTTP API (Port 443)', info: JSON.parse(body || '{}') });
        } else {
          console.error(`Resend HTTP Error (${res.statusCode}):`, body);
          resolve({ status: false, message: `Resend HTTP Error (${res.statusCode}): ${body}` });
        }
      });
    });

    req.on('error', (e) => {
      console.error('Resend HTTPS request error:', e.message);
      resolve({ status: false, message: e.message });
    });
    req.write(data);
    req.end();
  });
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
    // Priority 1: Brevo HTTP API over Port 443 (Never blocked by cloud free tiers)
    if (process.env.BREVO_API_KEY) {
      console.log(`[EMAIL] Sending via Brevo HTTP API (Port 443) to: ${to}`);
      const res = await sendViaBrevo({ to, subject, html, text });
      if (res.status) return res;
      console.warn('Brevo HTTP failed, falling back to SMTP...', res.message);
    }

    // Priority 2: Resend HTTP API over Port 443 (Never blocked by cloud free tiers)
    if (process.env.RESEND_API_KEY) {
      console.log(`[EMAIL] Sending via Resend HTTP API (Port 443) to: ${to}`);
      const res = await sendViaResend({ to, subject, html, text });
      if (res.status) return res;
      console.warn('Resend HTTP failed, falling back to SMTP...', res.message);
    }

    // Priority 3: Nodemailer SMTP (Works locally or on paid hosting)
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
