const nodemailer = require('nodemailer');

// Helper to send teleconsultation confirmation email with meeting join link
async function sendTeleconsultationEmail({ to, patientName, hospitalName, doctorName, specialty, scheduledTime, meetingLink }) {
  console.log(`\n=======================================================================`);
  console.log(`📧 [GMAIL SMTP DISPATCHING LIVE EMAIL TO PATIENT]`);
  console.log(`To: ${to}`);
  console.log(`From: ${process.env.SMTP_USER || 'meditrack.ultimate.team@gmail.com'}`);
  console.log(`Subject: Confirmed: Teleconsultation Session with Dr. ${doctorName}`);
  console.log(`Patient: ${patientName} • Hospital: ${hospitalName}`);
  console.log(`Scheduled Time: ${scheduledTime}`);
  console.log(`Direct Join Link: ${meetingLink}`);
  console.log(`=======================================================================\n`);

  try {
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const smtpUser = process.env.SMTP_USER || 'meditrack.ultimate.team@gmail.com';
    const smtpPass = process.env.SMTP_PASS || 'xeziabkszaohmvda';

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const fromAddress = process.env.SMTP_FROM || `"MediTrack Care Network" <${smtpUser}>`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject: `Confirmed: Teleconsultation Session with Dr. ${doctorName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 25px; background-color: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b;">
          <h2 style="color: #14b8a6; margin-top: 0;">🏥 MediTrack Teleconsultation Confirmed</h2>
          <p>Dear <strong>${patientName}</strong>,</p>
          <p>Your specialist consultation request at <strong>${hospitalName}</strong> has been assigned to <strong>Dr. ${doctorName}</strong> (${specialty}).</p>
          <p style="background-color: #1e293b; padding: 12px; border-radius: 8px; font-weight: bold;">
            📅 Scheduled Time: <span style="color: #38bdf8;">${scheduledTime}</span>
          </p>
          <div style="margin: 25px 0;">
            <a href="${meetingLink}" style="background-color: #14b8a6; color: #020617; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(20,184,166,0.3);">
              📹 Join Teleconsultation Session
            </a>
          </div>
          <p style="font-size: 12px; color: #94a3b8;">Direct Meeting Link: <a href="${meetingLink}" style="color: #38bdf8;">${meetingLink}</a></p>
          <hr style="border: 0; border-top: 1px solid #334155; margin-top: 20px;" />
          <p style="font-size: 11px; color: #64748b;">MediTrack Care Network Ecosystem • Automated System Notification</p>
        </div>
      `,
    });

    console.log(`✅ [LIVE GMAIL DISPATCH SUCCESSFUL] Message ID: ${info.messageId}\n`);
  } catch (err) {
    console.error('❌ Gmail SMTP Dispatch Error:', err.message);
  }

  return { success: true, emailSentTo: to, meetingLink };
}

module.exports = { sendTeleconsultationEmail };
