const Medicine = require('../models/Medicine');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ReminderLog = require('../models/ReminderLog');
const { sendExpiryReminder } = require('./sendEmail');

const checkExpiredMedicines = async () => {
  try {
    console.log('🔍 Checking for expiring medicines...');
    
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const expiringMedicines = await Medicine.find({
      expiryDate: { $lte: threeDaysFromNow, $gte: new Date() },
      reminderSent: false,
    }).populate('userId');

    console.log(`Found ${expiringMedicines.length} medicines expiring within 3 days`);

    for (const medicine of expiringMedicines) {
      try {
        const user = medicine.userId;
        
        // 1. Send Email
        const result = await sendExpiryReminder(user, medicine);
        
        // 2. Create In-App Notification
        await Notification.create({
          user: user._id,
          title: 'Medicine Expiring Soon',
          message: `Your medicine ${medicine.name} is expiring on ${new Date(medicine.expiryDate).toLocaleDateString()}.`,
          type: 'medicine_expiring',
          severity: 'warning',
          meta: {
            actionLink: '/medicines'
          }
        });

        const reminderLog = new ReminderLog({
          userId: user._id,
          medicineId: medicine._id,
          medicineName: medicine.name,
          expiryDate: medicine.expiryDate,
          emailSent: result.success,
          error: result.error || null,
        });
        await reminderLog.save();

        if (result.success) {
          medicine.reminderSent = true;
          await medicine.save();
          console.log(`✅ Reminder sent for ${medicine.name} to ${user.email}`);
        } else {
          console.log(`❌ Failed to send reminder for ${medicine.name}`);
        }
      } catch (error) {
        console.error(`Error processing medicine ${medicine.name}:`, error.message);
      }
    }

    return { success: true, count: expiringMedicines.length };
  } catch (error) {
    console.error('Error in checkExpiredMedicines:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { checkExpiredMedicines };
