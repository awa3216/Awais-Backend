import dotenv from 'dotenv';
import fs from 'fs/promises';
import nodemailer from 'nodemailer';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import processTemplate from './processTemplate.js';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// File path logging removed for security
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use Gmail service
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // This should be an App Password for Gmail
  },
  connectionTimeout: 60000, // 60 seconds
  greetingTimeout: 30000,   // 30 seconds
  socketTimeout: 60000,     // 60 seconds
});
// SMTP credentials logging removed for security

// Verify SMTP connection on startup
const verifySMTPConnection = async () => {
  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');
  } catch (error) {
    console.error('❌ SMTP connection verification failed:', error.message);
  }
};

// Verify connection when module loads
verifySMTPConnection();

export const sendEmail = async ({
  to,
  subject,
  templateName,
  replacements = {},
}) => {
  try {
    // Validate inputs
    if (!to || !subject || !templateName) {
      throw new Error(
        'Missing required parameters: to, subject, or templateName'
      );
    }
    if (!process.env.SENDER_EMAIL) {
      throw new Error('SENDER_EMAIL environment variable is not set');
    }

    // Construct and validate template path
    const templatePath = path.join(
      __dirname,
      '../Templates',
      `${templateName}.html`
    );
    try {
      // Template path logging removed for security
      await fs.access(templatePath); // Check if template file exists
    } catch {
      throw new Error(`Template file ${templateName}.html not found`);
    }

    // Process template
    const htmlContent = await processTemplate(templatePath, replacements);

    // Configure email options
    const mailOptions = {
      from: `Faraway <${process.env.SENDER_EMAIL}>`,
      to,
      subject,
      html: htmlContent,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}`);
    return info;
  } catch (error) {
    console.error(`Error sending email to ${to}: ${error.message}`);

    // Provide more specific error messages for common SMTP issues
    if (error.message.includes('Greeting never received')) {
      throw new Error('SMTP connection failed - check server settings and credentials');
    } else if (error.message.includes('Invalid login')) {
      throw new Error('SMTP authentication failed - check username and password');
    } else if (error.message.includes('ECONNREFUSED')) {
      throw new Error('SMTP server connection refused - check host and port');
    } else if (error.message.includes('timeout')) {
      throw new Error('SMTP connection timeout - check network and server settings');
    } else {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
};

export default sendEmail;
