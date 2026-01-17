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

  const baseUrl = process.env.APP_BASE_URL || "https://meditrack-ultimate.vercel.app";
    const inviteLink = `${baseUrl}/family`;
  // const inviteLink = `${baseUrl}/family/invitations?connectionId=${familyConnectionId}`;

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
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Family Invitation</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">MediTrack</h1>
              <p style="color: #ecfdf5; margin: 10px 0 0; font-size: 16px; font-weight: 500;">Family Connection Request</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1e293b; margin-top: 0; font-size: 22px; font-weight: 700;">You've been invited! 🎉</h2>
              <p style="color: #475569; line-height: 1.6; font-size: 16px; margin-bottom: 24px;">
                Hi there,<br><br>
                <strong>${inviterName}</strong> wants to add you to their family circle on MediTrack. This will allow you to share medicine schedules and monitor each other's health adherence.
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${inviteLink}" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; transition: all 0.3s ease; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);">
                  Accept Invitation
                </a>
              </div>
              
              <p style="color: #64748b; font-size: 14px; line-height: 1.5; text-align: center;">
                If you don't recognize this person, you can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                &copy; ${new Date().getFullYear()} MediTrack. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Family invite email sent:", info.messageId);
  } catch (err) {
    console.error("❌ Failed to send family invite email:", err.message);
  }
}

   
async function sendRiskAlertEmail({ to, name, score, issues, suggestions }) {
  const transporter = getTransporter();
  if (!transporter || !to) return;

  const baseUrl = process.env.APP_BASE_URL || "https://meditrack-ultimate.vercel.app";
  const issuesList = issues.map(i => `<li style="margin-bottom: 8px;">${i}</li>`).join('');
  // const suggestionsList = suggestions.map(s => `<li style="margin-bottom: 8px;">${s}</li>`).join('');

  const mailOptions = {
    from: process.env.SMTP_FROM || `"MediTrack Health AI" <${process.env.SMTP_USER}>`,
    to,
    subject: `⚠️ Critical Health Alert: Score ${score}`,
    text: `Your health score has dropped to ${score}. Please check the app.`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Health Risk Alert</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #fff1f2; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; margin-top: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">MediTrack Intelligence</h1>
              <p style="color: #fce7f3; margin: 5px 0 0; font-weight: 600;">CRITICAL ALERT</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #be123c; margin-top: 0;">Attention Needed, ${name}</h2>
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Our system has detected a significant drop in your adherence consistency. Your current Health Score is <strong style="color: #be123c; font-size: 18px;">${score}/100</strong>.
              </p>
              
              <div style="background-color: #fff1f2; border-left: 4px solid #e11d48; padding: 15px; margin: 25px 0;">
                <h3 style="color: #9f1239; margin: 0 0 10px 0; font-size: 16px;">Identified Issues:</h3>
                <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
                  ${issuesList}
                </ul>
              </div>

              <p style="color: #374151;">
                We recommend checking your app to log any missed doses or update your schedule.
              </p>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${baseUrl}/dashboard" style="display: inline-block; background-color: #e11d48; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Open Dashboard
                </a>
              </div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Risk alert email sent to:", to);
  } catch (err) {
    console.error("❌ Failed to send risk email:", err.message);
  }
}

module.exports = {
  sendFamilyInviteEmail,
  sendOtpEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendFamilyAccessOtpEmail,
  sendDoctorAccessOtpEmail,
  sendRiskAlertEmail
};

async function sendFamilyAccessOtpEmail({ to, otp, patientName, requesterName }) {
  const transporter = getTransporter();
  if (!transporter || !to) return;

  const mailOptions = {
    from: process.env.SMTP_FROM || `"MediTrack" <${process.env.SMTP_USER}>`,
    to,
    subject: `Emergency Access Code for ${patientName} - MediTrack`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Emergency Access Code</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">MediTrack</h1>
              <p style="color: #fef2f2; margin: 10px 0 0; font-size: 16px; font-weight: 500;">Emergency Access Request</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1e293b; margin-top: 0; font-size: 20px; font-weight: 700;">Access requested by ${requesterName}</h2>
              <p style="color: #475569; line-height: 1.6; font-size: 16px; margin-bottom: 24px;">
                <strong>${requesterName}</strong> has requested to view your medical reports in MediTrack.
                <br><br>
                Please use the code below to authorize this access:
              </p>
              
              <div style="background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 12px; padding: 24px; text-align: center; margin: 32px 0;">
                <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: 700; color: #dc2626; letter-spacing: 6px;">${otp}</span>
              </div>
              
              <p style="color: #64748b; font-size: 14px; text-align: center; margin-bottom: 0;">
                This code will expire in 3 minutes.<br>
                If you are not aware of this access request, please contact the patient immediately.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                &copy; ${new Date().getFullYear()} MediTrack. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Family access OTP email sent:", info.messageId);
  } catch (err) {
    console.error("❌ Failed to send family access OTP email:", err.message);
  }
}

