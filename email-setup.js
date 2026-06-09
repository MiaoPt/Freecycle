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
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;
    const emailReceiver = process.env.EMAIL_RECEIVER;
    const mailOptions = {
        from: emailUser,
        to: emailReceiver,
        subject: subject,
        html: htmlContent
    };

    if (! emailUser|| ! emailPassword || !emailReceiver) {
        console.error('ERROR: Email credentials not set in environment variables');
        process.exit(1);
    }

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent!');
    } catch(error) {
        console.log('Error sending email:', error.message)
        return null;
    }
};

module.exports = { sendEmail, transporter };
