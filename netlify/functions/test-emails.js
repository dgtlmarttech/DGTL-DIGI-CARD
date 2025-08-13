const { schedule } = require('@netlify/functions');
const { SendMailClient } = require('zeptomail');
// Remove the Firebase import for now since it's causing issues
// import { db } from '../../src/firebase/firebase'

// Initialize ZeptoMail client (keeping for structure)
const zeptoUrl = process.env.ZEPTO_URL || 'https://api.zeptomail.com/';
const zeptoToken = process.env.ZEPTO_TOKEN;

if (!zeptoToken) {
  console.error('Missing ZEPTO_TOKEN! Function will not work.');
}

const client = new SendMailClient({ url: zeptoUrl, token: zeptoToken });

// Beautiful HTML Email Templates (keeping same structure)
const getEmailTemplate = (type, userName, daysLeft, isExpired = false) => {
  const templates = {
    trial_2_days_before: {
      subject: `🚀 Your DigitalCard trial expires in 2 days - Don't miss out!`,
      html: `Trial ending email for ${userName}`
    },
    trial_2_days_after: {
      subject: `😔 We miss you! Special comeback offer - 25% OFF`,
      html: `Comeback offer email for ${userName}`
    },
    trial_10_days_after: {
      subject: `💔 Before we say goodbye - Your feedback matters`,
      html: `Feedback request email for ${userName}`
    },
    premium_2_days_before: {
      subject: `💎 Your Premium subscription renews in 2 days - You're all set!`,
      html: `Premium renewal reminder for ${userName}`
    },
    premium_2_days_after: {
      subject: `⚠️ Payment issue - Restore your Premium access now`,
      html: `Payment failed email for ${userName}`
    },
    premium_10_days_after: {
      subject: `🚨 URGENT: Account deletion in 5 days - Last chance to save your data`,
      html: `Final warning email for ${userName}`
    }
  };

  return templates[type];
};

// Mock email function - only logs to console
const sendEmail = async (to, subject, html, userName) => {
  try {
    console.log(`\n📧 [TEST MODE] Email that would be sent:`);
    console.log(`📨 To: ${to}`);
    console.log(`📨 Subject: ${subject}`);
    console.log(`👤 User: ${userName}`);
    console.log(`📄 Content: ${html}`);
    console.log(`✅ Email logged successfully (not actually sent)\n`);
    
    return true; // Simulate success
  } catch (error) {
    console.error(`❌ Error logging email to ${to}:`, error);
    return false;
  }
};

// Create demo data function (fixed)
const createDemoUsers = () => {
  const now = new Date();
  
  const demoUsers = [
    // 1. Trial user - expires in 2 days
    {
      id: 'demo-1',
      email: 'trial-2days-before@test.com',
      firstName: 'Alice',
      lastName: 'Johnson',
      isPremium: false,
      trialStartDate: {
        toDate: () => new Date(now.getTime() - (13 * 24 * 60 * 60 * 1000))
      },
      customUID: 'alice-johnson',
    },

    // 2. Trial user - expired 2 days ago
    {
      id: 'demo-2',
      email: 'trial-2days-after@test.com',
      firstName: 'Bob',
      lastName: 'Smith',
      isPremium: false,
      trialStartDate: {
        toDate: () => new Date(now.getTime() - (17 * 24 * 60 * 60 * 1000))
      },
      customUID: 'bob-smith',
    },

    // 3. Trial user - expired 10 days ago
    {
      id: 'demo-3',
      email: 'trial-10days-after@test.com',
      firstName: 'Charlie',
      lastName: 'Brown',
      isPremium: false,
      trialStartDate: {
        toDate: () => new Date(now.getTime() - (25 * 24 * 60 * 60 * 1000))
      },
      customUID: 'charlie-brown',
    },

    // 4. Premium user - expires in 2 days
    {
      id: 'demo-4',
      email: 'premium-2days-before@test.com',
      firstName: 'Diana',
      lastName: 'Prince',
      isPremium: true,
      expireDate: {
        toDate: () => new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000))
      },
      customUID: 'diana-prince',
    },

    // 5. Premium user - expired 2 days ago
    {
      id: 'demo-5',
      email: 'premium-2days-after@test.com',
      firstName: 'Edward',
      lastName: 'Stark',
      isPremium: true,
      expireDate: {
        toDate: () => new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000))
      },
      customUID: 'edward-stark',
    },

    // 6. Premium user - expired 10 days ago
    {
      id: 'demo-6',
      email: 'premium-10days-after@test.com',
      firstName: 'Fiona',
      lastName: 'Gallagher',
      isPremium: true,
      expireDate: {
        toDate: () => new Date(now.getTime() - (10 * 24 * 60 * 60 * 1000))
      },
      customUID: 'fiona-gallagher',
    },

    // 7. Active trial user (should NOT trigger emails)
    {
      id: 'demo-7',
      email: 'trial-active@test.com',
      firstName: 'Hannah',
      lastName: 'Montana',
      isPremium: false,
      trialStartDate: {
        toDate: () => new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000))
      },
      customUID: 'hannah-montana',
    },

    // 8. User without email (should be skipped)
    {
      id: 'demo-8',
      firstName: 'John',
      lastName: 'Doe',
      isPremium: false,
      trialStartDate: {
        toDate: () => new Date(now.getTime() - (20 * 24 * 60 * 60 * 1000))
      },
      customUID: 'john-doe',
      // No email field
    },
  ];

  // Mock Firestore snapshot structure
  return {
    docs: demoUsers.map(user => ({
      id: user.id,
      data: () => user
    }))
  };
};