async function sendOtpEmail({ to, otp, name }) {
  const transporter = getTransporter();
  if (!transporter || !to) return;

  const mailOptions = {
    from: process.env.SMTP_FROM || `"MediTrack" <${process.env.SMTP_USER}>`,
    to,
    subject: `Your Verification Code - MediTrack`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Email</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">MediTrack</h1>
              <p style="color: #ecfdf5; margin: 10px 0 0; font-size: 16px; font-weight: 500;">Verification Code</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1e293b; margin-top: 0; font-size: 22px; font-weight: 700;">Verify your email address</h2>
              <p style="color: #475569; line-height: 1.6; font-size: 16px; margin-bottom: 24px;">
                Hi <strong>${name}</strong>,<br><br>
                Thank you for choosing MediTrack! Please use the code below to complete your verification.
              </p>
              
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; text-align: center; margin: 32px 0;">
                <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: 700; color: #059669; letter-spacing: 6px;">${otp}</span>
              </div>
              
              <p style="color: #64748b; font-size: 14px; text-align: center; margin-bottom: 0;">
                This code will expire in 10 minutes.<br>
                If you didn't create an account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                &copy; ${new Date().getFullYear()} MediTrack. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
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
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Password</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">MediTrack</h1>
              <p style="color: #ecfdf5; margin: 10px 0 0; font-size: 16px; font-weight: 500;">Password Reset</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1e293b; margin-top: 0; font-size: 22px; font-weight: 700;">Reset your password</h2>
              <p style="color: #475569; line-height: 1.6; font-size: 16px; margin-bottom: 24px;">
                Hi <strong>${name}</strong>,<br><br>
                We received a request to reset your password. Use the code below to proceed.
              </p>
              
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; text-align: center; margin: 32px 0;">
                <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: 700; color: #059669; letter-spacing: 6px;">${otp}</span>
              </div>
              
              <p style="color: #64748b; font-size: 14px; text-align: center; margin-bottom: 0;">
                This code will expire in 10 minutes.<br>
                If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                &copy; ${new Date().getFullYear()} MediTrack. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
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

  const baseUrl = process.env.APP_BASE_URL || "https://meditrack-ultimate.vercel.app";

  const mailOptions = {
    from: process.env.SMTP_FROM || `"MediTrack" <${process.env.SMTP_USER}>`,
    to,
    subject: `Welcome to MediTrack! 🌟`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to MediTrack</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">MediTrack</h1>
              <p style="color: #ecfdf5; margin: 10px 0 0; font-size: 16px; font-weight: 500;">Welcome Aboard!</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #475569; line-height: 1.6; font-size: 16px; margin-bottom: 24px;">
                Hi <strong>${name}</strong>,<br><br>
                We're thrilled to have you here! MediTrack is your new companion for a healthier, more organized life.
              </p>
              
              <h3 style="color: #1e293b; margin-top: 32px; margin-bottom: 20px; font-size: 18px; font-weight: 700;">What you can do now:</h3>
              
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="40" valign="top" style="padding-bottom: 20px;">
                    <span style="font-size: 24px;">💊</span>
                  </td>
                  <td valign="top" style="padding-bottom: 20px;">
                    <strong style="color: #334155; display: block; margin-bottom: 4px;">Track Medicines</strong>
                    <span style="color: #64748b; font-size: 14px; line-height: 1.5;">Never miss a dose with smart reminders.</span>
                  </td>
                </tr>
                <tr>
                  <td width="40" valign="top" style="padding-bottom: 20px;">
                    <span style="font-size: 24px;">👨‍👩‍👧‍👦</span>
                  </td>
                  <td valign="top" style="padding-bottom: 20px;">
                    <strong style="color: #334155; display: block; margin-bottom: 4px;">Family Hub</strong>
                    <span style="color: #64748b; font-size: 14px; line-height: 1.5;">Care for your loved ones in one place.</span>
                  </td>
                </tr>
                <tr>
                  <td width="40" valign="top" style="padding-bottom: 20px;">
                    <span style="font-size: 24px;">📊</span>
                  </td>
                  <td valign="top" style="padding-bottom: 20px;">
                    <strong style="color: #334155; display: block; margin-bottom: 4px;">Health Insights</strong>
                    <span style="color: #64748b; font-size: 14px; line-height: 1.5;">Visualize your progress with AI analytics.</span>
                  </td>
                </tr>
              </table>
              
              <div style="text-align: center; margin-top: 32px;">
                <a href="${baseUrl}/dashboard" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; transition: all 0.3s ease; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);">
                  Go to Dashboard
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                &copy; ${new Date().getFullYear()} MediTrack. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Welcome email sent:", info.messageId);
  } catch (err) {
    console.error("❌ Failed to send welcome email:", err.message);
  }
}

async function sendDoctorAccessOtpEmail({ to, otp, patientName }) {
  const transporter = getTransporter();
  if (!transporter || !to) return;

  const mailOptions = {
    from: process.env.SMTP_FROM || `"MediTrack" <${process.env.SMTP_USER}>`,
    to,
    subject: `Doctor Access Request for ${patientName} - MediTrack`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Doctor Access Verification</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">MediTrack</h1>
              <p style="color: #dbeafe; margin: 10px 0 0; font-size: 16px; font-weight: 500;">Medical Access Request</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1e293b; margin-top: 0; font-size: 20px; font-weight: 700;">Doctor Access Requested</h2>
              <p style="color: #475569; line-height: 1.6; font-size: 16px; margin-bottom: 24px;">
                A medical professional has requested access to your (<strong>${patientName}</strong>) full medical records and health intelligence.
                <br><br>
                Please provide this code to the doctor to authorize access:
              </p>
              
              <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 24px; text-align: center; margin: 32px 0;">
                <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: 700; color: #1d4ed8; letter-spacing: 6px;">${otp}</span>
              </div>
              
              <p style="color: #64748b; font-size: 14px; text-align: center; margin-bottom: 0;">
                This code will expire in 5 minutes.<br>
                If you are not at a medical appointment, please ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                &copy; ${new Date().getFullYear()} MediTrack. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Doctor access OTP email sent:", info.messageId);
  } catch (err) {
    console.error("❌ Failed to send doctor access OTP email:", err.message);
  }
}
