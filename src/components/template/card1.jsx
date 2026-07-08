'use client';
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
  Link,
  Sparkles
} from "lucide-react";
import QRCode from "react-qr-code";

const ContactCard = ({ userInfo }) => {
  const cardColor = userInfo?.cardColor || "#8b5cf6";
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const getClickableLink = useCallback((link) => {
    if (!link) return "";
    return link.startsWith("http://") || link.startsWith("https://")
      ? link
      : `https://${link}`;
  }, []);

  useEffect(() => {
    let title = "Digital Business Card";
    if (userInfo?.firstName) {
      title = `${userInfo.firstName} ${userInfo.lastName || ""} - Digital Card`;
    }
    document.title = title;
  }, [userInfo]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

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
    } = userInfo || {};

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

    return lines.join("\r\n");
  }, [userInfo, getClickableLink]);

  const saveContact = async () => {
    const filename = `${(userInfo?.firstName || 'contact')}_${(userInfo?.lastName || '')}`
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
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://my.dgtldigicard.com';
    const shareUrl = `${baseUrl}/${userInfo?.customUID || userInfo?.uid || ''}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: document.title,
          text: `Contact: ${document.title}`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(vCardString);
        console.log('Contact copied to clipboard!');
      }
    } catch (err) {
      console.error('Share failed:', err);
      saveContact();
    }
  };

  const renderSocialIcon = (platform) => {
    const iconProps = { size: 20 };
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

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <p>No user information provided</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 font-sans antialiased relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-50">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
        </div>
      </div>

      <div
        className="w-full max-w-sm mx-auto relative"
        onMouseMove={handleMouseMove}
      >
        {/* Glassmorphism Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl overflow-hidden relative">
          {/* Glow Effect */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, ${cardColor}40 0%, transparent 50%)`,
            }}
          />

          {/* Header Section */}
          <div className="relative p-8 text-white">
            <div className="flex items-center justify-between gap-4 mb-6">
              {/* Profile */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/30 backdrop-blur-sm">
                    {userInfo.imgUrl ? (
                      <img
                        src={userInfo.imgUrl}
                        alt={`${userInfo.firstName} ${userInfo.lastName}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/20">
                        <User size={32} className="text-white/80" />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                    <Sparkles size={12} className="text-white" />
                  </div>
                </div>

                <div>
                  {userInfo.businessName && (
                    <p className="text-xs font-medium text-white/60 uppercase tracking-wider mb-1">
                      {userInfo.businessName}
                    </p>
                  )}
                  <h2 className="text-xl font-bold text-white leading-tight">
                    {userInfo.firstName} {userInfo.lastName}
                  </h2>
                  {userInfo.title && (
                    <p className="text-sm text-white/80 mt-1">
                      {userInfo.title}
                    </p>
                  )}
                </div>
              </div>

              {/* QR Code */}
              <div
                className="cursor-pointer transition-all duration-300 hover:scale-105"
                onClick={() => setIsQrModalOpen(true)}
              >
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                  <QrCode size={24} className="text-white" />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={saveContact}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl text-white font-medium transition-all duration-300 hover:bg-white/30"
              >
                <Download size={16} />
                <span>Save</span>
              </button>
              <button
                onClick={shareContact}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl text-white font-medium transition-all duration-300 hover:bg-white/30"
              >
                <Share2 size={16} />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* Contact Details */}
          <div className="p-6 space-y-4">
            {userInfo.email && (
              <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <Mail size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-white/60 uppercase tracking-wider">Email</p>
                  <a
                    href={`mailto:${userInfo.email}`}
                    className="text-white font-medium hover:text-blue-300 transition-colors"
                  >
                    {userInfo.email}
                  </a>
                </div>
              </div>
            )}

            {userInfo.mobile && (
              <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                  <Phone size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-white/60 uppercase tracking-wider">Phone</p>
                  <a
                    href={`tel:${userInfo.mobile}`}
                    className="text-white font-medium hover:text-green-300 transition-colors"
                  >
                    {userInfo.mobile}
                  </a>
                </div>
              </div>
            )}

            {userInfo.website && (
              <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                  <ExternalLink size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-white/60 uppercase tracking-wider">Website</p>
                  <a
                    href={getClickableLink(userInfo.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white font-medium hover:text-purple-300 transition-colors"
                  >
                    {userInfo.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              </div>
            )}

            {userInfo.address && (
              <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                  <MapPin size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-white/60 uppercase tracking-wider">Address</p>
                  <a 
                    href={`https://maps.google.com/?q=${encodeURIComponent(userInfo.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white font-medium hover:text-orange-300 transition-colors block"
                  >
                    {userInfo.address.split('\n').map((line, index) => (
                      <div key={index}>{line}</div>
                    ))}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Social Media */}
          {Array.isArray(userInfo.socialLinks) && userInfo.socialLinks.length > 0 && (
            <div className="p-6 pt-0">
              <div className="p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Building size={16} />
                  Connect With Me
                </h3>
                <div className="flex gap-3">
                  {userInfo.socialLinks.map((linkObj, idx) => {
                    const { platform, url } = linkObj;
                    if (!platform || !url) return null;
                    return (
                      <a
                        key={idx}
                        href={getClickableLink(url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 hover:scale-110"
                      >
                        {renderSocialIcon(platform)}
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* About Section */}
          {userInfo.about && (
            <div className="p-6 pt-0">
              <div className="p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <Sparkles size={16} />
                  About
                </h3>
                <p className="text-white/80 text-sm leading-relaxed">
                  {userInfo.about.split('\n').map((line, index) => (
                    <span key={index} className="block mb-1">{line}</span>
                  ))}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QR Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm p-6 bg-gray-900/90 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl text-center text-white">
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center gap-4 mb-6">
              <QrCode size={32} style={{ color: cardColor }} />
              <h3 className="text-2xl font-bold">Scan to Connect</h3>
            </div>

            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white rounded-2xl">
                <QRCode
                  value={vCardString}
                  size={220}
                  style={{ display: 'block' }}
                />
              </div>
            </div>

            <button
              onClick={saveContact}
              className="w-full px-6 py-3 font-semibold text-white rounded-2xl transition-all duration-300 hover:scale-105"
              style={{ backgroundColor: cardColor }}
            >
              Download vCard
            </button>

            <p className="mt-4 text-sm text-gray-300">
              Scan with your camera to save contact instantly
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactCard;
