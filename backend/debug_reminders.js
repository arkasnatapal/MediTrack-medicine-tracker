const mongoose = require('mongoose');
const Reminder = require('./models/Reminder');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  }
};

function getRobustIST() {
  const now = new Date();
  const utcOffset = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(utcOffset + istOffset);
  
  const hours = istDate.getHours().toString().padStart(2, '0');
  const minutes = istDate.getMinutes().toString().padStart(2, '0');
  const dayIndex = istDate.getDay();
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  
  return { hhmm: `${hours}:${minutes}`, today: days[dayIndex] };
}

async function debugReminders() {
  await connectDB();
  
  const { hhmm, today } = getRobustIST();
  console.log(`CHECKING FOR: ${hhmm} on ${today}`);
  
  const reminders = await Reminder.find({ active: true });
  console.log(`TOTAL REMINDERS: ${reminders.length}`);
  
  reminders.forEach(r => {
    console.log(`ID: ${r._id} | Name: ${r.medicineName} | Times: ${JSON.stringify(r.times)}`);
  });
  
  process.exit();
}

debugReminders();
