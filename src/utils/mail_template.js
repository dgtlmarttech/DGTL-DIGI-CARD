const getEmailTemplate = (type, userName, daysLeft, isExpired = false) => {
  const baseStyles = `
    <style>
      .container { 
        max-width: 600px; 
        margin: 0 auto; 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        background: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 8px 32px rgba(0,0,0,0.08);
      }
      .header { 
        background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%); 
        color: white; 
        padding: 40px 30px 30px; 
        text-align: center; 
        position: relative;
      }
      .logo-section {
        margin-bottom: 20px;
      }
      .logo {
        width: 60px;
        height: 60px;
        margin-bottom: 15px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(255,255,255,0.1);
      }
      .brand-name {
        font-size: 24px;
        font-weight: 700;
        color: #ffffff;
        margin: 0;
        letter-spacing: 0.5px;
        text-transform: uppercase;
      }
      .brand-tagline {
        font-size: 12px;
        color: #94a3b8;
        margin: 5px 0 0 0;
        letter-spacing: 1px;
        text-transform: uppercase;
      }
      .content { 
        background: white; 
        padding: 40px 30px; 
        color: #334155;
        line-height: 1.7;
      }
      .cta-button { 
        display: inline-block; 
        padding: 16px 32px; 
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); 
        color: white; 
        text-decoration: none; 
        border-radius: 10px; 
        font-weight: 600; 
        font-size: 16px; 
        margin: 25px 0; 
        box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
        transition: all 0.3s ease;
      }
      .cta-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
      }
      .offer-box { 
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
        color: white; 
        padding: 25px; 
        border-radius: 12px; 
        text-align: center; 
        margin: 30px 0;
        box-shadow: 0 4px 16px rgba(245, 158, 11, 0.2);
      }
      .footer { 
        background: #f8fafc;
        text-align: center; 
        padding: 30px; 
        color: #64748b; 
        font-size: 14px;
        border-top: 1px solid #e2e8f0;
      }
      .divider {
        height: 1px;
        background: linear-gradient(to right, transparent, #e2e8f0, transparent);
        margin: 30px 0;
      }
      .feature-highlight {
        background: #f1f5f9;
        padding: 20px;
        border-radius: 8px;
        margin: 20px 0;
        border-left: 4px solid #3b82f6;
      }
    </style>
  `;

  const logoHeader = `
    <div class="logo-section">
      <img src="https://my.dgtldigicard.com/dgtlmart-logo.png" alt="DGTL DIGI CARD" class="logo" style="width:100px;height:100px;"/>
      <h2 class="brand-name">DGTL DIGI CARD</h2>
      <p class="brand-tagline">Digital Business Solutions</p>
    </div>
  `;

  // NOTE: Trial mailer templates have been removed.
  // Free trial is replaced with a direct ₹99/year payment.
  // Only Premium renewal mailers remain below.

  const templates = {

    // ── Premium Renewal Mailers (4 total) ─────────────────────────────────────

    // 1. Premium 10 days before renewal
    premium_10_days_before_discount: {
      subject: `🌟 Renewal Reminder: Exclusive Discount Inside!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${baseStyles}
        </head>
        <body style="background-color: #f1f5f9; margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div class="container">
            <div class="header">
              ${logoHeader}
              <h1 style="margin: 20px 0 0 0; font-size: 28px; font-weight: 700;">🌟 Renewal Time, ${userName}!</h1>
              <p style="margin: 15px 0 0 0; opacity: 0.9; font-size: 16px;">Your Premium subscription renews in 10 days</p>
            </div>
            <div class="content">
              <p style="font-size: 18px; margin-bottom: 25px; color: #475569;">
                Thank you for being a valued <strong>DGTL DIGI CARD Premium</strong> member! 
                Renew now with an exclusive discount.
              </p>
              
              <div class="offer-box">
                <h2 style="margin: 0 0 15px 0; font-size: 26px; font-weight: 700;">🎉 Loyalty Discount</h2>
                <p style="margin: 0 0 10px 0; font-size: 20px; font-weight: 600;">Renew for just ₹99/year!</p>
                <p style="margin: 0; opacity: 0.95; font-size: 16px;">25% off your renewal • Limited time</p>
              </div>
              
              <div style="text-align: center;">
                <a href="https://my.dgtldigicard.com/payment" class="cta-button">
                  🚀 Renew &amp; Save Now
                </a>
              </div>
            </div>
            <div class="footer">
              <p style="margin: 0 0 15px 0; font-weight: 600; color: #475569;">DGTL DIGI CARD</p>
              <p style="margin: 0 0 15px 0;"><a href="https://my.dgtldigicard.com/signin" style="color: #3b82f6; text-decoration: none;">Sign in to your account</a> | 
                 <a href="mailto:contact@dgtlmart.com" style="color: #3b82f6; text-decoration: none;">Contact Support</a></p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">© 2024 DGTL DIGI CARD. Making networking effortless.</p>
            </div>
          </div>
        </body>
        </html>
      `
    },

    // 2. Premium 2 days before renewal
    premium_2_days_before_discount: {
      subject: `⏰ Renewal Reminder: 2 Days Left + Special Discount!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${baseStyles}
        </head>
        <body style="background-color: #f1f5f9; margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div class="container">
            <div class="header" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);">
              ${logoHeader}
              <h1 style="margin: 20px 0 0 0; font-size: 28px; font-weight: 700;">⏰ Renewal Alert!</h1>
              <p style="margin: 15px 0 0 0; opacity: 0.9; font-size: 16px;">Hi ${userName}, your subscription renews in 2 days</p>
            </div>
            <div class="content">
              <p style="font-size: 18px; margin-bottom: 25px; color: #475569;">
                Your <strong>DGTL DIGI CARD Premium</strong> subscription renews in 2 days. 
                Secure another year at a special discounted rate!
              </p>
              
              <div class="offer-box" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);">
                <h2 style="margin: 0 0 15px 0; font-size: 26px; font-weight: 700;">🎯 Quick Renewal Deal</h2>
                <p style="margin: 0 0 10px 0; font-size: 20px; font-weight: 600;">Renew now for ₹99/year!</p>
                <p style="margin: 0; opacity: 0.95; font-size: 16px;">Act fast - only 2 days left!</p>
              </div>
              
              <div style="text-align: center;">
                <a href="https://my.dgtldigicard.com/payment" class="cta-button" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);">
                  🔥 Renew with Discount
                </a>
              </div>
            </div>
            <div class="footer">
              <p style="margin: 0 0 15px 0; font-weight: 600; color: #475569;">DGTL DIGI CARD</p>
              <p style="margin: 0 0 15px 0;"><a href="https://my.dgtldigicard.com/signin" style="color: #3b82f6; text-decoration: none;">Sign in to your account</a> | 
                 <a href="mailto:contact@dgtlmart.com" style="color: #3b82f6; text-decoration: none;">Contact Support</a></p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">© 2024 DGTL DIGI CARD. Making networking effortless.</p>
            </div>
          </div>
        </body>
        </html>
      `
    },

    // 3. Premium 2 days after expiry (win-back)
    premium_2_days_after_discount: {
      subject: `💔 Your Premium Expired - Special Win-Back Offer!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${baseStyles}
        </head>
        <body style="background-color: #f1f5f9; margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div class="container">
            <div class="header" style="background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);">
              ${logoHeader}
              <h1 style="margin: 20px 0 0 0; font-size: 28px; font-weight: 700;">💔 We Want You Back!</h1>
              <p style="margin: 15px 0 0 0; opacity: 0.9; font-size: 16px;">Hi ${userName}, your Premium subscription expired 2 days ago</p>
            </div>
            <div class="content">
              <p style="font-size: 18px; margin-bottom: 25px; color: #475569;">
                We miss having you as a <strong>DGTL DIGI CARD Premium</strong> member, ${userName}! 
                Come back with this exclusive offer.
              </p>
              
              <div class="offer-box" style="background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);">
                <h2 style="margin: 0 0 15px 0; font-size: 26px; font-weight: 700;">🎁 Win-Back Offer</h2>
                <p style="margin: 0 0 10px 0; font-size: 20px; font-weight: 600;">Return for ₹99/year!</p>
                <p style="margin: 0; opacity: 0.95; font-size: 16px;">Exclusive 25% discount to welcome you back</p>
              </div>
              
              <div style="text-align: center;">
                <a href="https://my.dgtldigicard.com/payment" class="cta-button" style="background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);">
                  💜 Reactivate Premium
                </a>
              </div>
            </div>
            <div class="footer">
              <p style="margin: 0 0 15px 0; font-weight: 600; color: #475569;">DGTL DIGI CARD</p>
              <p style="margin: 0 0 15px 0;"><a href="https://my.dgtldigicard.com/signin" style="color: #3b82f6; text-decoration: none;">Sign in to your account</a> | 
                 <a href="mailto:contact@dgtlmart.com" style="color: #3b82f6; text-decoration: none;">Contact Support</a></p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">© 2024 DGTL DIGI CARD. Making networking effortless.</p>
            </div>
          </div>
        </body>
        </html>
      `
    },

    // 4. Premium 10 days after expiry (final call)
    premium_10_days_after_discount: {
      subject: `🚨 Final Opportunity: Premium Reactivation Offer`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${baseStyles}
        </head>
        <body style="background-color: #f1f5f9; margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div class="container">
            <div class="header" style="background: linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%);">
              ${logoHeader}
              <h1 style="margin: 20px 0 0 0; font-size: 28px; font-weight: 700;">🚨 Final Opportunity!</h1>
              <p style="margin: 15px 0 0 0; opacity: 0.9; font-size: 16px;">Hi ${userName}, last chance to reactivate Premium</p>
            </div>
            <div class="content">
              <p style="font-size: 18px; margin-bottom: 25px; color: #475569;">
                This is our final attempt to bring you back to <strong>DGTL DIGI CARD Premium</strong>, ${userName}. 
                Don't miss this last opportunity.
              </p>
              
              <div class="offer-box" style="background: linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%);">
                <h2 style="margin: 0 0 15px 0; font-size: 26px; font-weight: 700;">⚡ Final Offer</h2>
                <p style="margin: 0 0 10px 0; font-size: 20px; font-weight: 600;">Last chance: ₹99/year</p>
                <p style="margin: 0; opacity: 0.95; font-size: 16px;">This offer expires very soon!</p>
              </div>
              
              <div style="text-align: center;">
                <a href="https://my.dgtldigicard.com/payment" class="cta-button" style="background: linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%);">
                  🔥 Final Reactivation
                </a>
              </div>
              
              <div class="divider"></div>
              
              <p style="font-size: 14px; color: #dc2626; text-align: center; margin: 0; font-weight: 600;">
                ⚠️ This is our final outreach. We hope to see you back!
              </p>
            </div>
            <div class="footer">
              <p style="margin: 0 0 15px 0; font-weight: 600; color: #475569;">DGTL DIGI CARD</p>
              <p style="margin: 0 0 15px 0;"><a href="https://my.dgtldigicard.com/signin" style="color: #3b82f6; text-decoration: none;">Sign in to your account</a> | 
                 <a href="mailto:contact@dgtlmart.com" style="color: #3b82f6; text-decoration: none;">Contact Support</a></p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">© 2024 DGTL DIGI CARD. Making networking effortless.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }
  };

  return templates[type];
};

export default getEmailTemplate;
