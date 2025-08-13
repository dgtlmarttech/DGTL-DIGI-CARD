export async function sendTemplateEmail(toEmail, toName, subject, templateContent) {
    const apiKey = process.env.REACT_APP_BREVO_API_KEY;
    if (!apiKey) {
      console.error("Error: BREVO_API_KEY is missing in environment variables.");
      return;
    }
    const senderEmail = process.env.REACT_APP_BREVO_SENDER_EMAIL;
    
    // Use the provided templateContent as-is (it already contains the email structure)
    const data = {
      sender: { email: senderEmail, name: "Digital Card Team" },
      to: [{ email: toEmail, name: toName }],
      subject: subject,
      htmlContent: templateContent,
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
      console.log(`✅ Template email sent successfully to ${toEmail}.`);
    } catch (error) {
      console.error("❌ Failed to send template email:", error.message);
    }
  }
  