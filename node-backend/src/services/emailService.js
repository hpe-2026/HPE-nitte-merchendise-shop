import nodemailer from 'nodemailer';
import logger from '../config/logger.js';

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST  || 'smtp.mailtrap.io',
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

const FROM    = process.env.SMTP_FROM   || '"NITTE Merch Shop" <noreply@nitte.edu.in>';
const ADMIN   = process.env.ADMIN_EMAIL || 'admin@nitte.edu.in';
const APP_URL = process.env.APP_URL     || 'http://localhost:5174';
const API_URL = process.env.API_URL     || 'http://localhost:3000';

export async function sendApprovalRequestEmail({ name, email, role, userId }) {
  const dashUrl = APP_URL + '/#/registrations';

  const adminHtml = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
      <h2 style="color:#1a56db">New Registration — Action Required</h2>
      <p>A new user has signed up and is waiting for your approval.</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        <tr><td style="padding:8px;font-weight:600;color:#555">Name</td><td style="padding:8px">${name}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;font-weight:600;color:#555">Email</td><td style="padding:8px">${email}</td></tr>
        <tr><td style="padding:8px;font-weight:600;color:#555">Role</td><td style="padding:8px;text-transform:capitalize">${role}</td></tr>
      </table>
      <a href="${dashUrl}" style="background:#1a56db;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">Open Admin Dashboard</a>
    </div>
  `;

  const userHtml = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
      <h2 style="color:#1a56db">Registration Received!</h2>
      <p>Hi ${name},</p>
      <p>Thank you for registering at <strong>NITTE Merchandise Shop</strong>.</p>
      <p>Your account is currently <strong>pending admin approval</strong>. You will receive another email once your account is approved and you can log in.</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        <tr><td style="padding:8px;font-weight:600;color:#555">Name</td><td style="padding:8px">${name}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;font-weight:600;color:#555">Email</td><td style="padding:8px">${email}</td></tr>
        <tr><td style="padding:8px;font-weight:600;color:#555">Role</td><td style="padding:8px;text-transform:capitalize">${role}</td></tr>
      </table>
      <p style="color:#888;font-size:13px">If you did not register, please ignore this email.</p>
    </div>
  `;

  try {
    await transporter.sendMail({ from: FROM, to: ADMIN, subject: `[Action Required] New ${role} registration — ${name}`, html: adminHtml });
    logger.info('Approval request email sent to admin', { email });

    await transporter.sendMail({ from: FROM, to: email, subject: `Registration received — NITTE Merch Shop`, html: userHtml });
    logger.info('Registration confirmation email sent to user', { email });
  } catch (err) {
    logger.warn('Failed to send email', { error: err.message });
  }
}

export async function sendApprovalEmail({ name, email }) {
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
      <h2 style="color:#0e9f6e">Account Approved!</h2>
      <p>Hi ${name},</p>
      <p>Great news! Your account has been <strong>approved</strong> by the admin.</p>
      <p>You can now log in to the NITTE Merchandise Shop.</p>
      <a href="http://localhost:5173" style="background:#0e9f6e;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">Login Now</a>
      <p style="color:#888;font-size:13px;margin-top:16px">If you have any questions, contact admin.</p>
    </div>
  `;
  try {
    await transporter.sendMail({ from: FROM, to: email, subject: `Your account has been approved — NITTE Merch Shop`, html });
    logger.info('Approval email sent to user', { email });
  } catch (err) {
    logger.warn('Failed to send approval email', { error: err.message });
  }
}

export async function sendLoginSuccessEmail({ name, email }) {
  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
      <h2 style="color:#0e9f6e">Login Successful</h2>
      <p>Hi ${name},</p>
      <p>You have successfully logged in to the NITTE Merchandise Shop supplier portal.</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        <tr><td style="padding:8px;font-weight:600;color:#555">Time</td><td style="padding:8px">${now} IST</td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;font-weight:600;color:#555">Account</td><td style="padding:8px">${email}</td></tr>
      </table>
      <p>If this wasn't you, please contact admin immediately.</p>
    </div>
  `;
  try {
    await transporter.sendMail({ from: FROM, to: email, subject: 'Login successful — NITTE Merch Shop', html });
    logger.info('Login success email sent to supplier', { email });
  } catch (err) {
    logger.warn('Failed to send login success email', { error: err.message });
  }
}