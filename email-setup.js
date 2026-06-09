const nodemailer = require('nodemailer');
require('dotenv').config();

//Create a transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

//Function to send an email
async function sendEmail(subject, htmlContent) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_RECEIVER,
        subject: subject,
        html: htmlContent
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent!');
    } catch(error) {
        console.log('Error sending email:', error.message)
        return null;
    }
};

module.exports = { sendEmail, transporter };
