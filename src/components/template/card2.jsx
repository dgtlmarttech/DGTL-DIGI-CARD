import { useEffect, useMemo } from 'react';
import QRCode from 'react-qr-code';
import {
  BsTelephoneFill,
  BsGlobe,
  BsEnvelopeFill,
  BsGeoAltFill,
} from 'react-icons/bs';
import {
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaTwitter,
  FaFacebook,
} from "react-icons/fa";

/**
 * Props:
 * - userInfo: { imgUrl, businessName, website, firstName, lastName, mobile, email, address, about, isPremium, customUID }
 */
export default function ContactCard2({ userInfo }) {

  // Calculate and set --vh for true mobile height
  useEffect(() => {
    const setViewportHeight = () => {
      document.documentElement.style.setProperty(
        '--vh',
        `${window.innerHeight * 0.01}px`
      );
    };
    window.addEventListener('resize', setViewportHeight);
    setViewportHeight();
    return () => window.removeEventListener('resize', setViewportHeight);
  }, []);

  // Generate vCard data string
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

  // Update document title
  useEffect(() => {
    const title = userInfo.firstName
      ? `${userInfo.firstName} ${userInfo.lastName || ''} - Digital Card`
      : 'Digital Business Card';
    document.title = title;
  }, [userInfo]);

  // Create vCard blob URL for download
  const vcardUrl = useMemo(() => {
    const vcardData = generateVCardData(userInfo);
    const blob = new Blob([vcardData], { type: 'text/vcard' });
    return URL.createObjectURL(blob);
  }, [userInfo]);

  // Destructure fields
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
    customUID = '',
    socialLinks = [],
  } = userInfo;

  // Download vCard file
  const saveContact = async () => {
    const vcard = generateVCardData(userInfo);
    if (window.showSaveFilePicker) {
      try {
        const options = {
          suggestedName: `${firstName}_${lastName}.vcf`,
          types: [{ description: 'vCard File', accept: { 'text/vcard': ['.vcf'] } }],
        };
        const fileHandle = await window.showSaveFilePicker(options);
        const writable = await fileHandle.createWritable();
        await writable.write(vcard);
        await writable.close();
      } catch (error) {
        console.error('Save failed:', error);
      }
    } else {
      const blob = new Blob([vcard], { type: 'text/vcard' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${firstName}_${lastName}.vcf`;
      link.click();
    }
  };

  // Ensure clickable link
  const getClickableLink = (link) => {
    if (!link) return '';
    return link.startsWith('http://') || link.startsWith('https://')
      ? link
      : `http://${link}`;
  };

  // Share or copy vCard
  const shareContact = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${firstName} ${lastName} - Digital Card`,
          url: `https://my.dgtldigicard.com/${customUID || userInfo.uid}`,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(generateVCardData(userInfo));
        alert('Contact copied to clipboard!');
      } catch (error) {
        alert('Sharing not supported in this browser.');
      }
    }
  };

