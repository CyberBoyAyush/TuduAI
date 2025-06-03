/**
 * Zoho Mail Service for sending emails
 */

// Determine the API base URL based on environment
const getApiBaseUrl = () => {
  // In production (Vercel), use relative path
  if (import.meta.env.PROD) {
    return '';
  }
  // In development, use the local server
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
};

export async function sendZohoMail({ to, subject, html, text }) {
  try {
    const apiBaseUrl = getApiBaseUrl();
    const endpoint = `${apiBaseUrl}/api/send-email`;
    
    console.log('Sending email to:', to);
    console.log('Using API endpoint:', endpoint);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        html,
        text
      })
    });

    // Check if response is ok first
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (parseError) {
        // If JSON parsing fails, use the status text
        console.error('Failed to parse error response:', parseError);
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Email sent successfully:', result);
    
    return {
      success: true,
      messageId: result.messageId
    };
  } catch (error) {
    console.error('Zoho Mail error:', error);
    
    // Check if it's a network error (server not running)
    if (error.message.includes('Failed to fetch') || error.message.includes('404')) {
      console.log('Backend server not available, falling back to console log');
      console.log('Email would be sent:', { to, subject, html });
      return {
        success: true,
        messageId: `fallback-${Date.now()}`,
        fallback: true
      };
    }
    
    throw error;
  }
}

/**
 * Send workspace invitation email
 */
export async function sendWorkspaceInvitation({ 
  recipientEmail, 
  workspaceName, 
  ownerName, 
  ownerEmail,
  workspaceIcon = '📋'
}) {
  const subject = `${ownerName} invited you to join "${workspaceName}" workspace`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Workspace Invitation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f2f0e3;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f76f52 0%, #e55e41 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #f2f0e3; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">TuduAI</h1>
          <p style="color: #f2f0e3; margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Your productivity workspace</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <!-- Workspace Icon -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background-color: #f2f0e3; border-radius: 50%; width: 80px; height: 80px; line-height: 80px; font-size: 32px; border: 3px solid #e8e6d9;">
              ${workspaceIcon}
            </div>
          </div>
          
          <!-- Main Message -->
          <div style="text-align: center; margin-bottom: 35px;">
            <h2 style="color: #202020; margin: 0 0 16px 0; font-size: 24px; font-weight: 600; line-height: 1.3;">
              You're invited to collaborate!
            </h2>
            <p style="color: #3a3a3a; margin: 0; font-size: 16px; line-height: 1.6;">
              <strong style="color: #f76f52;">${ownerName}</strong> has invited you to join the 
              <strong style="color: #202020;">"${workspaceName}"</strong> workspace on TuduAI.
            </p>
          </div>
          
          <!-- Features -->
          <div style="background-color: #f2f0e3; border-radius: 8px; padding: 25px; margin-bottom: 30px; border-left: 4px solid #f76f52;">
            <h3 style="color: #202020; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">What you can do:</h3>
            <ul style="color: #3a3a3a; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Create and manage tasks collaboratively</li>
              <li>Set reminders and deadlines</li>
              <li>Track progress with your team</li>
              <li>Stay organized with AI-powered insights</li>
            </ul>
          </div>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="https://tuduai.vercel.app/login" style="display: inline-block; background-color: #f76f52; color: #f2f0e3; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(247, 111, 82, 0.3);">
              Join Workspace
            </a>
          </div>
          
          <!-- Footer Info -->
          <div style="text-align: center; padding-top: 25px; border-top: 1px solid #e8e6d9;">
            <p style="color: #3a3a3a; margin: 0 0 8px 0; font-size: 14px;">
              Invited by: <strong>${ownerEmail}</strong>
            </p>
            <p style="color: #6b7280; margin: 0; font-size: 12px; line-height: 1.5;">
              If you don't have a TuduAI account yet, you'll be able to create one when you click the link above.
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f2f0e3; padding: 20px 30px; text-align: center; border-top: 1px solid #e8e6d9;">
          <p style="color: #6b7280; margin: 0; font-size: 12px;">
            This invitation was sent from TuduAI. If you didn't expect this email, you can safely ignore it.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
    ${ownerName} has invited you to join "${workspaceName}" workspace on TuduAI.
    
    What you can do:
    • Create and manage tasks collaboratively
    • Set reminders and deadlines  
    • Track progress with your team
    • Stay organized with AI-powered insights
    
    Join the workspace: https://tuduai.vercel.app/login
    
    Invited by: ${ownerEmail}
    
    If you don't have a TuduAI account yet, you'll be able to create one when you visit the link above.
  `;
  
  return sendZohoMail({ to: recipientEmail, subject, html, text });
}

/**
 * Send workspace leave notification email to owner
 */
export async function sendWorkspaceLeaveNotification({
  ownerEmail,
  workspaceName,
  memberEmail,
  memberName = null,
  workspaceIcon = '📋'
}) {
  const subject = `${memberName || memberEmail} left your "${workspaceName}" workspace`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Member Left Workspace</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f2f0e3;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f76f52 0%, #e55e41 100%); padding: 30px; text-align: center;">
          <div style="background-color: rgba(255, 255, 255, 0.2); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 36px;">
            ${workspaceIcon}
          </div>
          <h1 style="color: #f2f0e3; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            Member Left Workspace
          </h1>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">

          <!-- Main Message -->
          <div style="text-align: center; margin-bottom: 35px;">
            <h2 style="color: #202020; margin: 0 0 16px 0; font-size: 24px; font-weight: 600; line-height: 1.3;">
              Someone left your workspace
            </h2>
            <p style="color: #3a3a3a; margin: 0; font-size: 16px; line-height: 1.6;">
              <strong style="color: #f76f52;">${memberName || memberEmail}</strong> has left the
              <strong style="color: #202020;">"${workspaceName}"</strong> workspace.
            </p>
          </div>

          <!-- Workspace Info Box -->
          <div style="background-color: #f2f0e3; border: 1px solid #e8e6d9; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center;">
            <div style="font-size: 32px; margin-bottom: 12px;">${workspaceIcon}</div>
            <h3 style="color: #202020; margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">
              ${workspaceName}
            </h3>
            <p style="color: #3a3a3a; margin: 0; font-size: 14px;">
              Member: ${memberEmail}
            </p>
          </div>

          <!-- Action Button -->
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="https://tuduai.vercel.app/todo" style="display: inline-block; background-color: #f76f52; color: #f2f0e3; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(247, 111, 82, 0.3); transition: all 0.3s ease;">
              Manage Workspace
            </a>
          </div>

          <!-- Footer Info -->
          <div style="text-align: center; padding-top: 25px; border-top: 1px solid #e8e6d9;">
            <p style="color: #3a3a3a; margin: 0 0 8px 0; font-size: 14px;">
              This member can be re-invited if needed.
            </p>
            <p style="color: #6b7280; margin: 0; font-size: 12px; line-height: 1.5;">
              You can manage your workspace members and settings from your TuduAI dashboard.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f2f0e3; padding: 20px 30px; text-align: center; border-top: 1px solid #e8e6d9;">
          <p style="color: #6b7280; margin: 0; font-size: 12px;">
            This notification was sent from TuduAI. You received this because you own the workspace.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    ${memberName || memberEmail} has left your "${workspaceName}" workspace on TuduAI.

    Workspace: ${workspaceName}
    Member who left: ${memberEmail}

    You can manage your workspace and invite new members from your TuduAI dashboard: https://tuduai.vercel.app/todo

    This member can be re-invited if needed.
  `;

  return sendZohoMail({ to: ownerEmail, subject, html, text });
}

