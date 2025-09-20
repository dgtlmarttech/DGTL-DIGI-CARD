import { useEffect, useMemo, useState } from 'react';
import QRCode from 'react-qr-code';

export default function ContactCard2({ userInfo }) {
  const [isHovered, setIsHovered] = useState(false);
  const [glowColor, setGlowColor] = useState('#00f5ff');

  // Core functions
  const generateVCardData = (info) => {
    let {
      firstName = '',
      lastName = '',
      mobile = '',
      email = '',
      businessName = '',
      website = '',
      address = '',
      about = '',
    } = info;

    if (mobile && (mobile.length === 10 || mobile.length === 11) && !mobile.startsWith('+')) {
      mobile = `+91${mobile}`;
    }

    return `BEGIN:VCARD
VERSION:4.0
FN:${firstName} ${lastName}
TEL;TYPE=cell,voice:${mobile}
EMAIL:${email}
ORG:${businessName}
URL:${website}
ADR;TYPE=work:;;${address};;;
NOTE:${about}
END:VCARD`;
  };

  useEffect(() => {
    const title = userInfo.firstName
      ? `${userInfo.firstName} ${userInfo.lastName || ''} - Digital Card`
      : 'Digital Business Card';
    document.title = title;
  }, [userInfo]);

  const vcardUrl = useMemo(() => {
    const vcardData = generateVCardData(userInfo);
    const blob = new Blob([vcardData], { type: 'text/vcard' });
    return URL.createObjectURL(blob);
  }, [userInfo]);

  const {
    imgUrl = '',
    businessName = '',
    website = '',
    firstName = '',
    lastName = '',
    mobile = '',
    email = '',
    address = '',
    about = '',
    socialLinks = [],
  } = userInfo;

  const saveContact = async () => {
    const vcard = generateVCardData(userInfo);
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${firstName}_${lastName}.vcf`;
    link.click();
  };

  const shareContact = async () => {
    const vcard = generateVCardData(userInfo);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${firstName} ${lastName} - Digital Card`,
          url: `https://my.dgtldigicard.com/${userInfo.customUID || userInfo.uid}`,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(vcard);
        alert('Contact copied to clipboard!');
      } catch (error) {
        alert('Sharing not supported in this browser.');
      }
    }
  };

  const getClickableLink = (link) => {
    if (!link) return "";
    return link.startsWith("http://") || link.startsWith("https://")
      ? link
      : `http://${link}`;
  };

  // Professional Tech Icons
  const EmailIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const PhoneIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7293C21.7209 20.9845 21.5573 21.2136 21.3521 21.4019C21.1468 21.5901 20.9046 21.7335 20.6407 21.8227C20.3769 21.9119 20.0974 21.9451 19.82 21.92C16.7428 21.5856 13.787 20.5341 11.19 18.85C8.77382 17.3147 6.72533 15.2662 5.19 12.85C3.49998 10.2412 2.44818 7.27099 2.12 4.18C2.09501 3.90347 2.12788 3.62476 2.21649 3.36162C2.3051 3.09849 2.44748 2.85669 2.63513 2.65162C2.82278 2.44655 3.05023 2.28271 3.30421 2.17052C3.5582 2.05833 3.83276 2.00026 4.11 2H7.11C7.59531 1.99522 8.06648 2.16708 8.43498 2.48353C8.80348 2.79999 9.04733 3.23945 9.11 3.72C9.23662 4.68007 9.47144 5.62273 9.81 6.53C9.94454 6.88792 9.97366 7.27691 9.8939 7.65088C9.81415 8.02485 9.62886 8.36811 9.36 8.64L8.09 9.91C9.51355 12.4135 11.5865 14.4865 14.09 15.91L15.36 14.64C15.6319 14.3711 15.9751 14.1858 16.3491 14.1061C16.7231 14.0263 17.1121 14.0555 17.47 14.19C18.3773 14.5286 19.3199 14.7634 20.28 14.89C20.7658 14.9535 21.2094 15.2023 21.5265 15.5776C21.8437 15.9529 22.0122 16.4297 22 16.92Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const WebsiteIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
      <path d="M2 12H22" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );

  const LocationIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 5.02944 7.02944 1 12 1C16.9706 1 21 5.02944 21 10Z" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );

  const LinkedInIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 8C17.5913 8 19.1174 8.63214 20.2426 9.75736C21.3679 10.8826 22 12.4087 22 14V21H18V14C18 13.4696 17.7893 12.9609 17.4142 12.5858C17.0391 12.2107 16.5304 12 16 12C15.4696 12 14.9609 12.2107 14.5858 12.5858C14.2107 12.9609 14 13.4696 14 14V21H10V14C10 12.4087 10.6321 10.8826 11.7574 9.75736C12.8826 8.63214 14.4087 8 16 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="2" y="9" width="4" height="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const InstagramIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="currentColor" strokeWidth="2"/>
      <path d="M16 11.37C16.1234 12.2022 15.9813 13.0522 15.5938 13.799C15.2063 14.5458 14.5931 15.1514 13.8416 15.5297C13.0901 15.9079 12.2384 16.0396 11.4078 15.9059C10.5771 15.7723 9.80976 15.3801 9.21484 14.7852C8.61992 14.1902 8.22773 13.4229 8.09407 12.5922C7.9604 11.7615 8.09207 10.9099 8.47033 10.1584C8.84859 9.40685 9.45419 8.79374 10.201 8.40624C10.9478 8.01874 11.7978 7.87658 12.63 8C13.4789 8.12588 14.2649 8.52146 14.8717 9.1283C15.4785 9.73515 15.8741 10.5211 16 11.37Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17.5 6.5H17.51" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const TwitterIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M23 3C22.0424 3.67548 20.9821 4.19211 19.86 4.53C19.2577 3.83751 18.4573 3.34669 17.567 3.12393C16.6767 2.90116 15.7395 2.957 14.8821 3.28445C14.0247 3.6119 13.2884 4.19439 12.773 4.95372C12.2575 5.71305 11.9877 6.61553 12 7.53V8.53C10.2426 8.57557 8.50127 8.18581 6.93101 7.39624C5.36074 6.60667 4.01032 5.43666 3 4C3 4 -1 13 8 17C5.94053 18.398 3.48716 19.099 1 19C10 24 21 19 21 7.5C20.9991 7.22145 20.9723 6.94359 20.92 6.67C21.9406 5.66349 22.6608 4.39271 23 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const renderSocialIcon = (platform) => {
    switch (platform) {
      case "LinkedIn":
        return <LinkedInIcon />;
      case "Instagram":
        return <InstagramIcon />;
      case "Twitter":
        return <TwitterIcon />;
      case "Facebook":
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 2H15C13.6739 2 12.4021 2.52678 11.4645 3.46447C10.5268 4.40215 10 5.67392 10 7V10H7V14H10V22H14V14H17L18 10H14V7C14 6.73478 14.1054 6.48043 14.2929 6.29289C14.4804 6.10536 14.7348 6 15 6H18V2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case "YouTube":
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.54 6.42C22.4212 5.94541 22.1793 5.51057 21.8387 5.15941C21.4981 4.80824 21.0708 4.55318 20.6 4.42C18.88 4 12 4 12 4S5.12 4 3.4 4.46C2.92921 4.59318 2.50191 4.84824 2.16131 5.19941C1.82071 5.55057 1.57879 5.98541 1.46 6.46C1.14 8.2 1 12 1 12S1 15.8 1.46 17.58C1.57879 18.0546 1.82071 18.4894 2.16131 18.8406C2.50191 19.1918 2.92921 19.4468 3.4 19.58C5.12 20 12 20 12 20S18.88 20 20.6 19.54C21.0708 19.4068 21.4981 19.1518 21.8387 18.8006C22.1793 18.4494 22.4212 18.0146 22.54 17.54C23 15.8 23 12 23 12S23 8.2 22.54 6.42Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polygon points="9.75,15.02 15.5,12 9.75,8.98" fill="currentColor"/>
          </svg>
        );
      default:
        return <WebsiteIcon />;
    }
  };

  return (
    <>
      <style jsx>{`
        .tech-neon-card {
          background: linear-gradient(145deg, #0a0a0a, #1a1a2e);
          border: 2px solid transparent;
          border-radius: 24px;
          position: relative;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .tech-neon-card::before {
          content: '';
          position: absolute;
          inset: 0;
          padding: 2px;
          background: linear-gradient(45deg, #00f5ff, #ff00f5, #f5ff00, #00f5ff);
          border-radius: 24px;
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: subtract;
          animation: neon-border 3s linear infinite;
        }

        @keyframes neon-border {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .tech-neon-card:hover {
          transform: translateY(-5px);
          box-shadow: 
            0 20px 40px rgba(0,245,255,0.3),
            0 0 60px rgba(0,245,255,0.2);
        }

        .tech-inner {
          position: relative;
          z-index: 2;
          background: linear-gradient(145deg, #0f0f23, #16213e);
          border-radius: 22px;
          margin: 2px;
          overflow: hidden;
        }

        .cyber-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(cyan 1px, transparent 1px),
            linear-gradient(90deg, cyan 1px, transparent 1px);
          background-size: 20px 20px;
          opacity: 0.1;
          animation: grid-move 20s linear infinite;
        }

        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(20px, 20px); }
        }

        .neon-element {
          background: rgba(0,245,255,0.05);
          border: 1px solid rgba(0,245,255,0.2);
          border-radius: 16px;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .neon-element::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0,245,255,0.4), transparent);
          transition: left 0.5s;
        }

        .neon-element:hover::before {
          left: 100%;
        }

        .neon-element:hover {
          background: rgba(0,245,255,0.1);
          border-color: rgba(0,245,255,0.4);
          box-shadow: 
            0 0 20px rgba(0,245,255,0.3),
            inset 0 0 20px rgba(0,245,255,0.1);
          transform: translateY(-2px);
        }

        .neon-button {
          background: linear-gradient(45deg, #00f5ff, #0080ff);
          border: none;
          border-radius: 12px;
          color: #000;
          font-weight: 700;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .neon-button::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent, rgba(255,255,255,0.4), transparent);
          transform: translateX(-100%);
          transition: transform 0.6s;
        }

        .neon-button:hover::after {
          transform: translateX(100%);
        }

        .neon-button:hover {
          transform: translateY(-2px);
          box-shadow: 
            0 10px 30px rgba(0,245,255,0.5),
            0 0 40px rgba(0,245,255,0.3);
        }

        .hologram-text {
          background: linear-gradient(45deg, #00f5ff, #ff00f5, #f5ff00);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: hologram 2s ease-in-out infinite alternate;
        }

        @keyframes hologram {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(90deg); }
        }

        .data-stream {
          position: absolute;
          width: 2px;
          height: 100px;
          background: linear-gradient(to bottom, transparent, #00f5ff, transparent);
          animation: data-flow 2s linear infinite;
        }

        @keyframes data-flow {
          0% { transform: translateY(-100px) scaleY(0); }
          50% { transform: translateY(0) scaleY(1); }
          100% { transform: translateY(100px) scaleY(0); }
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          background: #00f5ff;
          border-radius: 50%;
          animation: pulse-neon 1.5s ease-in-out infinite alternate;
          box-shadow: 0 0 10px #00f5ff;
        }

        @keyframes pulse-neon {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.3);
            opacity: 0.7;
          }
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at center, #0a0a23 0%, #000000 100%)',
        padding: '2rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        {/* Animated Background Elements */}
        <div style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none'
        }}>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="data-stream"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        <div 
          className="tech-neon-card"
          style={{
            width: '100%',
            maxWidth: '440px'
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="cyber-grid"></div>
          
          <div className="tech-inner" style={{ padding: '2.5rem 2rem' }}>
            {/* Profile Header */}
            <div style={{ textAlign: 'center', marginBottom: '2.5rem', position: 'relative' }}>
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #00f5ff, #0080ff)',
                  padding: '3px',
                  margin: '0 auto',
                  position: 'relative'
                }}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: '#0a0a23',
                    position: 'relative'
                  }}>
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={`${firstName} ${lastName}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '3rem',
                        fontWeight: '700',
                        color: '#00f5ff'
                      }}>
                        {firstName?.[0] || '?'}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Status Indicators */}
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  display: 'flex',
                  gap: '4px'
                }}>
                  <div className="pulse-dot"></div>
                  <div className="pulse-dot" style={{ animationDelay: '0.5s' }}></div>
                  <div className="pulse-dot" style={{ animationDelay: '1s' }}></div>
                </div>
              </div>

              <h1 className="hologram-text" style={{
                margin: '0',
                fontSize: '2rem',
                fontWeight: '700',
                marginBottom: '0.5rem',
                letterSpacing: '0.05em'
              }}>
                {firstName} {lastName}
              </h1>

              {businessName && (
                <p style={{
                  margin: '0 0 2rem 0',
                  fontSize: '1.1rem',
                  color: '#00f5ff',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }}>
                  {businessName}
                </p>
              )}

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center'
              }}>
                <button
                  onClick={saveContact}
                  className="neon-button"
                  style={{
                    padding: '0.875rem 1.5rem',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  <span style={{ position: 'relative', zIndex: 1 }}>Save Contact</span>
                </button>
                <button
                  onClick={shareContact}
                  className="neon-button"
                  style={{
                    padding: '0.875rem 1.5rem',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    position: 'relative',
                    background: 'linear-gradient(45deg, #ff00f5, #8000ff)'
                  }}
                >
                  <span style={{ position: 'relative', zIndex: 1 }}>Share</span>
                </button>
              </div>
            </div>

            {/* Contact Information */}
            <div style={{ marginBottom: '2rem' }}>
              {[
                { icon: <EmailIcon />, label: 'Email', value: email, href: `mailto:${email}`, color: '#00f5ff' },
                { icon: <PhoneIcon />, label: 'Phone', value: mobile, href: `tel:${mobile}`, color: '#ff00f5' },
                { icon: <WebsiteIcon />, label: 'Website', value: website, href: getClickableLink(website), color: '#f5ff00' },
                { icon: <LocationIcon />, label: 'Location', value: address, href: `https://maps.google.com/?q=${encodeURIComponent(address)}`, color: '#00ff80' }
              ].map(({ icon, label, value, href, color }) => (
                value && (
                  <div key={label} className="neon-element" style={{
                    padding: '1.25rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: `linear-gradient(45deg, ${color}, ${color}80)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#000',
                      flexShrink: 0,
                      boxShadow: `0 0 20px ${color}40`
                    }}>
                      {icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#999',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: '0.25rem'
                      }}>
                        {label}
                      </div>
                      <a
                        href={href}
                        target={href.startsWith('http') ? '_blank' : undefined}
                        rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        style={{
                          color: '#ffffff',
                          textDecoration: 'none',
                          fontWeight: '600',
                          fontSize: '1rem',
                          wordBreak: 'break-word'
                        }}
                      >
                        {value}
                      </a>
                    </div>
                  </div>
                )
              ))}
            </div>

            {/* QR Code Section */}
            <div className="neon-element" style={{
              padding: '2rem',
              textAlign: 'center',
              marginBottom: '2rem'
            }}>
              <h3 style={{
                margin: '0 0 1.5rem 0',
                fontSize: '1.1rem',
                color: '#00f5ff',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}>
                Quantum ID Scanner
              </h3>
              <div style={{
                display: 'inline-block',
                padding: '1rem',
                background: 'white',
                borderRadius: '16px',
                border: '2px solid #00f5ff',
                boxShadow: '0 0 30px rgba(0,245,255,0.3)'
              }}>
                <QRCode
                  value={generateVCardData(userInfo)}
                  size={140}
                  style={{ display: 'block' }}
                />
              </div>
            </div>

            {/* Social Networks */}
            {Array.isArray(socialLinks) && socialLinks.length > 0 && (
              <div className="neon-element" style={{
                padding: '1.5rem',
                marginBottom: '2rem'
              }}>
                <h3 style={{
                  margin: '0 0 1rem 0',
                  fontSize: '1rem',
                  color: '#ffffff',
                  fontWeight: '600',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }}>
                  Network Links
                </h3>
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'center'
                }}>
                  {socialLinks.map((linkObj, idx) => {
                    const { platform, url } = linkObj;
                    if (!platform || !url) return null;
                    const colors = ['#00f5ff', '#ff00f5', '#f5ff00', '#00ff80', '#ff8000'];
                    const color = colors[idx % colors.length];
                    
                    return (
                      <a
                        key={idx}
                        href={getClickableLink(url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          width: '50px',
                          height: '50px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: `linear-gradient(45deg, ${color}20, ${color}40)`,
                          border: `1px solid ${color}60`,
                          borderRadius: '12px',
                          color: color,
                          transition: 'all 0.3s ease',
                          textDecoration: 'none',
                          boxShadow: `0 0 15px ${color}30`
                        }}
                        onMouseOver={(e) => {
                          e.target.style.background = `linear-gradient(45deg, ${color}40, ${color}60)`;
                          e.target.style.boxShadow = `0 0 30px ${color}50`;
                          e.target.style.transform = 'translateY(-3px) scale(1.1)';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.background = `linear-gradient(45deg, ${color}20, ${color}40)`;
                          e.target.style.boxShadow = `0 0 15px ${color}30`;
                          e.target.style.transform = 'translateY(0) scale(1)';
                        }}
                      >
                        {renderSocialIcon(platform)}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* About Section */}
            {about && (
              <div className="neon-element" style={{
                padding: '1.5rem',
                position: 'relative'
              }}>
                <h3 style={{
                  margin: '0 0 1rem 0',
                  fontSize: '1rem',
                  color: '#ffffff',
                  fontWeight: '600',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }}>
                  Data Profile
                </h3>
                <p style={{
                  margin: '0',
                  fontSize: '0.95rem',
                  color: '#cccccc',
                  lineHeight: '1.6',
                  textAlign: 'center',
                  position: 'relative',
                  zIndex: 1
                }}>
                  {about}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
