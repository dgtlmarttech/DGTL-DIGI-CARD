import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Share2,
  Download,
  ExternalLink,
  Building,
  QrCode,
  X,
  Instagram,
  Linkedin,
  Youtube,
  Twitter,
  Facebook,
  Link
} from "lucide-react";
import QRCode from "react-qr-code";

// Helper function to shade color (for gradient)
// This function is kept from the original code as it dynamically generates
// a darker shade for the gradient based on the user's chosen color.
const shadeColor = (color, percent) => {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = parseInt((R * (100 + percent)) / 100);
  G = parseInt((G * (100 + percent)) / 100);
  B = parseInt((B * (100 + percent)) / 100);

  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;

  R = Math.round(R);
  G = Math.round(G);
  B = Math.round(B);

  const RR = R.toString(16).length === 1 ? "0" + R.toString(16) : R.toString(16);
  const GG = G.toString(16).length === 1 ? "0" + G.toString(16) : G.toString(16);
  const BB = B.toString(16).length === 1 ? "0" + B.toString(16) : B.toString(16);

  return "#" + RR + GG + BB;
};

// Updated QRCodeComponent to use react-qr-code directly
const QRCodeComponent = ({ value, size = 120, className = "" }) => (
  <div
    className={`bg-white rounded-lg p-2 ${className}`}
    style={{ width: size, height: size }}
  >
    <QRCode
      value={value}
      size={size - 16} // Adjusted for padding
      fgColor="#000000"
      bgColor="#ffffff"
      level="H"
      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
    />
  </div>
);

// Sample user data to showcase the card's appearance
const sampleUserInfo = {
  firstName: "John",
  lastName: "Doe",
  businessName: "Digital Solutions Inc.",
  title: "Senior Software Developer",
  email: "john.doe@example.com",
  mobile: "+1-555-123-4567",
  website: "johndoe.dev",
  address: "123 Tech Street\nSan Francisco, CA 94105",
  about: "Passionate software developer with 8+ years of experience in full-stack development. I specialize in React, Node.js, and cloud technologies.",
  imgUrl: "https://placehold.co/400x400/3b82f6/FFFFFF?text=JD",
  cardColor: "#3b82f6",
  socialLinks: [
    { platform: "LinkedIn", url: "linkedin.com/in/johndoe" },
    { platform: "Instagram", url: "instagram.com/johndoe" },
    { platform: "Twitter", url: "twitter.com/johndoe" },
    { platform: "Facebook", url: "facebook.com/johndoe" },
    { platform: "YouTube", url: "youtube.com/johndoe" },
  ]
};

