import { sendMail } from '../lib/mailer';

/**
 * Send an email using the configured mailer
 * @param {Object} emailData Email data
 * @param {string} emailData.to Recipient email address
 * @param {string} emailData.subject Email subject
 * @param {string} emailData.html HTML content of the email (optional if text is provided)
 * @param {string} emailData.text Plain text content of the email (optional if html is provided)
 * @returns {Promise<Object>} Response with success status and message ID
 * @throws {Error} If email sending fails
 */
export async function sendEmail(emailData) {
  try {
    const { to, subject, html, text } = emailData;
    
    // Validate required fields
    if (!to || !subject || (!html && !text)) {
      throw new Error('Missing required fields: to, subject, and either html or text content');
    }
    
    const info = await sendMail({ to, subject, html, text });
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Email service error:', error);
    throw error;
  }
}

/**
 * Send a reminder email to a user
 * @param {Object} reminderData Reminder data
 * @param {string} reminderData.userEmail User's email address
 * @param {string} reminderData.reminderTitle Title of the reminder
 * @param {string} reminderData.reminderBody Body/description of the reminder
 * @param {Date|string} reminderData.dueDate Due date of the reminder
 * @returns {Promise<Object>} Response with success status
 */
export async function sendReminderEmail({ userEmail, reminderTitle, reminderBody, dueDate }) {
  const formattedDate = new Date(dueDate).toLocaleString();
  
  const subject = `Reminder: ${reminderTitle}`;
  
  const html = `
    <div style="font-family: Arial, sans; max-width: 600px; margin: 0 auto;">
      <h2>Reminder: ${reminderTitle}</h2>
      <p>Hello,</p>
      <p>This is a reminder for: <strong>${reminderTitle}</strong></p>
      <p><strong>Due:</strong> ${formattedDate}</p>
      ${reminderBody ? `<p><strong>Details:</strong> ${reminderBody}</p>` : ''}
      <p>---</p>
      <p>Sent from TuduAI - Your productivity assistant</p>
    </div>
  `;
  
  return sendEmail({
    to: userEmail,
    subject,
    html
  });
} 