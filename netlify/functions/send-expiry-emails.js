const { schedule } = require('@netlify/functions');
const { SendMailClient } = require('zeptomail');
import { db } from '../../src/firebase/firebase'


// Initialize ZeptoMail client
const zeptoUrl = process.env.ZEPTO_URL || 'https://api.zeptomail.com/';
const zeptoToken = process.env.ZEPTO_TOKEN;

if (!zeptoToken) {
  console.error('Missing ZEPTO_TOKEN! Function will not work.');
}

const client = new SendMailClient({ url: zeptoUrl, token: zeptoToken });

// Beautiful HTML Email Templates
const getEmailTemplate = (type, userName, daysLeft, isExpired = false) => {
  const baseStyles = `
    <style>
      .container { max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
      .content { background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
      .cta-button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 20px 0; }
      .feature-list { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
      .footer { text-align: center; padding: 20px; color: #64748b; font-size: 14px; }
      .warning-box { background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0; }
      .success-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 20px 0; }
      .offer-box { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
    </style>
  `;

  const templates = {
    trial_2_days_before: {
      subject: `🚀 Your DigitalCard trial expires in 2 days - Don't miss out!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body style="background-color: #f1f5f9; margin: 0; padding: 20px;">
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">⏰ Trial Ending Soon!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Hi ${userName}, your premium features expire in 2 days</p>
            </div>
            <div class="content">
              <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                Your <strong>DigitalCard Premium trial</strong> has been amazing, hasn't it? 
                Don't lose access to all these powerful features in just <strong>2 days</strong>!
              </p>
              
              <div class="feature-list">
                <h3 style="color: #1f2937; margin-top: 0;">🎯 What you'll lose without Premium:</h3>
                <ul style="color: #4b5563; line-height: 1.8;">
                  <li>✨ <strong>Custom vanity URLs</strong> - Your personal brand URL</li>
                  <li>🎨 <strong>6 Premium card templates</strong> - Stand out from the crowd</li>
                  <li>📊 <strong>Advanced analytics</strong> - Track your network growth</li>
                  <li>💼 <strong>Business features</strong> - Professional networking tools</li>
                  <li>🔒 <strong>Priority support</strong> - Get help when you need it</li>
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="https://my.dgtldigicard.com/payment" class="cta-button">
                  🚀 Upgrade to Premium Now
                </a>
                <p style="font-size: 14px; color: #6b7280; margin-top: 10px;">
                  Secure your premium features today!
                </p>
              </div>
              
              <p style="font-size: 16px; color: #374151; margin-top: 30px;">
                Keep building your professional network with confidence. Your digital business card deserves the premium treatment!
              </p>
            </div>
            <div class="footer">
              <p>Questions? We're here to help!</p>
              <p><a href="https://my.dgtldigicard.com/signin" style="color: #667eea;">Sign in to your account</a> | 
                 <a href="mailto:contact@dgtlmart.com" style="color: #667eea;">contact@dgtlmart.com</a></p>
              <p style="margin-top: 20px;">© 2024 DigitalCard. Making networking effortless.</p>
            </div>
          </div>
        </body>
        </html>
      `
    },
    
    trial_2_days_after: {
      subject: `😔 We miss you! Special comeback offer - 25% OFF`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body style="background-color: #f1f5f9; margin: 0; padding: 20px;">
          <div class="container">
            <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
              <h1 style="margin: 0; font-size: 28px;">🎯 Welcome Back Offer!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Hi ${userName}, we have something special for you</p>
            </div>
            <div class="content">
              <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                Your <strong>DigitalCard Premium trial</strong> ended 2 days ago, but we're not giving up on you! 
              </p>
              
              <div class="offer-box">
                <h2 style="margin: 0 0 10px 0; font-size: 24px;">🎉 SPECIAL OFFER</h2>
                <p style="margin: 0; font-size: 18px; font-weight: bold;">Get 25% OFF your first month!</p>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">This exclusive offer expires in 48 hours</p>
              </div>
              
              <div class="feature-list">
                <h3 style="color: #1f2937; margin-top: 0;">🚀 Reclaim your premium benefits:</h3>
                <ul style="color: #4b5563; line-height: 1.8;">
                  <li>🔗 <strong>Custom vanity URLs</strong> - my.dgtldigicard.com/yourname</li>
                  <li>🎨 <strong>Premium templates</strong> - Beautiful, professional designs</li>
                  <li>📈 <strong>Contact analytics</strong> - See who's viewing your card</li>
                  <li>💎 <strong>Advanced features</strong> - QR codes, social links, and more</li>
                  <li>⚡ <strong>Priority support</strong> - Get help within 24 hours</li>
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="https://my.dgtldigicard.com/payment?discount=COMEBACK25" class="cta-button" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
                  🎯 Claim 25% Discount Now
                </a>
                <p style="font-size: 14px; color: #6b7280; margin-top: 10px;">
                  Use code: <strong>COMEBACK25</strong>
                </p>
              </div>
              
              <p style="font-size: 14px; color: #ef4444; text-align: center; background: #fef2f2; padding: 15px; border-radius: 8px; margin-top: 30px;">
                ⏰ <strong>Limited Time:</strong> This offer expires in 48 hours!
              </p>
            </div>
            <div class="footer">
              <p>Ready to upgrade your networking game?</p>
              <p><a href="https://my.dgtldigicard.com/signin" style="color: #667eea;">Sign in to your account</a> | 
                 <a href="mailto:contact@dgtlmart.com" style="color: #667eea;">Need help? Contact us</a></p>
            </div>
          </div>
        </body>
        </html>
      `
    },
    
    trial_10_days_after: {
      subject: `💔 Before we say goodbye - Your feedback matters`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body style="background-color: #f1f5f9; margin: 0; padding: 20px;">
          <div class="container">
            <div class="header" style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);">
              <h1 style="margin: 0; font-size: 28px;">💭 We Value Your Opinion</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Hi ${userName}, help us improve DigitalCard</p>
            </div>
            <div class="content">
              <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                It's been 10 days since your DigitalCard trial ended, and we miss you! Before we part ways, 
                we'd love to understand how we can serve you better.
              </p>
              
              <div class="feature-list" style="background: #f3f4f6;">
                <h3 style="color: #1f2937; margin-top: 0;">🤔 Help us understand:</h3>
                <ul style="color: #4b5563; line-height: 1.8;">
                  <li>❓ What features were you hoping to see?</li>
                  <li>🛠️ What challenges did you face?</li>
                  <li>💡 How can we make DigitalCard better?</li>
                  <li>⭐ What would make you reconsider premium?</li>
                </ul>
              </div>
              
              <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                <strong>Your feedback shapes our future.</strong> Every response helps us create better digital business cards for professionals like you.
              </p>
              
              <div style="text-align: center;">
                <a href="https://my.dgtldigicard.com/feedback?user=${encodeURIComponent(userName)}" class="cta-button" style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);">
                  💬 Share Your Feedback
                </a>
                <p style="font-size: 14px; color: #6b7280; margin-top: 15px;">
                  Takes just 2 minutes - Your input is invaluable!
                </p>
              </div>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; margin-top: 30px;">
                <p style="color: #4b5563; margin: 0; font-size: 14px;">
                  <strong>P.S.</strong> You can always come back! Your account will remain active, 
                  and we'll be here when you're ready to upgrade your networking game.
                </p>
              </div>
            </div>
            <div class="footer">
              <p style="color: #667eea;">Thank you for trying DigitalCard! 💙</p>
              <p><a href="https://my.dgtldigicard.com/signin" style="color: #667eea;">Sign in anytime</a> | 
                 <a href="mailto:contact@dgtlmart.com" style="color: #667eea;">contact@dgtlmart.com</a></p>
              <p style="margin-top: 20px; font-style: italic;">Team DigitalCard - Making professional networking effortless</p>
            </div>
          </div>
        </body>
        </html>
      `
    },

    premium_2_days_before: {
      subject: `💎 Your Premium subscription renews in 2 days - You're all set!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body style="background-color: #f1f5f9; margin: 0; padding: 20px;">
          <div class="container">
            <div class="header" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
              <h1 style="margin: 0; font-size: 28px;">💎 Premium Renewal</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Hi ${userName}, your premium benefits continue!</p>
            </div>
            <div class="content">
              <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                Just a friendly reminder that your <strong>DigitalCard Premium</strong> subscription will 
                automatically renew in <strong>2 days</strong>. No action needed from you!
              </p>
              
              <div class="success-box">
                <h3 style="color: #065f46; margin-top: 0;">✅ Your Premium Benefits Continue:</h3>
                <ul style="color: #065f46; line-height: 1.8;">
                  <li>🔗 <strong>Unlimited custom URLs</strong> - Keep your personal brand</li>
                  <li>🎨 <strong>All premium templates</strong> - Full design library access</li>
                  <li>📊 <strong>Advanced analytics</strong> - Track your networking success</li>
                  <li>💼 <strong>Business features</strong> - Professional tools & integrations</li>
                  <li>⚡ <strong>Priority support</strong> - Dedicated help when you need it</li>
                  <li>🚀 <strong>New features first</strong> - Early access to updates</li>
                </ul>
              </div>
              
              <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                Your investment in premium networking tools continues to pay off. Thank you for being 
                a valued DigitalCard Premium member!
              </p>
              
              <div style="text-align: center; background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #16a34a; margin: 0 0 10px 0; font-weight: bold;">✅ Auto-renewal is active</p>
                <a href="https://my.dgtldigicard.com/dashboard/billing" class="cta-button" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); font-size: 14px; padding: 12px 24px;">
                  ⚙️ Manage Billing Settings
                </a>
              </div>
            </div>
            <div class="footer">
              <p>Thank you for choosing DigitalCard Premium!</p>
              <p><a href="https://my.dgtldigicard.com/signin" style="color: #667eea;">Access your dashboard</a> | 
                 <a href="mailto:contact@dgtlmart.com" style="color: #667eea;">Premium support</a></p>
            </div>
          </div>
        </body>
        </html>
      `
    },

    premium_2_days_after: {
      subject: `⚠️ Payment issue - Restore your Premium access now`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body style="background-color: #f1f5f9; margin: 0; padding: 20px;">
          <div class="container">
            <div class="header" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
              <h1 style="margin: 0; font-size: 28px;">⚠️ Payment Failed</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Hi ${userName}, we couldn't process your payment</p>
            </div>
            <div class="content">
              <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                We were unable to process your payment for <strong>DigitalCard Premium</strong> 2 days ago. 
                Your account is currently suspended, but you can restore it instantly!
              </p>
              
              <div class="warning-box">
                <h3 style="color: #dc2626; margin-top: 0;">🚫 Currently suspended features:</h3>
                <ul style="color: #dc2626; line-height: 1.8;">
                  <li>❌ <strong>Custom URLs disabled</strong> - Using default URL now</li>
                  <li>❌ <strong>Premium templates locked</strong> - Basic template only</li>
                  <li>❌ <strong>Analytics limited</strong> - Basic stats only</li>
                  <li>❌ <strong>Advanced features unavailable</strong> - Limited functionality</li>
                </ul>
              </div>
              
              <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
                <h3 style="color: #065f46; margin-top: 0;">✅ Good News!</h3>
                <p style="color: #065f46; margin: 0; line-height: 1.6;">
                  You can <strong>reactivate your Premium features instantly</strong> by updating your payment method. 
                  All your data and settings are safe and waiting for you!
                </p>
              </div>
              
              <div style="text-align: center;">
                <a href="https://my.dgtldigicard.com/dashboard/billing" class="cta-button" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
                  🔧 Update Payment Method
                </a>
                <p style="font-size: 14px; color: #6b7280; margin-top: 10px;">
                  Instant reactivation - No data lost!
                </p>
              </div>
              
              <p style="font-size: 14px; color: #4b5563; background: #f8fafc; padding: 15px; border-radius: 8px; margin-top: 30px;">
                <strong>Need help?</strong> Our support team is standing by to assist with payment issues, 
                billing questions, or account recovery.
              </p>
            </div>
            <div class="footer">
              <p>We're here to help restore your Premium access!</p>
              <p><a href="https://my.dgtldigicard.com/signin" style="color: #667eea;">Sign in to your account</a> | 
                 <a href="mailto:contact@dgtlmart.com" style="color: #667eea;">Priority support</a></p>
            </div>
          </div>
        </body>
        </html>
      `
    },

    premium_10_days_after: {
      subject: `🚨 URGENT: Account deletion in 5 days - Last chance to save your data`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body style="background-color: #f1f5f9; margin: 0; padding: 20px;">
          <div class="container">
            <div class="header" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);">
              <h1 style="margin: 0; font-size: 28px;">🚨 URGENT ACTION REQUIRED</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Hi ${userName}, your account will be deleted soon</p>
            </div>
            <div class="content">
              <div class="warning-box">
                <h2 style="color: #dc2626; margin-top: 0; font-size: 20px;">⚠️ FINAL NOTICE</h2>
                <p style="color: #dc2626; margin: 0; font-size: 16px; line-height: 1.6;">
                  Your DigitalCard Premium subscription has been inactive for <strong>10 days</strong>. 
                  Your custom data and premium settings will be <strong>permanently deleted in 5 days</strong> 
                  if no action is taken.
                </p>
              </div>
              
              <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                <strong>What will be deleted:</strong>
              </p>
              <ul style="color: #374151; line-height: 1.8; background: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444;">
                <li>🔗 Your custom vanity URL and branding</li>
                <li>🎨 Custom template settings and designs</li>
                <li>📊 All analytics and networking data</li>
                <li>💼 Business information and integrations</li>
                <li>📱 QR codes and sharing configurations</li>
              </ul>
              
              <div style="background: #dbeafe; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0;">
                <h3 style="color: #1e40af; margin-top: 0;">💡 Restore your account now:</h3>
                <p style="color: #1e40af; margin: 0; line-height: 1.6;">
                  Update your payment method to instantly restore all features and prevent data deletion. 
                  Your professional network is worth preserving!
                </p>
              </div>
              
              <div style="text-align: center;">
                <a href="https://my.dgtldigicard.com/dashboard/billing" class="cta-button" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); font-size: 18px; padding: 20px 40px;">
                  🔧 Restore My Account NOW
                </a>
                <p style="font-size: 12px; color: #ef4444; margin-top: 10px; font-weight: bold;">
                  Only 5 days remaining before permanent deletion
                </p>
              </div>
              
              <div style="background: #fffbeb; padding: 20px; border-radius: 8px; border: 2px solid #fbbf24; margin-top: 30px;">
                <h4 style="color: #92400e; margin: 0 0 10px 0;">⏰ Timeline:</h4>
                <ul style="color: #92400e; margin: 0; line-height: 1.6;">
                  <li><strong>Today:</strong> Last chance to save your data</li>
                  <li><strong>Day 5:</strong> Account and data permanently deleted</li>
                  <li><strong>After deletion:</strong> Recovery is impossible</li>
                </ul>
              </div>
            </div>
            <div class="footer">
              <p style="color: #dc2626; font-weight: bold;">Don't lose your professional network!</p>
              <p><a href="https://my.dgtldigicard.com/signin" style="color: #667eea;">Emergency account access</a> | 
                 <a href="mailto:contact@dgtlmart.com" style="color: #667eea;">Urgent support</a></p>
              <p style="font-size: 12px; color: #dc2626; margin-top: 15px;">
                This is an automated final notice. After deletion, your data cannot be recovered.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    }
  };

  return templates[type];
};

// Send email using ZeptoMail
const sendEmail = async (to, subject, html, userName) => {
  try {
    console.log(`▶️ Sending email to ${to}: ${subject}`);
    
    const response = await client.sendMail({
      from: {
        address: 'noreply@dgtlmart.com',
        name: 'DigitalCard Team',
      },
      to: [
        {
          email_address: {
            address: to,
            name: userName || to.split('@')[0],
          },
        },
      ],
      subject: subject,
      htmlbody: html,
    });

    console.log('✅ ZeptoMail response:', JSON.stringify(response, null, 2));
    
    if (response.message === 'OK' || (response.data && response.data.some((item) => item.code === 'EM_104'))) {
      console.log(`🎉 Email sent successfully! MessageId: ${response.MessageId}`);
      return true;
    } else {
      console.error('⚠️ Unexpected ZeptoMail response:', response);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error sending email to ${to}:`, JSON.stringify(error.error || error, null, 2));
    return false;
  }
};

