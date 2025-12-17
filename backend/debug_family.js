const mongoose = require('mongoose');
const User = require('./models/User');
const FamilyConnection = require('./models/FamilyConnection');
require('dotenv').config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const users = await User.find({});
    console.log('--- Users ---');
    users.forEach(u => console.log(`${u._id} | ${u.email} | ${u.name}`));

    const connections = await FamilyConnection.find({});
    console.log('\n--- Family Connections ---');
    connections.forEach(c => {
      console.log(`ID: ${c._id}`);
      console.log(`  Inviter: ${c.inviter}`);
      console.log(`  Invitee: ${c.invitee}`);
      console.log(`  Email: ${c.inviteeEmail}`);
      console.log(`  Status: ${c.status}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};

run();
