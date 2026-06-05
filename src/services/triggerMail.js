// triggerMail.js
import { SendMailClient } from 'zeptomail';

const zeptoUrl = process.env.NEXT_PUBLIC_ZEPTO_URL || 'https://api.zeptomail.com/';
const zeptoToken = process.env.NEXT_PUBLIC_ZEPTO_TOKEN;

if (!zeptoToken) {
  console.error('Missing ZEPTO_TOKEN! Email sending will fail.');
}

const client = new SendMailClient({ url: zeptoUrl, token: zeptoToken });

async function sendZeptoMail(toEmail, toName, subject, htmlContent) {
  if (!zeptoToken) {
    console.error("❌ Error: ZEPTO_TOKEN is missing in .env");
    return false;
  }

  try {
    const response = await client.sendMail({
      from: { address: 'support@dgtldigicard.com', name: 'DigitalCard Team' },
      to: [{ email_address: { address: toEmail, name: toName || toEmail.split('@')[0] } }],
      subject: subject,
      htmlbody: htmlContent,
    });

    const sent = response.message === 'OK' || (response.data && response.data.some(item => item.code === 'EM_104'));

    if (!sent) {
      console.error("Email delivery failed:", response);
    }
    return sent;
  } catch (error) {
    console.error("Email service error:", error.message);
    return false;
  }
}

// Keeping a reference to the old function name to avoid breaking imports if any
const sendNodeMail = sendZeptoMail;


/**
 * Sends a welcome email to a new user.
 * @param {string} toEmail - Recipient's email.
 * @param {string} toName - Recipient's name.
 * @param {string} uid - User ID to generate a unique link.
 */
