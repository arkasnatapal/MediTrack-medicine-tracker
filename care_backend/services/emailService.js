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

async function sendBedAdmissionApprovedEmail({ to, patientName, facilityName, admissionPassNumber, allottedBedNumber, allottedBedType, department, hospitalNotes }) {
  console.log(`\n=======================================================================`);
  console.log(`📧 [GMAIL SMTP DISPATCHING BED ALLOTMENT EMAIL]`);
  console.log(`To: ${to}`);
  console.log(`Patient: ${patientName} • Hospital: ${facilityName}`);
  console.log(`Pass #: ${admissionPassNumber} • Bed Tag: ${allottedBedNumber}`);
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
      subject: `🟢 Confirmed: Hospital Bed #${allottedBedNumber} Allotted at ${facilityName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 25px; background-color: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #14b8a6; margin: 0;">🏥 MediTrack Hospital Admission & Bed Allotted</h2>
            <p style="color: #94a3b8; font-size: 13px;">Official Inpatient Admission Confirmation Pass</p>
          </div>
          
          <p>Dear <strong>${patientName}</strong>,</p>
          <p>Your bed booking & hospital admission request for <strong>${facilityName}</strong> has been <strong style="color: #22c55e;">APPROVED</strong> and a bed has been successfully allotted by the hospital admission desk.</p>
          
          <div style="background-color: #1e293b; padding: 18px; border-radius: 10px; border-left: 4px solid #14b8a6; margin: 20px 0;">
            <p style="margin: 6px 0; color: #94a3b8;">Admission Pass #: <strong style="color: #f8fafc; font-family: monospace;">#${admissionPassNumber}</strong></p>
            <p style="margin: 6px 0; color: #94a3b8;">Allotted Bed Tag: <strong style="color: #38bdf8; font-size: 1.15em;">#${allottedBedNumber}</strong></p>
            <p style="margin: 6px 0; color: #94a3b8;">Bed Category: <strong style="color: #22c55e;">${allottedBedType}</strong></p>
            <p style="margin: 6px 0; color: #94a3b8;">Hospital Unit: <strong>${department}</strong></p>
          </div>

          ${hospitalNotes ? `
            <div style="background-color: #334155; padding: 12px 16px; border-radius: 8px; font-size: 13px; color: #cbd5e1; margin-bottom: 20px;">
              <strong>Hospital Admission Notes:</strong> ${hospitalNotes}
            </div>
          ` : ''}

          <p style="font-size: 13px; color: #cbd5e1;">Please present your Admission Pass Number (<strong>#${admissionPassNumber}</strong>) and government ID when arriving at <strong>${facilityName}</strong>.</p>
          
          <hr style="border: 0; border-top: 1px solid #334155; margin-top: 25px;" />
          <p style="font-size: 11px; color: #64748b; text-align: center;">MediTrack Healthcare Ecosystem • Automated Admission Notification</p>
        </div>
      `,
    });

    console.log(`✅ [LIVE BED ALLOTMENT EMAIL SENT SUCCESSFUL] Message ID: ${info.messageId}\n`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ Bed Allotment Email Error:', err.message);
    return { success: false, error: err.message };
  }
}

