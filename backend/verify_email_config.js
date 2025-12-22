require('dotenv').config();
const mongoose = require('mongoose');
const { sendEmail } = require('./utils/sendEmail');
const User = require('./models/User');

async function test() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log('DB Connected.');
        
        console.log("Fetching a user...");
        const user = await User.findOne().sort({ lastActive: -1 }); // Get recently active user
        if (!user) {
            console.log('No user found to send email to.');
            return;
        }
        
        console.log(`Attempting to send test email to: ${user.email}`);
        console.log(`Using Email User: ${process.env.EMAIL_USER}`);

        const result = await sendEmail({
            to: user.email,
            subject: 'MediTrack Debug: Test Email',
            html: '<p>This is a test to verify your email configuration is working.</p>'
        });
        
        console.log('Send Result:', result);
    } catch(e) {
        console.error("Test Failed:", e);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

test();