export async function sendWelcomeEmail(toEmail, toName, uid) {
  const link = `https://my.dgtldigicard.com/${uid}`;

  const emailTemplate = `
      <div style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #e0e0e0; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%); min-height: 100vh; padding: 40px 20px;">
  
  <!-- Main Container -->
  <div style="max-width: 600px; margin: 0 auto; background: #1e1e1e; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,209,255,0.2); border: 1px solid #00d1ff;">
    
    <!-- Header Section -->
    <div style="background: linear-gradient(135deg, #00d1ff 0%, #0099cc 100%); padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
      <!-- Decorative elements -->
      <div style="position: absolute; top: -50px; right: -50px; width: 100px; height: 100px; border-radius: 50%; background: rgba(255,255,255,0.1);"></div>
      <div style="position: absolute; bottom: -30px; left: -30px; width: 80px; height: 80px; border-radius: 50%; background: rgba(255,255,255,0.1);"></div>
      
      <div style="position: relative; z-index: 2;">
        <!-- DigiCard Icon -->
        <div style="display: inline-block; width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; margin-bottom: 20px; line-height: 60px; font-size: 24px;">
          💳
        </div>
        
        <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #000000; text-shadow: none; letter-spacing: -0.5px;">
          Welcome to DGTLmart DigiCard
        </h1>
        
        <p style="margin: 15px 0 0 0; font-size: 18px; color: rgba(0,0,0,0.8); font-weight: 400;">
          Thanks for joining, <strong>${toName}</strong>! ✨
        </p>
      </div>
    </div>
    
    <!-- Success Section -->
    <div style="padding: 40px 30px; text-align: center;">
      <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #00d1ff 0%, #0099cc 100%); border-radius: 50%; margin-bottom: 25px; position: relative;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: black; font-size: 32px;">
          🚀
        </div>
      </div>
      
      <h2 style="margin: 0 0 15px 0; font-size: 24px; font-weight: 600; color: #ffffff; line-height: 1.3;">
        Your Digital Business Card is Ready!
      </h2>
      
      <p style="margin: 0 0 30px 0; font-size: 16px; color: #e0e0e0; line-height: 1.6;">
        Create new connections, expand your network, and make a lasting impression with your personalized digital card.
      </p>
      
      <!-- Main CTA -->
      <a href="${link}" 
         style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: 600; color: #000000; background: linear-gradient(135deg, #00d1ff 0%, #0099cc 100%); text-decoration: none; border-radius: 12px; box-shadow: 0 10px 25px rgba(0, 209, 255, 0.3); transition: all 0.3s ease; border: none; cursor: pointer; letter-spacing: 0.5px; margin-bottom: 20px;">
        🚀 Access Your DigiCard
      </a>
    </div>

    <!-- Premium Upgrade Section -->
    <div style="margin: 20px 30px; padding: 30px; background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%); border-radius: 16px; border: 1px solid #333333; position: relative;">
      
      <!-- Premium Badge -->
      <div style="position: absolute; top: -10px; left: 30px; background: linear-gradient(135deg, #ffd700 0%, #ffb347 100%); color: #000; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
        👑 Premium Available
      </div>
      
      <div style="text-align: center; margin-top: 10px;">
        <h3 style="margin: 0 0 15px 0; font-size: 24px; font-weight: 700; color: #00d1ff;">
          Unlock Premium Features
        </h3>
        <p style="margin: 0 0 25px 0; font-size: 14px; color: #cccccc;">
          Take your digital presence to the next level with exclusive premium benefits
        </p>
      </div>

      <!-- Premium Features Grid -->
      <div style="display: grid; gap: 15px; margin: 25px 0;">
        
        <!-- Feature 1 -->
        <div style="display: flex; align-items: center; gap: 15px; padding: 15px; background: rgba(0,209,255,0.1); border-radius: 12px; border: 1px solid rgba(0,209,255,0.2);">
          <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #00d1ff 0%, #0099cc 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: black; font-size: 18px; flex-shrink: 0;">
            🎨
          </div>
          <div>
            <p style="margin: 0; font-weight: 600; color: #ffffff; font-size: 15px;">4 Premium Card Designs</p>
            <p style="margin: 5px 0 0 0; font-size: 13px; color: #cccccc;">Professional templates with advanced styling options</p>
          </div>
        </div>
        
        <!-- Feature 2 -->
        <div style="display: flex; align-items: center; gap: 15px; padding: 15px; background: rgba(0,209,255,0.1); border-radius: 12px; border: 1px solid rgba(0,209,255,0.2);">
          <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; flex-shrink: 0;">
            🔗
          </div>
          <div>
            <p style="margin: 0; font-weight: 600; color: #ffffff; font-size: 15px;">Custom Vanity URL</p>
            <p style="margin: 5px 0 0 0; font-size: 13px; color: #cccccc;">Personalized link like yourname.dgtlmart.com</p>
          </div>
        </div>
        
        <!-- Feature 3 -->
        <div style="display: flex; align-items: center; gap: 15px; padding: 15px; background: rgba(0,209,255,0.1); border-radius: 12px; border: 1px solid rgba(0,209,255,0.2);">
          <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; flex-shrink: 0;">
            ∞
          </div>
          <div>
            <p style="margin: 0; font-weight: 600; color: #ffffff; font-size: 15px;">Unlimited Edits</p>
            <p style="margin: 5px 0 0 0; font-size: 13px; color: #cccccc;">Update your card anytime without restrictions</p>
          </div>
        </div>
        

        <!-- Feature 5 -->
        <div style="display: flex; align-items: center; gap: 15px; padding: 15px; background: rgba(0,209,255,0.1); border-radius: 12px; border: 1px solid rgba(0,209,255,0.2);">
          <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: black; font-size: 18px; flex-shrink: 0;">
            🚀
          </div>
          <div>
            <p style="margin: 0; font-weight: 600; color: #ffffff; font-size: 15px;">Priority Support</p>
            <p style="margin: 5px 0 0 0; font-size: 13px; color: #cccccc;">24/7 premium customer support and assistance</p>
          </div>
        </div>
      </div>

      <!-- Pricing & CTA -->
      <div style="text-align: center; margin-top: 25px;">
        <div style="margin-bottom: 20px;">
          <span style="font-size: 32px; font-weight: 700; color: #00d1ff;">₹99</span>
          <span style="font-size: 16px; color: #cccccc; text-decoration: line-through; margin-left: 10px;">₹499</span>
          <div style="font-size: 14px; color: #ffd700; margin-top: 5px; font-weight: 600;">
            🎉 Launch Offer: 80% OFF!
          </div>
        </div>
        
        <a href="https://my.dgtldigicard.com/payment" 
           style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: 600; color: #000000; background: linear-gradient(135deg, #ffd700 0%, #ffb347 100%); text-decoration: none; border-radius: 12px; box-shadow: 0 8px 20px rgba(255, 215, 0, 0.4); transition: all 0.3s ease; border: none; cursor: pointer;">
          👑 Upgrade to Premium
        </a>
      </div>
    </div>

    <!-- Support Section -->
    <div style="padding: 30px; text-align: center;">
      <div style="padding: 20px; background: rgba(0,209,255,0.1); border-radius: 12px; border: 1px solid rgba(0,209,255,0.2);">
        <p style="margin: 0; font-size: 15px; color: #e0e0e0; font-weight: 500;">
          <strong>Need Help?</strong> We're just a message away! 📩
        </p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #cccccc;">
          Our support team is ready to help you get the most out of your DigiCard
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #0a0a0a; padding: 25px 30px; text-align: center; border-top: 1px solid #333333;">
      <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: 600; color: #00d1ff;">
        DGTLmart DigiCard
      </p>
      <p style="margin: 0; font-size: 14px; color: #999999; line-height: 1.5;">
        Creating digital connections for the modern world<br>
        Thank you for choosing DGTLmart DigiCard!
      </p>
    </div>
  </div>
  
  <!-- Legal Footer -->
  <div style="text-align: center; margin-top: 30px; padding: 0 20px;">
    <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.5); line-height: 1.4;">
      © 2025 DGTLmart DigiCard. All rights reserved.<br>
      This email was sent to ${toName}. <a href="#" style="color: rgba(255,255,255,0.7); text-decoration: underline;">Unsubscribe</a> | <a href="https://dgtldigicard.com/privacy-policy/" style="color: rgba(255,255,255,0.7); text-decoration: underline;">Privacy Policy</a>
    </p>
  </div>
</div>
`;

  const success = await sendNodeMail(
    toEmail, 
    toName, 
    "Welcome to DGTLDigicard - Your Digital Business Card", 
    emailTemplate
  );
  if (success) {
    console.log(`Welcome email sent to ${toEmail}`);
  }
}

