// firebaseEmailService.js

/**
 * Sends a welcome email to a new user.
 * @param {string} toEmail - Recipient's email.
 * @param {string} toName - Recipient's name.
 * @param {string} uid - User ID to generate a unique link.
 */
export async function sendWelcomeEmail(toEmail, toName, uid) {
    const apiKey = process.env.NEXT_PUBLIC_BREVO_API_KEY;
    if (!apiKey) {
      console.error("Error: BREVO_API_KEY is missing in environment variables.");
      return;
    }
    const senderEmail = process.env.NEXT_PUBLIC_BREVO_SENDER_EMAIL;
    const link = `https://my.dgtldigicard.com/${uid}`;
  
    const emailTemplate = `
      <div style="text-align: center; padding: 40px; background: #121212; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: auto; background: #1e1e1e; padding: 30px; 
            border-radius: 15px; box-shadow: 0 0 20px rgba(0, 209, 255, 0.3); border: 2px solid #00d1ff;">
          <h1 style="color: #00d1ff; font-size: 26px; font-weight: bold;">
            ✨ Thanks For Using DGTLmart DigiCard, ${toName}! ✨
          </h1>
          <p style="font-size: 16px; color: #e0e0e0; line-height: 1.6;">
            Your <b>digital business card</b> is here! Create new connections, expand your network, and make a lasting impression. 🚀
          </p>
          <a href="${link}" 
            style="display: inline-block; margin-top: 20px; padding: 12px 25px; font-size: 18px; font-weight: bold;
                   color: #000; background: #00d1ff; text-decoration: none; border-radius: 8px; 
                   box-shadow: 0 4px 10px rgba(0, 209, 255, 0.3); transition: 0.3s ease-in-out;">
            🚀 Access Your Digi-card
          </a>
          <p style="margin-top: 20px; color: #aaa; font-size: 14px;">
            Need help? We're just a message away! 📩  
          </p>
        </div>
      </div>`;
  
    const data = {
      sender: { email: senderEmail, name: "Digital Card Team" },
      to: [{ email: toEmail, name: toName }],
      subject: "Welcome to DGTLDigicard - Your Digital Business Card",
      htmlContent: emailTemplate,
    };
  
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(`Error: ${errorResponse.message}`);
      }
      console.log(`✅ Welcome email sent successfully to ${toEmail}.`);
    } catch (error) {
      console.error("❌ Failed to send welcome email:", error.message);
    }
  }
  
  /**
   * Sends a premium membership confirmation email.
   * @param {string} toEmail - Recipient's email.
   * @param {string} toName - Recipient's name.
   * @param {string} uid - User ID to generate a unique link.
   */
  export async function sendPremiumEmail(toEmail, toName, uid) {
    const apiKey = process.env.NEXT_PUBLIC_BREVO_API_KEY;
    if (!apiKey) {
      console.error("Error: BREVO_API_KEY is missing in environment variables.");
      return;
    }
    const senderEmail = process.env.NEXT_PUBLIC_BREVO_SENDER_EMAIL;
    const link = `https://my.dgtldigicard.com/${uid}`;
  
    const emailTemplate = `
      <div style="text-align: center; padding: 40px; background: #f0f8ff; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; 
            border-radius: 15px; box-shadow: 0 0 20px rgba(34,139,230,0.3); border: 2px solid #228be6;">
          <h1 style="color: #228be6; font-size: 26px; font-weight: bold;">
            🎉 Congratulations, ${toName}!
          </h1>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            You are now a premium member! Enjoy exclusive features and benefits that enhance your experience.
          </p>
          <a href="${link}" 
            style="display: inline-block; margin-top: 20px; padding: 12px 25px; font-size: 18px; font-weight: bold;
                   color: #fff; background: #228be6; text-decoration: none; border-radius: 8px;
                   box-shadow: 0 4px 10px rgba(34,139,230,0.3); transition: 0.3s ease-in-out;">
            Explore Premium Features
          </a>
          <p style="margin-top: 20px; color: #666; font-size: 14px;">
            Thank you for upgrading. We're excited to serve you better!
          </p>
        </div>
      </div>`;
  
    const data = {
      sender: { email: senderEmail, name: "Digital Card Team" },
      to: [{ email: toEmail, name: toName }],
      subject: "Welcome to Premium Membership!",
      htmlContent: emailTemplate,
    };
  
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(`Error: ${errorResponse.message}`);
      }
      console.log(`✅ Premium email sent successfully to ${toEmail}.`);
    } catch (error) {
      console.error("❌ Failed to send premium email:", error.message);
    }
  }
  
 
  