async function sendBedDischargedEmail({ to, patientName, facilityName, admissionPassNumber, dischargedAt, summaryNotes }) {
  try {
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const smtpUser = process.env.SMTP_USER || 'meditrack.ultimate.team@gmail.com';
    const smtpPass = process.env.SMTP_PASS || 'xeziabkszaohmvda';

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      auth: { user: smtpUser, pass: smtpPass },
    });

    const fromAddress = process.env.SMTP_FROM || `"MediTrack Care Network" <${smtpUser}>`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject: `🏥 Hospital Discharge Summary: Pass #${admissionPassNumber} at ${facilityName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 25px; background-color: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #38bdf8; margin: 0;">🏥 Official Hospital Discharge Summary</h2>
            <p style="color: #94a3b8; font-size: 13px;">Inpatient Discharge & Recovery Clearance</p>
          </div>
          
          <p>Dear <strong>${patientName}</strong>,</p>
          <p>You have been officially <strong style="color: #38bdf8;">DISCHARGED</strong> from inpatient care at <strong>${facilityName}</strong>. Your reserved hospital bed has been released.</p>
          
          <div style="background-color: #1e293b; padding: 18px; border-radius: 10px; border-left: 4px solid #38bdf8; margin: 20px 0;">
            <p style="margin: 6px 0; color: #94a3b8;">Admission Pass #: <strong style="color: #f8fafc; font-family: monospace;">#${admissionPassNumber}</strong></p>
            <p style="margin: 6px 0; color: #94a3b8;">Discharge Date & Time: <strong style="color: #38bdf8;">${new Date(dischargedAt || Date.now()).toLocaleString()}</strong></p>
            <p style="margin: 6px 0; color: #94a3b8;">Status: <strong style="color: #22c55e;">COMPLETED / DISCHARGED</strong></p>
          </div>

          ${summaryNotes ? `
            <div style="background-color: #334155; padding: 12px 16px; border-radius: 8px; font-size: 13px; color: #cbd5e1; margin-bottom: 20px;">
              <strong>Discharge Summary & Instructions:</strong> ${summaryNotes}
            </div>
          ` : ''}

          <p style="font-size: 13px; color: #cbd5e1;">Thank you for choosing <strong>${facilityName}</strong>. We wish you a fast and full recovery!</p>
          
          <hr style="border: 0; border-top: 1px solid #334155; margin-top: 25px;" />
          <p style="font-size: 11px; color: #64748b; text-align: center;">MediTrack Healthcare Ecosystem • Automated Discharge Notification</p>
        </div>
      `,
    });

    console.log(`✅ [LIVE BED DISCHARGE EMAIL SENT] Message ID: ${info.messageId}\n`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ Bed Discharge Email Error:', err.message);
    return { success: false, error: err.message };
  }
}

async function sendBedWardShiftedEmail({ to, patientName, facilityName, admissionPassNumber, newBedNumber, hospitalNotes }) {
  try {
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const smtpUser = process.env.SMTP_USER || 'meditrack.ultimate.team@gmail.com';
    const smtpPass = process.env.SMTP_PASS || 'xeziabkszaohmvda';

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      auth: { user: smtpUser, pass: smtpPass },
    });

    const fromAddress = process.env.SMTP_FROM || `"MediTrack Care Network" <${smtpUser}>`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject: `🛏️ Shifted to General Ward: Bed #${newBedNumber} at ${facilityName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 25px; background-color: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #a855f7; margin: 0;">🛏️ Patient General Ward Shift Notice</h2>
            <p style="color: #94a3b8; font-size: 13px;">Inpatient Ward Transfer Confirmation</p>
          </div>
          
          <p>Dear <strong>${patientName}</strong>,</p>
          <p>Your inpatient bed at <strong>${facilityName}</strong> has been transferred to the <strong style="color: #a855f7;">General Medicine Ward</strong> for continued recovery.</p>
          
          <div style="background-color: #1e293b; padding: 18px; border-radius: 10px; border-left: 4px solid #a855f7; margin: 20px 0;">
            <p style="margin: 6px 0; color: #94a3b8;">Admission Pass #: <strong style="color: #f8fafc; font-family: monospace;">#${admissionPassNumber}</strong></p>
            <p style="margin: 6px 0; color: #94a3b8;">New Ward Bed Tag: <strong style="color: #c084fc; font-size: 1.15em;">#${newBedNumber}</strong></p>
            <p style="margin: 6px 0; color: #94a3b8;">Bed Category: <strong style="color: #a855f7;">General Ward</strong></p>
          </div>

          ${hospitalNotes ? `
            <div style="background-color: #334155; padding: 12px 16px; border-radius: 8px; font-size: 13px; color: #cbd5e1; margin-bottom: 20px;">
              <strong>Ward Transfer Notes:</strong> ${hospitalNotes}
            </div>
          ` : ''}

          <p style="font-size: 13px; color: #cbd5e1;">Your medical records and care journey have been updated with your new bed assignment (<strong>#${newBedNumber}</strong>).</p>
          
          <hr style="border: 0; border-top: 1px solid #334155; margin-top: 25px;" />
          <p style="font-size: 11px; color: #64748b; text-align: center;">MediTrack Healthcare Ecosystem • Automated Ward Transfer Notification</p>
        </div>
      `,
    });

    console.log(`✅ [LIVE BED WARD SHIFT EMAIL SENT] Message ID: ${info.messageId}\n`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ Bed Ward Shift Email Error:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendTeleconsultationEmail, sendBedAdmissionApprovedEmail, sendBedDischargedEmail, sendBedWardShiftedEmail };


