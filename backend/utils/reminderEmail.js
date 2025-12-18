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

  const baseUrl = process.env.APP_BASE_URL || "https://meditrack-ultimate.vercel.app";

  const mailOptions = {
    from: process.env.SMTP_FROM || `"MediTrack" <${process.env.SMTP_USER}>`,
    to,
    subject: `[MediTrack] ${title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Medicine Reminder</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">MediTrack</h1>
              <p style="color: #ecfdf5; margin: 10px 0 0; font-size: 16px; font-weight: 500;">Medicine Reminder</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1e293b; margin-top: 0; font-size: 22px; font-weight: 700; margin-bottom: 16px;">${title}</h2>
              <p style="color: #475569; line-height: 1.6; font-size: 16px; margin-bottom: 24px;">
                ${message}
              </p>
              
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                ${
                  reminder?.medicineName
                    ? `<div style="margin-bottom: 12px;">
                        <span style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Medicine</span>
                        <div style="color: #1e293b; font-size: 18px; font-weight: 600; margin-top: 4px;">${reminder.medicineName}</div>
                       </div>`
                    : ""
                }
                ${
                  reminder?.times?.length
                    ? `<div>
                        <span style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Scheduled Time</span>
                        <div style="color: #059669; font-size: 18px; font-weight: 600; margin-top: 4px;">${reminder.times.join(", ")}</div>
                       </div>`
                    : ""
                }
              </div>

              <div style="text-align: center; margin-bottom: 16px;">
                <a href="${baseUrl}/dashboard" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; transition: all 0.3s ease; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);">
                  Mark as Taken
                </a>
              </div>
              <p style="text-align: center; color: #94a3b8; font-size: 14px;">
                Click above to mark this reminder as taken.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px; margin-bottom: 8px;">
                Always follow your doctor's instructions.
              </p>
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                &copy; ${new Date().getFullYear()} MediTrack. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };

  try {
    await tx.sendMail(mailOptions);
  } catch (err) {
    console.error("Error sending reminder email:", err.message);
  }
}

module.exports = { sendReminderEmail };
