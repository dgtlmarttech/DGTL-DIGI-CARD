'use client'
import { useEffect } from 'react';

const SignupSuccessPage = () => {

    useEffect(() => {
      document.title = "Successful Signup – Digital Visiting Card";
    
      // Facebook Pixel
      (function (f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = "2.0";
        n.queue = [];
        t = b.createElement(e);
        t.async = true;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(
        window,
        document,
        "script",
        "https://connect.facebook.net/en_US/fbevents.js"
      );
      window.fbq("init", "396102998437619");
      window.fbq("track", "PageView");
    }, []);

  return (
    // Main container for the page, centered with flexbox and responsive padding
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f3f4f6', // Equivalent to bg-gray-100
      padding: '16px', // Equivalent to p-4
      fontFamily: '"Inter", sans-serif',
      boxSizing: 'border-box', // Ensure padding is included in element's total width/height
      width: '100%'
    }}>
      {/* Card container for the message and buttons */}
      <div style={{
        backgroundColor: '#ffffff', // Equivalent to bg-white
        borderRadius: '12px', // Equivalent to rounded-xl
        boxShadow: '0 15px 30px rgba(0, 0, 0, 0.15)', // Custom shadow
        padding: '32px', // Equivalent to p-8, for md:p-12 consider dynamic adjustment or media queries (not possible inline)
        textAlign: 'center',
        maxWidth: '448px', // Equivalent to max-w-md
        width: '100%', // Equivalent to w-full, ensures responsiveness
        border: '1px solid #e0e0e0',
        transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out', // Keep transitions for visual feedback
      }}>
        {/* Icon for visual confirmation */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '24px', // Equivalent to mb-6
        }}>
          {/* Checkmark inside a circle SVG icon */}
          <svg style={{
            width: '64px', // Equivalent to w-16
            height: '64px', // Equivalent to h-16
            color: '#22c55e', // Equivalent to text-green-500
          }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>

        {/* Heading for the successful registration */}
        <h1 style={{
          fontSize: '36px', // Adjusted for responsiveness, fallback for md:text-4xl
          fontWeight: 'bold',
          color: '#1f2937', // Equivalent to text-gray-800
          marginBottom: '16px', // Equivalent to mb-4
          // For true responsiveness of font-size, a CSS-in-JS library or external CSS with media queries would be needed
          // This will be relatively larger on smaller screens and slightly smaller on larger screens
          // A more advanced inline solution would involve JavaScript to detect screen width and apply different font sizes
          // Example for a simple fluid font size (min 24px, max 36px, scales with viewport width):
          // fontSize: 'clamp(24px, 6vw, 36px)'
        }}>Registration Successful!</h1>

        {/* Informative message to the user */}
        <p style={{
          fontSize: '18px', // Equivalent to text-lg
          color: '#4b5563', // Equivalent to text-gray-600
          marginBottom: '32px', // Equivalent to mb-8
          lineHeight: '1.625', // Equivalent to leading-relaxed
        }}>
          A verification link has been sent to your email address. Please open your mailbox and click on the verification button to get your email verified.
        </p>

        {/* Container for the action buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px', // Equivalent to space-y-4
          width: '100%', // Ensure buttons take full width of container
        }}>
          {/* Button to open Gmail in a new tab */}
          <a
            href="https://mail.google.com/mail/u/0/#inbox" // Direct link to Gmail inbox
            target="_blank" // Opens in a new tab
            rel="noopener noreferrer" // Security best practice for target="_blank"
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 24px', // Equivalent to py-3 px-6
              borderRadius: '8px', // Equivalent to rounded-lg
              fontSize: '18px', // Equivalent to text-lg
              fontWeight: '600', // Equivalent to font-semibold
              color: '#ffffff', // Equivalent to text-white
              boxShadow: '0 8px 15px rgba(59, 130, 246, 0.4)', // Custom shadow
              background: 'linear-gradient(to right, #3b82f6, #2563eb)', // Equivalent to bg-gradient-to-r from-blue-600 to-blue-700
              transition: 'background 0.3s ease-in-out, transform 0.2s ease-in-out', // Transitions for hover/active
              textDecoration: 'none', // Remove underline from link
              cursor: 'pointer',
              overflow: 'hidden', // Required for shine effect
            }}
            // Note: Inline styles for :hover, :active, and pseudo-elements (like shine) are not directly possible.
            // These would require JavaScript event listeners (onMouseEnter, onMouseLeave, etc.) or external CSS.
            // The hover effects and shine previously implemented via Tailwind groups or pseudo-elements
            // are not replicable with pure inline styles without JS.
          >
            {/* Email icon */}
            <svg style={{
              width: '24px', // Equivalent to w-6
              height: '24px', // Equivalent to h-6
              marginRight: '8px', // Equivalent to mr-2
            }} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
            </svg>
            Open Gmail
          </a>

          {/* Button to navigate to the Sign In page */}
          <a
            href="/signin" // Placeholder for your sign-in page URL
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 24px', // Equivalent to py-3 px-6
              borderRadius: '8px', // Equivalent to rounded-lg
              fontSize: '18px', // Equivalent to text-lg
              fontWeight: '600', // Equivalent to font-semibold
              color: '#4a5568', // Adjusted for better contrast, equivalent to text-gray-800
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', // Equivalent to shadow-md
              border: '1px solid #d1d5db', // Equivalent to border border-gray-300
              background: 'linear-gradient(90deg, #e2e8f0, #edf2f7)', // Custom gradient
              transition: 'background 0.3s ease-in-out, transform 0.2s ease-in-out', // Transitions for hover/active
              textDecoration: 'none', // Remove underline from link
              cursor: 'pointer',
              overflow: 'hidden', // Required for subtle hover background
            }}
            // Note: Similar to the primary button, complex hover effects and pseudo-elements
            // are not replicable with pure inline styles without JavaScript.
          >
            Go to Sign In Page
          </a>
        </div>
      </div>
    </div>
  );
};

export default SignupSuccessPage;