/**
 * Sends a premium membership confirmation email.
 * @param {string} toEmail - Recipient's email.
 * @param {string} toName - Recipient's name.
 * @param {string} uid - User ID to generate a unique link.
 */
export async function sendPremiumEmail(toEmail, toName, uid) {
  // Premium confirmation emails are currently disabled
  console.log(`Premium email skipped for ${toEmail} (Service Disabled)`);
  return true;

  /*
  const link = `https://my.dgtldigicard.com/${uid}`;

  const emailTemplate = `
      <div style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333333; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 40px 20px;">
  
  <!-- Main Container -->
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.2);">
    
    <!-- Header Section -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
      <!-- Decorative elements -->
      <div style="position: absolute; top: -50px; right: -50px; width: 100px; height: 100px; border-radius: 50%; background: rgba(255,255,255,0.1);"></div>
      <div style="position: absolute; bottom: -30px; left: -30px; width: 80px; height: 80px; border-radius: 50%; background: rgba(255,255,255,0.1);"></div>
      
      <div style="position: relative; z-index: 2;">
        <!-- Crown Icon -->
        <div style="display: inline-block; width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; margin-bottom: 20px; line-height: 60px; font-size: 24px;">
          👑
        </div>
        
        <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #ffffff; text-shadow: 0 2px 4px rgba(0,0,0,0.1); letter-spacing: -0.5px;">
          Welcome to Premium
        </h1>
        
        <p style="margin: 15px 0 0 0; font-size: 18px; color: rgba(255,255,255,0.9); font-weight: 400;">
          Congratulations, <strong>${toName}</strong>!
        </p>
      </div>
    </div>
    
    <!-- Content Section -->
    <div style="padding: 50px 40px;">
      
      <!-- Success Message -->
      <div style="text-align: center; margin-bottom: 40px;">
        <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; margin-bottom: 25px; position: relative;">
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 32px;">
            ✓
          </div>
        </div>
        
        <h2 style="margin: 0 0 15px 0; font-size: 24px; font-weight: 600; color: #1f2937; line-height: 1.3;">
          Your Premium Upgrade is Complete
        </h2>
        
        <p style="margin: 0; font-size: 16px; color: #6b7280; line-height: 1.6; max-width: 400px; margin-left: auto; margin-right: auto;">
          You now have access to exclusive features and premium benefits designed to enhance your experience and productivity.
        </p>
      </div>
      
      <!-- Features Grid -->
      <div style="margin: 40px 0; border-radius: 12px; background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0;">
        <h3 style="margin: 0 0 25px 0; font-size: 18px; font-weight: 600; color: #374151; text-align: center;">
          What's Included in Your Premium Plan
        </h3>
        
        <div style="display: grid; gap: 20px;">
          <!-- Feature 1 -->
          <div style="display: flex; align-items: center; gap: 15px;">
            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; flex-shrink: 0;">
              ⚡
            </div>
            <div>
              <p style="margin: 0; font-weight: 600; color: #374151; font-size: 15px;">6+ premium card themes & Custom vanity URL</p>
            </div>
          </div>
          
          <!-- Feature 2 -->
          <div style="display: flex; align-items: center; gap: 15px;">
            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; flex-shrink: 0;">
              🔒
            </div>
            <div>
              <p style="margin: 0; font-weight: 600; color: #374151; font-size: 15px;">Ad-free digital card experience & Unlimited profile edits</p>
            </div>
          </div>
          
          <!-- Feature 3 -->
          <div style="display: flex; align-items: center; gap: 15px;">
            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; flex-shrink: 0;">
              💎
            </div>
            <div>
              <p style="margin: 0; font-weight: 600; color: #374151; font-size: 15px;">Exclusive Features</p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">Access to premium tools and customizations</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Call to Action -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="${link}" 
           style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: 600; color: #ffffff; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); text-decoration: none; border-radius: 12px; box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3); transition: all 0.3s ease; border: none; cursor: pointer; letter-spacing: 0.5px;">
          Explore Premium Features →
        </a>
        
        <p style="margin: 20px 0 0 0; font-size: 14px; color: #9ca3af;">
          Start exploring your new premium experience right away
        </p>
      </div>
      
      <!-- Support Section -->
      <div style="margin-top: 40px; padding: 25px; background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%); border-radius: 12px; text-align: center; border: 1px solid #f59e0b;">
        <p style="margin: 0; font-size: 15px; color: #92400e; font-weight: 500;">
          <strong>Need Help?</strong> Our premium support team is here for you 24/7
        </p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #a16207;">
          Contact us anytime for priority assistance
        </p>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background: #f8fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: 600; color: #374151;">
        Thank you for choosing Premium
      </p>
      <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.5;">
        We're committed to providing you with the best possible experience.<br>
        Welcome to the premium community!
      </p>
      
    </div>
  </div>
  
  <!-- Legal Footer -->
  <div style="text-align: center; margin-top: 30px; padding: 0 20px;">
    <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.7); line-height: 1.4;">
      © 2025 Your Company Name. All rights reserved.<br>
      This email was sent to ${toName}. <a href="#" style="color: rgba(255,255,255,0.9); text-decoration: underline;">Unsubscribe</a> | <a href="#" style="color: rgba(255,255,255,0.9); text-decoration: underline;">Privacy Policy</a>
    </p>
  </div>
</div>
`;

  const success = await sendNodeMail(
    toEmail, 
    toName, 
    "Welcome to Premium Membership!", 
    emailTemplate
  );
  if (success) {
    console.log(`Premium membership email sent to ${toEmail}`);
  }
  */
}

