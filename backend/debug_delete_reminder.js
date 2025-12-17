const mongoose = require('mongoose');
const Reminder = require('./models/Reminder');
const User = require('./models/User');
const Medicine = require('./models/Medicine');
require('dotenv').config();

async function debugDelete() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // 1. Create a dummy user
    const user = await User.create({
      name: 'Debug User',
      email: `debug_${Date.now()}@test.com`,
      password: 'password123'
    });
    console.log('Created User:', user._id);

    // 2. Create a dummy medicine
    const medicine = await Medicine.create({
      name: 'Debug Med',
      dosage: '500mg',
      userId: user._id,
      quantity: 10,
      expiryDate: new Date()
    });
    console.log('Created Medicine:', medicine._id);

    // 3. Create a reminder
    const reminder = await Reminder.create({
      targetUser: user._id,
      createdBy: user._id,
      medicine: medicine._id,
      medicineName: 'Debug Med',
      startDate: new Date(),
      times: ['09:00'],
      watchers: [] // Empty watchers
    });
    console.log('Created Reminder:', reminder._id);

    // 4. Simulate Delete Logic
    const userId = user._id.toString();
    
    // Fetch without population first (like the route)
    const fetchedReminder = await Reminder.findById(reminder._id);
    
    console.log(`[DEBUG] User: ${userId}`);
    console.log(`[DEBUG] Creator: ${fetchedReminder.createdBy}`);
    console.log(`[DEBUG] Target: ${fetchedReminder.targetUser}`);
    console.log(`[DEBUG] Watchers:`, fetchedReminder.watchers);
    
    const canDelete = 
      fetchedReminder.createdBy.toString() === userId ||
      fetchedReminder.targetUser.toString() === userId ||
      fetchedReminder.watchers.some(w => w.toString() === userId);

    console.log(`[DEBUG] Can Delete: ${canDelete}`);

    if (canDelete) {
      await Reminder.findByIdAndDelete(reminder._id);
      console.log('✅ Reminder deleted successfully');
    } else {
      console.error('❌ Failed to delete reminder');
    }

    // Cleanup
    await User.findByIdAndDelete(user._id);
    await Medicine.findByIdAndDelete(medicine._id);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

debugDelete();
