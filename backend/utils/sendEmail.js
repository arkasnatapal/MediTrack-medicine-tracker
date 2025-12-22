const transporter = require('../config/emailConfig');

const sendEmail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || `"MediTrack" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email error:', error.message);
    return { success: false, error: error.message };
  }
};

const sendExpiryReminder = async (user, medicine) => {
  const daysUntilExpiry = Math.ceil((new Date(medicine.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #dc2626;">⚠️ Medicine Expiry Reminder</h2>
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>This is a reminder that your medicine <strong>${medicine.name}</strong> is expiring soon!</p>
      
      <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Medicine:</strong> ${medicine.name}</p>
        <p style="margin: 5px 0;"><strong>Category:</strong> ${medicine.category}</p>
        <p style="margin: 5px 0;"><strong>Expiry Date:</strong> ${new Date(medicine.expiryDate).toLocaleDateString()}</p>
        <p style="margin: 5px 0;"><strong>Days Remaining:</strong> ${daysUntilExpiry} day(s)</p>
        <p style="margin: 5px 0;"><strong>Quantity:</strong> ${medicine.quantity}</p>
      </div>
      
      <p>Please ensure to use or dispose of this medicine before it expires.</p>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">This is an automated message from MediTrack. Please do not reply to this email.</p>
    </div>
  `;

  return await sendEmail({
    to: user.email,
    subject: `⚠️ Medicine Expiry Alert: ${medicine.name}`,
    html,
  });
};

const sendLowStockAlert = async (user, medicine) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #f59e0b;">⚠️ Low Stock Alert</h2>
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>This is a gentle reminder that your medicine <strong>${medicine.name}</strong> is running low.</p>
      
      <div style="background-color: #fffbeb; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Medicine:</strong> ${medicine.name}</p>
        <p style="margin: 5px 0;"><strong>Quantity Left:</strong> <span style="font-size: 1.2em; font-weight: bold; color: #d97706;">${medicine.quantity}</span></p>
        <p style="margin: 5px 0;"><strong>Dosage:</strong> ${medicine.dosage || 'N/A'}</p>
      </div>
      
      <p>Please ensure to refill your prescription soon to avoid missing any doses.</p>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">This is an automated message from MediTrack.</p>
    </div>
  `;

  return await sendEmail({
    to: user.email,
    subject: `⚠️ Low Stock Alert: ${medicine.name}`,
    html,
  });
};

const sendOutOfStockAlert = async (user, medicine) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #dc2626;">🚨 Out of Stock Alert</h2>
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>You have run out of your medicine <strong>${medicine.name}</strong>.</p>
      
      <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Medicine:</strong> ${medicine.name}</p>
        <p style="margin: 5px 0;"><strong>Quantity Left:</strong> <span style="font-size: 1.2em; font-weight: bold; color: #dc2626;">0</span></p>
      </div>
      
      <p style="font-weight: bold;">Please refill immediately to continue with your medical journey.</p>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">This is an automated message from MediTrack.</p>
    </div>
  `;

  return await sendEmail({
    to: user.email,
    subject: `🚨 Out of Stock: ${medicine.name}`,
    html,
  });
};

module.exports = { sendEmail, sendExpiryReminder, sendLowStockAlert, sendOutOfStockAlert };