// Main function to check and send emails
const checkAndSendEmails = async () => {
  try {
    console.log('🚀 Starting scheduled email check...');
    
    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000));
    const twoDaysAgo = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000));
    const tenDaysAgo = new Date(now.getTime() - (10 * 24 * 60 * 60 * 1000));

    // Get all users
    const usersSnapshot = await db.collection('users').get();
    
    let emailsSent = 0;
    const emailPromises = [];

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const { email, firstName, trialStartDate, isPremium, expireDate } = userData;
      
      if (!email) continue; // Skip users without email

      const userName = firstName || 'there';
      
      // Check trial users
      if (!isPremium && trialStartDate) {
        const trialStart = trialStartDate.toDate ? trialStartDate.toDate() : new Date(trialStartDate);
        const trialEnd = new Date(trialStart.getTime() + (15 * 24 * 60 * 60 * 1000));
        
        // 2 days before trial expires
        if (trialEnd > now && trialEnd <= twoDaysFromNow) {
          const emailTemplate = getEmailTemplate('trial_2_days_before', userName);
          emailPromises.push(sendEmail(email, emailTemplate.subject, emailTemplate.html, userName));
          emailsSent++;
        }
        // 2 days after trial expired
        else if (trialEnd <= twoDaysAgo && trialEnd > tenDaysAgo) {
          const emailTemplate = getEmailTemplate('trial_2_days_after', userName);
          emailPromises.push(sendEmail(email, emailTemplate.subject, emailTemplate.html, userName));
          emailsSent++;
        }
        // 10 days after trial expired
        else if (trialEnd <= tenDaysAgo) {
          const emailTemplate = getEmailTemplate('trial_10_days_after', userName);
          emailPromises.push(sendEmail(email, emailTemplate.subject, emailTemplate.html, userName));
          emailsSent++;
        }
      }
      
      // Check premium users
      if (isPremium && expireDate) {
        const premiumExpiry = expireDate.toDate ? expireDate.toDate() : new Date(expireDate);
        
        // 2 days before premium expires
        if (premiumExpiry > now && premiumExpiry <= twoDaysFromNow) {
          const emailTemplate = getEmailTemplate('premium_2_days_before', userName);
          emailPromises.push(sendEmail(email, emailTemplate.subject, emailTemplate.html, userName));
          emailsSent++;
        }
        // 2 days after premium expired
        else if (premiumExpiry <= twoDaysAgo && premiumExpiry > tenDaysAgo) {
          const emailTemplate = getEmailTemplate('premium_2_days_after', userName);
          emailPromises.push(sendEmail(email, emailTemplate.subject, emailTemplate.html, userName));
          emailsSent++;
        }
        // 10 days after premium expired
        else if (premiumExpiry <= tenDaysAgo) {
          const emailTemplate = getEmailTemplate('premium_10_days_after', userName);
          emailPromises.push(sendEmail(email, emailTemplate.subject, emailTemplate.html, userName));
          emailsSent++;
        }
      }
    }

    // Send all emails
    if (emailPromises.length > 0) {
      const results = await Promise.allSettled(emailPromises);
      const successCount = results.filter(result => result.status === 'fulfilled' && result.value === true).length;
      console.log(`✅ Successfully sent ${successCount} out of ${emailsSent} emails`);
    } else {
      console.log('ℹ️ No expiry emails to send today');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        emailsSent,
        message: `Processed users and sent ${emailsSent} emails`
      })
    };
    
  } catch (error) {
    console.error('❌ Error in scheduled email function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false, 
        error: error.message 
      })
    };
  }
};

// Export as scheduled function - runs every day at 9 AM UTC
const handler = schedule('0 9 * * *', checkAndSendEmails);

module.exports = { handler };
