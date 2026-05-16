require('dotenv').config({ path: '.env' });
const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER || process.env.SMTP_EMAIL;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const SMTP_FROM = process.env.SMTP_EMAIL;

async function testSMTP() {
  console.log("🚀 Starting SMTP Connection Test...");
  console.log(`Host: ${SMTP_HOST}`);
  console.log(`Port: ${SMTP_PORT}`);
  console.log(`User/Login: ${SMTP_USER}`);
  console.log(`Sender From: ${SMTP_FROM}`);
  console.log("-----------------------------------------");

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD || !SMTP_FROM) {
    console.error("❌ Error: Missing required SMTP parameters in your .env file!");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD
    }
  });

  try {
    console.log("⏳ Verifying SMTP server connection...");
    await transporter.verify();
    console.log("✅ SMTP Server verified successfully! Your login details are 100% correct.");

    console.log("⏳ Dispatching test email to vishalyadavdgtl@gmail.com...");
    const info = await transporter.sendMail({
      from: `"DigitalCard Test" <${SMTP_FROM}>`,
      to: `vishalyadavdgtl@gmail.com`,
      subject: "🔥 Brevo SMTP Gmail Inbox Test 🔥",
      html: `
        <div style="font-family: sans-serif; padding: 25px; border: 2px solid #00d1ff; border-radius: 12px; background-color: #fafafa; max-width: 500px;">
          <h2 style="color: #00d1ff; margin-top: 0;">Congratulations, Vishal!</h2>
          <p>Your Brevo SMTP service is fully connected and sending emails perfectly to your Gmail address.</p>
          <p>This email was successfully processed and sent to your Primary Inbox with 100% security verification from your domain.</p>
          <br>
          <span style="font-size: 12px; color: #777;">Sent via DGTL-DIGI-CARD automatic test script</span>
        </div>
      `
    });

    console.log("-----------------------------------------");
    console.log("🎉 SUCCESS! Test email dispatched successfully.");
    console.log(`Message ID: ${info.messageId}`);
    console.log("Check your vishalyadavdgtl@gmail.com primary inbox now!");
  } catch (error) {
    console.error("-----------------------------------------");
    console.error("❌ SMTP Test Failed!");
    console.error(`Error details: ${error.message}`);
  }
}

testSMTP();