/**
 * Send reminder email
 */
export async function sendReminderEmail({
  userEmail,
  reminderTitle,
  reminderBody,
  dueDate,
  userName = 'there'
}) {
  const formattedDate = new Date(dueDate).toLocaleString();
  const subject = `Reminder: ${reminderTitle}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Task Reminder</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f2f0e3;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f76f52 0%, #e55e41 100%); padding: 30px; text-align: center;">
          <h1 style="color: #f2f0e3; margin: 0; font-size: 24px; font-weight: 700;">TuduAI Reminder</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
          <h2 style="color: #202020; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">
            Hello ${userName}! 👋
          </h2>
          
          <p style="color: #3a3a3a; margin: 0 0 25px 0; font-size: 16px; line-height: 1.6;">
            This is a friendly reminder about your task:
          </p>
          
          <div style="background-color: #f2f0e3; border-radius: 8px; padding: 20px; margin-bottom: 25px; border-left: 4px solid #f76f52;">
            <h3 style="color: #202020; margin: 0 0 12px 0; font-size: 18px; font-weight: 600;">
              📋 ${reminderTitle}
            </h3>
            <p style="color: #3a3a3a; margin: 0 0 12px 0; font-size: 14px;">
              <strong>Due:</strong> ${formattedDate}
            </p>
            ${reminderBody ? `<p style="color: #3a3a3a; margin: 0; font-size: 14px; line-height: 1.5;">${reminderBody}</p>` : ''}
          </div>
          
          <div style="text-align: center;">
            <a href="https://tuduai.vercel.app/todo" style="display: inline-block; background-color: #f76f52; color: #f2f0e3; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">
              View in TuduAI
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f2f0e3; padding: 15px 30px; text-align: center; border-top: 1px solid #e8e6d9;">
          <p style="color: #6b7280; margin: 0; font-size: 12px;">
            Sent from TuduAI - Your productivity assistant
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendZohoMail({ to: userEmail, subject, html });
}
