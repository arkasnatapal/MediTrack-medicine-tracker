const ContactMessage = require('../models/ContactMessage');
const { sendEmail } = require('../utils/sendEmail');

exports.submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    const contactMessage = await ContactMessage.create({
      name,
      email,
      subject,
      message,
    });

    // Send email to admin
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `New Contact Message: ${subject}`,
        html: `
          <h3>New Contact Form Submission</h3>
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        `,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully. We will get back to you soon!',
      contactMessage,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAllMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateMessageStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: message,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
