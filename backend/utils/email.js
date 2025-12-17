const nodemailer = require("nodemailer");

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("❌ SMTP configuration missing. Cannot send email.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

async function sendFamilyInviteEmail({ to, inviterName, familyConnectionId }) {
  const transporter = getTransporter();
  if (!transporter || !to) return;

  const baseUrl = process.env.APP_BASE_URL || "http://localhost:5173";
  const inviteLink = `${baseUrl}/family/invitations?connectionId=${familyConnectionId}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || `"MediTrack" <${process.env.SMTP_USER}>`,
    to,
    subject: `${inviterName} invited you to join their MediTrack family`,
    text: `
${inviterName} has invited you to join their family on MediTrack to share and manage medicine routines.

Click this link to join or create your account:
${inviteLink}

If you do not recognize this, you can ignore this email.
    `.trim(),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color:#2563eb;">MediTrack Family Invitation</h2>
        <p><strong>${inviterName}</strong> has invited you to join their family on <strong>MediTrack</strong>.</p>
        <p>
          <a href="${inviteLink}" style="display:inline-block;padding:10px 18px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;">
            Join Family
          </a>
        </p>
        <p style="color:#666;font-size:13px;">If you don't recognize this invitation, you can safely ignore this email.</p>
        <p style="color:#999;font-size:12px;margin-top:24px;">– MediTrack Team</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Family invite email sent:", info.messageId);
  } catch (err) {
    console.error("❌ Failed to send family invite email:", err.message);
  }
}

module.exports = {
  sendFamilyInviteEmail,
  sendOtpEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
};

async function sendOtpEmail({ to, otp, name }) {
  const transporter = getTransporter();
  if (!transporter || !to) return;

  const mailOptions = {
    from: process.env.SMTP_FROM || `"MediTrack" <${process.env.SMTP_USER}>`,
    to,
    subject: `Your Verification Code - MediTrack`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
        <!-- Header -->
        <div style="background-color: #2563eb; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">MediTrack</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #1e293b; margin-top: 0; font-size: 20px;">Verify your email address</h2>
          <p style="color: #475569; line-height: 1.6; margin-bottom: 25px;">
            Hi <strong>${name}</strong>,<br><br>
            Thank you for signing up for MediTrack! To complete your registration and verify your email address, please use the following One-Time Password (OTP).
          </p>
          
          <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
            <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: 700; color: #2563eb; letter-spacing: 4px;">${otp}</span>
          </div>
          
          <p style="color: #64748b; font-size: 14px; text-align: center;">
            This code will expire in 10 minutes.
          </p>
          
          <p style="color: #475569; line-height: 1.6; margin-top: 30px;">
            If you didn't create an account with MediTrack, you can safely ignore this email.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            &copy; ${new Date().getFullYear()} MediTrack. All rights reserved.
          </p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ OTP email sent:", info.messageId);
  } catch (err) {
    console.error("❌ Failed to send OTP email:", err.message);
  }
}

async function sendPasswordResetEmail({ to, otp, name }) {
  const transporter = getTransporter();
  if (!transporter || !to) return;

  const mailOptions = {
    from: process.env.SMTP_FROM || `"MediTrack" <${process.env.SMTP_USER}>`,
    to,
    subject: `Reset Your Password - MediTrack`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
        <!-- Header -->
        <div style="background-color: #2563eb; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">MediTrack</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #1e293b; margin-top: 0; font-size: 20px;">Reset your password</h2>
          <p style="color: #475569; line-height: 1.6; margin-bottom: 25px;">
            Hi <strong>${name}</strong>,<br><br>
            We received a request to reset your password for your MediTrack account. Use the following OTP to proceed with resetting your password.
          </p>
          
          <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
            <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: 700; color: #2563eb; letter-spacing: 4px;">${otp}</span>
          </div>
          
          <p style="color: #64748b; font-size: 14px; text-align: center;">
            This code will expire in 10 minutes.
          </p>
          
          <p style="color: #475569; line-height: 1.6; margin-top: 30px;">
            If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            &copy; ${new Date().getFullYear()} MediTrack. All rights reserved.
          </p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Password reset email sent:", info.messageId);
  } catch (err) {
    console.error("❌ Failed to send password reset email:", err.message);
  }
}

async function sendWelcomeEmail({ to, name }) {
  const transporter = getTransporter();
  if (!transporter || !to) return;

  const baseUrl = process.env.APP_BASE_URL || "http://localhost:5173";

  const mailOptions = {
    from: process.env.SMTP_FROM || `"MediTrack" <${process.env.SMTP_USER}>`,
    to,
    subject: `Welcome to MediTrack! 🌟`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
        <!-- Header -->
        <div style="background-color: #2563eb; padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Welcome to MediTrack!</h1>
          <p style="color: #bfdbfe; margin-top: 10px; font-size: 16px;">Your health journey starts here</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <p style="color: #475569; line-height: 1.6; font-size: 16px;">
            Hi <strong>${name}</strong>,
          </p>
          <p style="color: #475569; line-height: 1.6; font-size: 16px;">
            We're thrilled to have you on board! MediTrack is designed to make managing your health and your family's well-being simple and stress-free.
          </p>
          
          <h3 style="color: #1e293b; margin-top: 30px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Here's what you can do:</h3>
          
          <ul style="list-style: none; padding: 0; margin: 20px 0;">
            <li style="margin-bottom: 15px; display: flex; align-items: flex-start;">
              <span style="color: #2563eb; font-size: 18px; margin-right: 10px;">💊</span>
              <div>
                <strong style="color: #334155;">Track Medicines</strong>
                <p style="margin: 4px 0 0; color: #64748b; font-size: 14px;">Set schedules and never miss a dose with smart reminders.</p>
              </div>
            </li>
            <li style="margin-bottom: 15px; display: flex; align-items: flex-start;">
              <span style="color: #2563eb; font-size: 18px; margin-right: 10px;">👨‍👩‍👧‍👦</span>
              <div>
                <strong style="color: #334155;">Family Management</strong>
                <p style="margin: 4px 0 0; color: #64748b; font-size: 14px;">Connect with family members to monitor their health adherence.</p>
              </div>
            </li>
            <li style="margin-bottom: 15px; display: flex; align-items: flex-start;">
              <span style="color: #2563eb; font-size: 18px; margin-right: 10px;">📊</span>
              <div>
                <strong style="color: #334155;">Health Insights</strong>
                <p style="margin: 4px 0 0; color: #64748b; font-size: 14px;">Visualize your progress with intuitive dashboards.</p>
              </div>
            </li>
          </ul>
          
          <div style="text-align: center; margin-top: 40px;">
            <a href="${baseUrl}/dashboard" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
              Go to Dashboard
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 14px; margin-bottom: 10px;">
            We're here to help! If you have any questions, just reply to this email.
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            &copy; ${new Date().getFullYear()} MediTrack. All rights reserved.
          </p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Welcome email sent:", info.messageId);
  } catch (err) {
    console.error("❌ Failed to send welcome email:", err.message);
  }
}
