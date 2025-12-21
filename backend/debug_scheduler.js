require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Reminder = require('./models/Reminder');
const { executeReminderCheck } = require('./jobs/reminderScheduler');

async function debugRun() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("🔌 Connected to DB");

  const now = new Date();
  // Simulate IST
  const utcOffset = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(utcOffset + istOffset);
  
  console.log("🕒 System Time (Local):", now.toString());
  console.log("🇮🇳 Calculated IST:", ist.toString());
  console.log("   ISO:", ist.toISOString());

  // Check what reminders exist for today
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const todayDay = days[ist.getDay()];
  console.log("📅 Today is:", todayDay);

  const allReminders = await Reminder.find({ active: true });
  console.log(`📋 Total Active Reminders in DB: ${allReminders.length}`);
  
  allReminders.forEach(r => {
    console.log(`   - ID: ${r._id} | Med: ${r.medicineName} | Times: ${r.times} | Days: ${r.daysOfWeek} | Start: ${r.startDate.toISOString()} | End: ${r.endDate ? r.endDate.toISOString() : 'null'}`);
  });

  console.log("\n🚀 Running Scheduler Logic...");
  await executeReminderCheck();

  // Keep alive briefly to allow async tasks (emails) to finish if any
  setTimeout(() => {
    console.log("👋 Exiting debug script");
    mongoose.connection.close();
  }, 5000);
}

debugRun();