// Main function to check and send emails
const checkAndSendEmails = async (event, context) => {
  try {
    console.log('🚀 Starting scheduled email check (TEST MODE)...');
    
    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000));
    const twoDaysAgo = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000));
    const tenDaysAgo = new Date(now.getTime() - (10 * 24 * 60 * 60 * 1000));

    console.log(`📅 Current time: ${now.toISOString()}`);
    console.log(`📅 Two days from now: ${twoDaysFromNow.toISOString()}`);
    console.log(`📅 Two days ago: ${twoDaysAgo.toISOString()}`);
    console.log(`📅 Ten days ago: ${tenDaysAgo.toISOString()}\n`);

    // Get demo users (simulating Firestore)
    const usersSnapshot = createDemoUsers();
    console.log(`👥 Found ${usersSnapshot.docs.length} demo users to check\n`);
    
    let emailsSent = 0;
    const emailPromises = [];

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const { email, firstName, trialStartDate, isPremium, expireDate } = userData;
      
      console.log(`🔍 Checking user: ${firstName} (${email || 'No email'})`);
      
      if (!email) {
        console.log(`⏭️ Skipping ${firstName} - no email address\n`);
        continue;
      }

      const userName = firstName || 'there';
      
      // Check trial users
      if (!isPremium && trialStartDate) {
        const trialStart = trialStartDate.toDate();
        const trialEnd = new Date(trialStart.getTime() + (15 * 24 * 60 * 60 * 1000));
        
        console.log(`📅 Trial started: ${trialStart.toISOString()}`);
        console.log(`📅 Trial ends: ${trialEnd.toISOString()}`);
        
        // 2 days before trial expires
        if (trialEnd > now && trialEnd <= twoDaysFromNow) {
          console.log(`🎯 TRIGGER: Trial expires in 2 days`);
          const emailTemplate = getEmailTemplate('trial_2_days_before', userName);
          emailPromises.push(sendEmail(email, emailTemplate.subject, emailTemplate.html, userName));
          emailsSent++;
        }
        // 2 days after trial expired
        else if (trialEnd <= twoDaysAgo && trialEnd > tenDaysAgo) {
          console.log(`🎯 TRIGGER: Trial expired 2 days ago`);
          const emailTemplate = getEmailTemplate('trial_2_days_after', userName);
          emailPromises.push(sendEmail(email, emailTemplate.subject, emailTemplate.html, userName));
          emailsSent++;
        }
        // 10 days after trial expired
        else if (trialEnd <= tenDaysAgo) {
          console.log(`🎯 TRIGGER: Trial expired 10+ days ago`);
          const emailTemplate = getEmailTemplate('trial_10_days_after', userName);
          emailPromises.push(sendEmail(email, emailTemplate.subject, emailTemplate.html, userName));
          emailsSent++;
        }
        else {
          console.log(`ℹ️ No trial email trigger for ${userName}`);
        }
      }
      
      // Check premium users
      if (isPremium && expireDate) {
        const premiumExpiry = expireDate.toDate();
        
        console.log(`📅 Premium expires: ${premiumExpiry.toISOString()}`);
        
        // 2 days before premium expires
        if (premiumExpiry > now && premiumExpiry <= twoDaysFromNow) {
          console.log(`🎯 TRIGGER: Premium expires in 2 days`);
          const emailTemplate = getEmailTemplate('premium_2_days_before', userName);
          emailPromises.push(sendEmail(email, emailTemplate.subject, emailTemplate.html, userName));
          emailsSent++;
        }
        // 2 days after premium expired
        else if (premiumExpiry <= twoDaysAgo && premiumExpiry > tenDaysAgo) {
          console.log(`🎯 TRIGGER: Premium expired 2 days ago`);
          const emailTemplate = getEmailTemplate('premium_2_days_after', userName);
          emailPromises.push(sendEmail(email, emailTemplate.subject, emailTemplate.html, userName));
          emailsSent++;
        }
        // 10 days after premium expired
        else if (premiumExpiry <= tenDaysAgo) {
          console.log(`🎯 TRIGGER: Premium expired 10+ days ago`);
          const emailTemplate = getEmailTemplate('premium_10_days_after', userName);
          emailPromises.push(sendEmail(email, emailTemplate.subject, emailTemplate.html, userName));
          emailsSent++;
        }
        else {
          console.log(`ℹ️ No premium email trigger for ${userName}`);
        }
      }
      
      console.log(''); // Empty line for readability
    }

    // Process all emails (simulate sending)
    if (emailPromises.length > 0) {
      console.log(`📨 Processing ${emailPromises.length} emails...`);
      const results = await Promise.allSettled(emailPromises);
      const successCount = results.filter(result => result.status === 'fulfilled' && result.value === true).length;
      console.log(`✅ Successfully processed ${successCount} out of ${emailsSent} emails`);
    } else {
      console.log('ℹ️ No expiry emails to send today');
    }

    console.log('\n🎉 Email check completed (TEST MODE)');

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        emailsSent,
        mode: 'TEST - No emails actually sent',
        message: `Processed users and would send ${emailsSent} emails`
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

// Allow manual testing via HTTP
const handler = async (event, context) => {
  // If called via HTTP (for testing)
  if (event.httpMethod === 'GET') {
    console.log('🧪 Manual test triggered via HTTP');
    return await checkAndSendEmails(event, context);
  }
  
  // If called via schedule
  console.log('⏰ Scheduled trigger activated');
  return await checkAndSendEmails(event, context);
};

xports.handler = schedule('0 0 * * *', handler);
