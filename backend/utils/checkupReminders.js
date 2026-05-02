const Checkup = require('../models/Checkup');
const { sendEmail } = require('./sendEmail');

const sendCheckupReminders = async () => {
  try {
    console.log('📅 Starting checkup reminder scan...');
    // Start and end of today in UTC to be safe
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    console.log(`🔍 Searching for checkups between ${startOfToday.toISOString()} and ${endOfToday.toISOString()}`);

    // Find all checkups that are scheduled for today and haven't been reminded yet
    const checkupsToday = await Checkup.find({
      date: { $gte: startOfToday, $lte: endOfToday },
      reminded: false
    }).populate('user', 'name email');

    console.log(`📈 Found ${checkupsToday.length} checkups to remind.`);

    for (const checkup of checkupsToday) {
      if (checkup.user && checkup.user.email) {
        console.log(`📧 Sending email to ${checkup.user.email} for checkup: ${checkup.title}`);
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: ${checkup.color || '#10b981'};">📅 Checkup Reminder: ${checkup.title}</h2>
            <p>Hello <strong>${checkup.user.name}</strong>,</p>
            <p>This is a reminder that you have a checkup scheduled for today!</p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid ${checkup.color || '#10b981'}; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 5px 0;"><strong>Title:</strong> ${checkup.title}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> ${checkup.time}</p>
              <p style="margin: 5px 0;"><strong>Location:</strong> ${checkup.location}</p>
              ${checkup.notes ? `<p style="margin: 5px 0;"><strong>Notes:</strong> ${checkup.notes}</p>` : ''}
            </div>
            
            <p>Please make sure to arrive on time. Have a great day!</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">This is an automated message from MediTrack.</p>
          </div>
        `;

        const result = await sendEmail({
          to: checkup.user.email,
          subject: `📅 Checkup Today: ${checkup.title} at ${checkup.time}`,
          html,
        });

        if (result.success) {
          console.log(`✅ Successfully sent email to ${checkup.user.email}`);
          checkup.reminded = true;
          await checkup.save();
        } else {
          console.error(`❌ Failed to send email to ${checkup.user.email}:`, result.error);
        }
      } else {
        console.warn(`⚠️ Checkup ${checkup._id} has no associated user or email.`);
      }
    }

    console.log(`✅ Processed ${checkupsToday.length} checkup reminders for today.`);
  } catch (error) {
    console.error('❌ Error sending checkup reminders:', error);
  }
};

module.exports = { sendCheckupReminders };
