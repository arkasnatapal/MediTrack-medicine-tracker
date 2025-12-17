const nodemailer = require("nodemailer");

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number("465"),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

async function sendReminderEmail({ to, title, message, reminder }) {
  const tx = getTransporter();
  if (!tx || !to) return;

  const mailOptions = {
    from: process.env.SMTP_FROM || `"MediTrack" <${process.env.SMTP_USER}>`,
    to,
    subject: `[MediTrack] ${title}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#2563eb;margin-bottom:8px;">${title}</h2>
        <p>${message}</p>
        ${
          reminder?.medicineName
            ? `<p><strong>Medicine:</strong> ${reminder.medicineName}</p>`
            : ""
        }
        ${
          reminder?.times?.length
            ? `<p><strong>Scheduled time(s):</strong> ${reminder.times.join(
                ", "
              )}</p>`
            : ""
        }
        <p style="color:#999;font-size:12px;margin-top:24px;">
          This is an automated reminder from MediTrack. Always follow your doctor's instructions.
        </p>
      </div>
    `,
  };

  try {
    await tx.sendMail(mailOptions);
  } catch (err) {
    console.error("Error sending reminder email:", err.message);
  }
}

module.exports = { sendReminderEmail };