const renderSocialIcon = (platform) => {
    switch (platform) {
      case "Instagram":
        return <FaInstagram />;
      case "YouTube":
        return <FaYoutube />;
      case "LinkedIn":
        return <FaLinkedin />;
      case "Twitter":
        return <FaTwitter />;
      case "Facebook":
        return <FaFacebook />;
    }
  };
  


  return (
    <div
      className="pt-2 d-flex justify-content-center"
      style={{
        backgroundImage: 'url("/card2-1.png"), url("/card2-2.png")',
        backgroundColor: 'white',
        backgroundSize: 'cover, contain',
        // backgroundPosition: 'center top, center bottom',
        backgroundPosition: 'center top, -93px -93px',
        backgroundRepeat: 'no-repeat, no-repeat',
        width: '100%',
        maxWidth: '380px',
        height: 'calc(var(--vh) * 100)',
        aspectRatio: '9 / 16',
      }}
    >


      <div className="px-4 w-100" style={{ marginTop: '15%' }}>
  {/* Top row: avatar/info on left, QR/actions on right */}
  <div className="d-flex justify-content-between align-items-start mb-3">
    
    {/* Left: Avatar + Name/Title */}
    <div
      className="text-center"
      style={{
        width: '50%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingRight: '1rem',
      }}
    >
      <img
        src={imgUrl}
        alt={firstName}
        style={{
          width: '130px',
          height: '130px',
          objectFit: 'cover',
          border: '5px solid rgb(26, 118, 204)',
          borderRadius: '50%',
        }}
      />
      <h5 className="fw-bold text-dark mt-3 mb-1" style={{ fontSize: '1.1rem' }}>
        {`${firstName} ${lastName}`}
      </h5>
      <p className="text-secondary mb-0" style={{ fontSize: '0.9rem' }}>
        {businessName}
      </p>
    </div>

    {/* Right: QR + Buttons */}
    <div
      className="text-center"
      style={{
        width: '45%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <a href={vcardUrl} download={`${firstName}_${lastName}.vcf`}>
        <div
          className="bg-white rounded shadow-sm mb-3"
          style={{
            padding: '0.5rem',
            transition: 'transform 0.2s ease-in-out',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <QRCode value={generateVCardData(userInfo)} size={100} />
        </div>
      </a>
      <button
  onClick={saveContact}
  style={{
    display: 'block',
    width: '100%',
    fontSize: '0.85rem',
    padding: '0.4rem 0',
    borderRadius: '999px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  }}
  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0056b3'}
  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#007bff'}
>
  Save Contact
</button>

<button
  onClick={shareContact}
  style={{
    display: 'block',
    width: '100%',
    marginTop: '0.5rem',
    fontSize: '0.85rem',
    padding: '0.2rem 0',
    borderRadius: '999px',
    backgroundColor: 'transparent',
    color: '#007bff',
    border: '1px solid #007bff',
    cursor: 'pointer',
    transition: 'color 0.2s, border-color 0.2s',
  }}
  onMouseEnter={e => {
    e.currentTarget.style.color = '#0056b3';
    e.currentTarget.style.borderColor = '#0056b3';
  }}
  onMouseLeave={e => {
    e.currentTarget.style.color = '#007bff';
    e.currentTarget.style.borderColor = '#007bff';
  }}
>
  <i className="bi bi-share me-1 fs-6"></i> Share
</button>
    </div>
  </div>



        {/* Contact details */}
       <div className="text-start mx-3" style={{ maxWidth: '400px' }}>
  {[
    {
      icon: <BsTelephoneFill className="fs-5" style={{ color: '#0582f7' }} />,
      label: mobile,
      href: `tel:${mobile}`,
    },
    {
      icon: <BsGlobe className="fs-5" style={{ color: '#0582f7' }} />,
      label: website,
      href: getClickableLink(website),
      isExternal: true,
    },
    {
      icon: <BsEnvelopeFill className="fs-5" style={{ color: '#0582f7' }} />,
      label: email,
      href: `mailto:${email}`,
    },
    {
      icon: <BsGeoAltFill className="fs-5" style={{ color: '#0582f7' }} />,
      label: address,
      href: `http://maps.google.com/?q=${address}`,
      isExternal: true,
    },
  ].map((item, idx) => (
    <div
      key={idx}
      className="d-flex align-items-center mb-3"
      style={{ wordBreak: 'break-word' }}
    >
      <div
        style={{
          width: '30px',
          minWidth: '30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {item.icon}
      </div>
      <a
        href={item.href}
        target={item.isExternal ? '_blank' : undefined}
        rel={item.isExternal ? 'noopener noreferrer' : undefined}
        className="ms-3 text-decoration-none"
        style={{
          color: '#1187ac',
          fontSize: '0.95rem',
          lineHeight: '1.4',
          wordBreak: 'break-word',
          flex: 1,
        }}
      >
        {item.label}
      </a>
    </div>
  ))}
</div>

{Array.isArray(socialLinks) && socialLinks.length > 0 && (
  <div className="mt-3 mb-2">
    <h6 className="fw-bold mb-2" style={{ color: "#172333" }}>
      Social Media
    </h6>
    <div className="d-flex gap-3">
      {socialLinks.map((linkObj, idx) => {
        const { platform, url } = linkObj;
        if (!platform || !url) return null;
        return (
          <a
            key={idx}
            href={getClickableLink(url)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "1.5rem",
              color: "#0582f7",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "white",
              borderRadius: "50%",
              boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
              transition:
                "transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#0582f7";
              e.currentTarget.style.color = "white";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "white";
              e.currentTarget.style.color = "#0582f7";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 2px 5px rgba(0, 0, 0, 0.1)";
            }}
            aria-label={platform}
          >
            {renderSocialIcon(platform)}
          </a>
        );
      })}
    </div>
  </div>
)}

        {/* About */}
        {about && (
          <div
            className="bg-white rounded mx-3 p-3 mt-3"
            style={{
              boxShadow: '0 1px 6px rgba(0,0,0,0.1)',
              border: '1px solid #eee',
            }}
          >
            <h6 className="fw-bold mb-2" style={{ color: '#1a76cc' }}>About</h6>
            <p className="mb-0 text-dark" style={{ fontSize: '0.95rem' }}>{about}</p>
          </div>
        )}
      </div>
    </div>
  );
}