const App = ({ userInfo = sampleUserInfo }) => {
  const cardColor = userInfo.cardColor || "#3b82f6";
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const getClickableLink = useCallback((link) => {
    if (!link) return "";
    return link.startsWith("http://") || link.startsWith("https://")
      ? link
      : `https://${link}`;
  }, []);

  useEffect(() => {
    let title = "Digital Business Card";
    if (userInfo.firstName) {
      title = `${userInfo.firstName} ${userInfo.lastName || ""} - Digital Card`;
    }
    document.title = title;
  }, [userInfo]);

  const vCardString = useMemo(() => {
    const {
      firstName = "",
      lastName = "",
      mobile = "",
      email = "",
      businessName = "",
      website = "",
      address = "",
      about = "",
      title = "",
    } = userInfo;

    let formattedMobile = mobile;
    if (formattedMobile && !formattedMobile.startsWith("+")) {
      formattedMobile =
        formattedMobile.length <= 10
          ? `+91${formattedMobile}`
          : `+${formattedMobile}`;
    }

    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      firstName || lastName ? `N:${lastName};${firstName};;;` : null,
      firstName || lastName ? `FN:${firstName} ${lastName}` : null,
      businessName ? `ORG:${businessName}` : null,
      title ? `TITLE:${title}` : null,
      formattedMobile ? `TEL;TYPE=CELL:${formattedMobile}` : null,
      email ? `EMAIL:${email}` : null,
      website ? `URL:${getClickableLink(website)}` : null,
      address ? `ADR;TYPE=WORK:;;${address.replace(/\n/g, '\\n')};;;` : null,
      about ? `NOTE:${about.replace(/\n/g, '\\n')}` : null,
      "END:VCARD",
    ].filter(Boolean);

    // IMPORTANT: Use "\r\n" for vCard line endings for better compatibility
    return lines.join("\r\n");
  }, [userInfo, getClickableLink]);

  const saveContact = async () => {
    const filename = `${(userInfo.firstName || 'contact')}_${(userInfo.lastName || '')}`
      .replace(/\s+/g, '_')
      .toLowerCase() + '.vcf';

    const blob = new Blob([vCardString], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareContact = async () => {
    // This is a placeholder share URL. In a real app, this would point to the user's card.
    const shareUrl = `https://my.dgtldigicard.com/${userInfo.customUID || userInfo.uid || ''}`;
    const shareData = {
      title: document.title,
      text: `Contact: ${document.title}`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(vCardString);
        console.log('Contact copied to clipboard!');
        // Use a custom message box instead of alert()
      }
    } catch (err) {
      console.error('Share failed:', err);
      // Fallback to downloading the file
      saveContact();
    }
  };

  const toggleQrModal = () => {
    setIsQrModalOpen(!isQrModalOpen);
  };

  const renderSocialIcon = (platform) => {
    const iconProps = { size: 20, className: "transition-transform group-hover:scale-110" };
    switch (platform) {
      case "Instagram":
        return <Instagram {...iconProps} />;
      case "YouTube":
        return <Youtube {...iconProps} />;
      case "LinkedIn":
        return <Linkedin {...iconProps} />;
      case "Twitter":
        return <Twitter {...iconProps} />;
      case "Facebook":
        return <Facebook {...iconProps} />;
      default:
        return <Link {...iconProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4 font-sans antialiased">
      <div className="w-full max-w-sm mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="flex flex-col">
          {/* Header Section */}
          <div
            className="relative p-8 rounded-b-[2.5rem] text-white flex flex-col justify-end min-h-[15rem] space-y-4"
            style={{
              background: `linear-gradient(135deg, ${cardColor} 0%, ${shadeColor(cardColor, -20)} 100%)`,
            }}
          >
            {/* Background decoration */}
            <div className="absolute inset-0 z-0 overflow-hidden opacity-30">
              <div className="absolute w-64 h-64 rounded-full bg-white/20 -top-16 -left-16"></div>
              <div className="absolute w-64 h-64 rounded-full bg-white/20 -bottom-16 -right-16"></div>
            </div>

            <div className="relative z-10 flex items-center justify-between gap-4">
              {/* Profile Section */}
              <div className="flex flex-col items-start gap-2">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white/50">
                  {userInfo.imgUrl ? (
                    <img
                      src={userInfo.imgUrl}
                      alt={`${userInfo.firstName} ${userInfo.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-700">
                      <User size={32} className="text-white/80" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col text-white">
                  {userInfo.businessName && (
                    <h1 className="text-sm font-light uppercase tracking-widest opacity-80">
                      {userInfo.businessName}
                    </h1>
                  )}
                  {(userInfo.firstName || userInfo.lastName) && (
                    <h2 className="text-2xl font-bold leading-tight">
                      {userInfo.firstName} {userInfo.lastName}
                    </h2>
                  )}
                  {userInfo.title && (
                    <p className="text-base font-light opacity-90">
                      {userInfo.title}
                    </p>
                  )}
                </div>
              </div>

              {/* QR Code */}
              <div
                className="cursor-pointer transition-transform duration-300 hover:scale-105 flex flex-col items-center gap-2"
                onClick={toggleQrModal}
              >
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center p-1">
                  <QRCodeComponent value={vCardString} size={60} />
                </div>
                <p className="text-xs font-light text-white opacity-90">
                  Tap to scan
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="relative z-10 flex justify-center gap-4 -mb-6">
              <button
                onClick={saveContact}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 shadow-md bg-white text-gray-800 hover:bg-gray-100"
              >
                <Download size={16} />
                <span>Save Contact</span>
              </button>
              <button
                onClick={shareContact}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 shadow-md bg-white text-gray-800 hover:bg-gray-100"
              >
                <Share2 size={16} />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* Social Media Section */}
          {Array.isArray(userInfo.socialLinks) && userInfo.socialLinks.length > 0 && (
            <div className="px-6 py-4 -mt-4 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Connect with me</h3>
                <div className="flex items-center gap-4">
                  {userInfo.socialLinks.map((linkObj, idx) => {
                    const { platform, url } = linkObj;
                    if (!platform || !url) return null;
                    return (
                      <a
                        key={idx}
                        href={getClickableLink(url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 group"
                        style={{ color: cardColor }}
                      >
                        {renderSocialIcon(platform)}
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Details Section */}
          <div className="px-6 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            {userInfo.email && (
              <div className="flex items-start gap-4 py-3">
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${cardColor}15`, color: cardColor }}
                >
                  <Mail size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Email</p>
                  <a
                    href={`mailto:${userInfo.email}`}
                    className="text-sm font-semibold text-gray-800 dark:text-gray-100 hover:underline"
                  >
                    {userInfo.email}
                  </a>
                </div>
              </div>
            )}

            {userInfo.mobile && (
              <div className="flex items-start gap-4 py-3">
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${cardColor}15`, color: cardColor }}
                >
                  <Phone size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Phone</p>
                  <a
                    href={`tel:${userInfo.mobile}`}
                    className="text-sm font-semibold text-gray-800 dark:text-gray-100 hover:underline"
                  >
                    {userInfo.mobile}
                  </a>
                </div>
              </div>
            )}

            {userInfo.website && (
              <div className="flex items-start gap-4 py-3">
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${cardColor}15`, color: cardColor }}
                >
                  <ExternalLink size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Website</p>
                  <a
                    href={getClickableLink(userInfo.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-gray-800 dark:text-gray-100 hover:underline"
                  >
                    {userInfo.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              </div>
            )}

            {userInfo.address && (
              <div className="flex items-start gap-4 py-3">
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${cardColor}15`, color: cardColor }}
                >
                  <MapPin size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Address</p>
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {userInfo.address.split('\n').map((line, index) => (
                      <div key={index}>{line}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* About Section */}
          {userInfo.about && (
            <div className="p-6 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center gap-2 mb-2 text-gray-700 dark:text-gray-200">
                <Building size={18} style={{ color: cardColor }} />
                <h3 className="text-sm font-semibold">
                  About {userInfo.businessName || `${userInfo.firstName} ${userInfo.lastName}` || "Me"}
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                {userInfo.about.split('\n').map((line, index) => (
                  <span key={index} className="block">{line}</span>
                ))}
              </p>
            </div>
          )}
        </div>

        {/* QR Modal */}
        {isQrModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-sm p-6 bg-gray-900 rounded-3xl shadow-2xl text-center text-white">
              <button
                onClick={toggleQrModal}
                className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
              >
                <X size={16} />
              </button>

              <div className="flex flex-col items-center justify-center gap-2 mb-4">
                <QrCode size={24} style={{ color: cardColor }} />
                <h3 className="text-xl font-bold">Scan to Save</h3>
              </div>

              <div className="flex justify-center my-6">
                <QRCodeComponent value={vCardString} size={250} className="rounded-xl p-4 bg-white" />
              </div>

              <button
                onClick={saveContact}
                className="w-full px-6 py-3 font-semibold text-white rounded-full transition-shadow hover:shadow-lg"
                style={{ backgroundColor: cardColor }}
              >
                Download .vcf File
              </button>

              <p className="mt-4 text-sm text-gray-300">
                Point your camera at the QR code to save contact automatically
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