/**
 * Sends an OTP verification email.
 */
export async function sendOTPEmail(toEmail, toName, otp) {
  const emailTemplate = `
    <div style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #e0e0e0; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%); padding: 40px 20px;">
      
      <!-- Main Container -->
      <div style="max-width: 600px; margin: 0 auto; background: #1e1e1e; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,209,255,0.2); border: 1px solid #00d1ff;">
        
        <!-- Header Section -->
        <div style="background: linear-gradient(135deg, #00d1ff 0%, #0099cc 100%); padding: 30px; text-align: center; position: relative; overflow: hidden;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #000000; letter-spacing: -0.5px;">
            Verification Required
          </h1>
        </div>
        
        <!-- Content Section -->
        <div style="padding: 40px 30px; text-align: center;">
          <p style="margin: 0 0 20px 0; font-size: 18px; color: #e0e0e0;">
            Hello <strong>${toName || 'User'}</strong>,
          </p>
          
          <p style="margin: 0 0 30px 0; font-size: 16px; color: #a0a0a0;">
            Please use the following One Time Password (OTP) to verify your account. Do not share this code with anyone.
          </p>
          
          <!-- OTP Box -->
          <div style="display: inline-block; background: linear-gradient(135deg, rgba(0,209,255,0.1) 0%, rgba(0,153,204,0.1) 100%); border: 2px dashed #00d1ff; border-radius: 12px; padding: 20px 40px; margin-bottom: 30px;">
            <div style="font-size: 36px; font-weight: 800; color: #00d1ff; letter-spacing: 8px;">
              ${otp}
            </div>
          </div>
          
          <p style="margin: 0; font-size: 14px; color: #ff6b6b; font-weight: 500;">
            ⏳ This code is valid for 10 minutes.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #0a0a0a; padding: 20px 30px; text-align: center; border-top: 1px solid #333333;">
          <p style="margin: 0; font-size: 13px; color: #888888; line-height: 1.5;">
            If you didn't request this verification, please ignore this email or contact support.<br>
            © ${new Date().getFullYear()} DGTLmart DigiCard
          </p>
        </div>
        
      </div>
    </div>
  `;

  const success = await sendNodeMail(
    toEmail, 
    toName, 
    `${otp} is your verification code for DGTLmart DigiCard`, 
    emailTemplate
  );

  if (success) {
    console.log(`OTP sent to ${toEmail}`);
  }

  return success;
}
