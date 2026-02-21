'use client';
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { User, Phone, Mail, MapPin, Share2, Download, ExternalLink, QrCode, X, Instagram, Linkedin, Youtube, Twitter, Facebook, Link, MoreHorizontal } from "lucide-react";
import QRCode from "react-qr-code";

const ContactCard3 = ({ userInfo }) => {
  const cardColor = userInfo?.cardColor || "#8b5cf6";
  const [activeCard, setActiveCard] = useState(0);

  const getClickableLink = useCallback((link) => {
    if (!link) return "";
    return link.startsWith("http://") || link.startsWith("https://") ? link : `https://${link}`;
  }, []);

  const vCardString = useMemo(() => {
    const { firstName = "", lastName = "", mobile = "", email = "", businessName = "", website = "", address = "", about = "" } = userInfo || {};
    let formattedMobile = mobile && !mobile.startsWith("+") ? `+91${mobile}` : mobile;
<<<<<<< HEAD

=======
    
>>>>>>> 3dfb2372ed1a1b4b12acbb8db30cfbc0b83fef2d
    return [
      "BEGIN:VCARD", "VERSION:3.0",
      firstName || lastName ? `FN:${firstName} ${lastName}` : null,
      businessName ? `ORG:${businessName}` : null,
      formattedMobile ? `TEL;TYPE=CELL:${formattedMobile}` : null,
      email ? `EMAIL:${email}` : null,
      website ? `URL:${getClickableLink(website)}` : null,
      address ? `ADR;TYPE=WORK:;;${address.replace(/\n/g, '\\n')};;;` : null,
      about ? `NOTE:${about.replace(/\n/g, '\\n')}` : null,
      "END:VCARD"
    ].filter(Boolean).join("\r\n");
  }, [userInfo, getClickableLink]);

<<<<<<< HEAD
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
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

=======
>>>>>>> 3dfb2372ed1a1b4b12acbb8db30cfbc0b83fef2d
  const saveContact = () => {
    const filename = `${userInfo?.firstName || 'contact'}_${userInfo?.lastName || ''}.vcf`;
    const blob = new Blob([vCardString], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  if (!userInfo) return null;

  const cards = [
<<<<<<< HEAD
    { id: 'profile', title: 'Profile', icon: <User size={16} /> },
    { id: 'contact', title: 'Contact', icon: <Phone size={16} /> },
    { id: 'qr', title: 'QR Code', icon: <QrCode size={16} /> }
  ];

  const renderSocialIcon = (platform) => {
    const icons = { Instagram: <Instagram size={16} />, YouTube: <Youtube size={16} />, LinkedIn: <Linkedin size={16} />, Twitter: <Twitter size={16} />, Facebook: <Facebook size={16} /> };
    return icons[platform] || <Link size={16} />;
=======
    { id: 'profile', title: 'Profile', icon: <User size={16}/> },
    { id: 'contact', title: 'Contact', icon: <Phone size={16}/> },
    { id: 'qr', title: 'QR Code', icon: <QrCode size={16}/> }
  ];

  const renderSocialIcon = (platform) => {
    const icons = { Instagram: <Instagram size={16}/>, YouTube: <Youtube size={16}/>, LinkedIn: <Linkedin size={16}/>, Twitter: <Twitter size={16}/>, Facebook: <Facebook size={16}/> };
    return icons[platform] || <Link size={16}/>;
>>>>>>> 3dfb2372ed1a1b4b12acbb8db30cfbc0b83fef2d
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center p-3">
      <div className="w-full max-w-sm">
<<<<<<< HEAD

=======
        
>>>>>>> 3dfb2372ed1a1b4b12acbb8db30cfbc0b83fef2d
        {/* Tab Navigation */}
        <div className="flex bg-white rounded-t-2xl p-1 shadow-sm mb-0">
          {cards.map((card, idx) => (
            <button key={card.id} onClick={() => setActiveCard(idx)}
<<<<<<< HEAD
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-medium transition-all
=======
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-medium transition-all
>>>>>>> 3dfb2372ed1a1b4b12acbb8db30cfbc0b83fef2d
                    ${activeCard === idx ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}>
              {card.icon} {card.title}
            </button>
          ))}
        </div>

        {/* Card Stack */}
        <div className="relative bg-white rounded-b-2xl rounded-t-none shadow-lg overflow-hidden">
<<<<<<< HEAD

=======
          
>>>>>>> 3dfb2372ed1a1b4b12acbb8db30cfbc0b83fef2d
          {/* Profile Card */}
          {activeCard === 0 && (
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 mx-auto mb-4 rounded-3xl overflow-hidden border-4 border-purple-100">
<<<<<<< HEAD
                  {userInfo.imgUrl ? <img src={userInfo.imgUrl} alt={userInfo.firstName} className="w-full h-full object-cover" /> :
                    <div className="w-full h-full flex items-center justify-center bg-purple-50"><User size={32} className="text-purple-400" /></div>}
=======
                  {userInfo.imgUrl ? <img src={userInfo.imgUrl} alt={userInfo.firstName} className="w-full h-full object-cover"/> : 
                  <div className="w-full h-full flex items-center justify-center bg-purple-50"><User size={32} className="text-purple-400"/></div>}
>>>>>>> 3dfb2372ed1a1b4b12acbb8db30cfbc0b83fef2d
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{userInfo.firstName} {userInfo.lastName}</h1>
                {userInfo.businessName && <p className="text-purple-600 font-medium mb-2">{userInfo.businessName}</p>}
                {userInfo.title && <p className="text-gray-500 text-sm">{userInfo.title}</p>}
              </div>
<<<<<<< HEAD

              <div className="space-y-3">
                <button onClick={saveContact}
                  className="flex-1 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition-colors flex items-center justify-center gap-2">
                  <Download size={18} /> Save
                </button>
                <button onClick={shareContact}
                  className="flex-1 py-3 bg-white border-2 border-purple-200 text-purple-600 rounded-xl font-medium hover:bg-purple-50 transition-colors flex items-center justify-center gap-2">
                  <Share2 size={18} /> Share
                </button>

=======
              
              <div className="space-y-3">
                <button onClick={saveContact} 
                        className="w-full py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition-colors flex items-center justify-center gap-2">
                  <Download size={18}/> Save to Contacts
                </button>
                
>>>>>>> 3dfb2372ed1a1b4b12acbb8db30cfbc0b83fef2d
                {userInfo.socialLinks?.length > 0 && (
                  <div className="flex justify-center gap-3 pt-2">
                    {userInfo.socialLinks.map((link, idx) => (
                      <a key={idx} href={getClickableLink(link.url)} target="_blank"
<<<<<<< HEAD
                        className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors text-purple-500">
=======
                         className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors text-purple-500">
>>>>>>> 3dfb2372ed1a1b4b12acbb8db30cfbc0b83fef2d
                        {renderSocialIcon(link.platform)}
                      </a>
                    ))}
                  </div>
                )}
              </div>
<<<<<<< HEAD

=======
              
>>>>>>> 3dfb2372ed1a1b4b12acbb8db30cfbc0b83fef2d
              {userInfo.about && (
                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-medium text-gray-700 mb-2">About</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{userInfo.about}</p>
                </div>
              )}
            </div>
          )}

          {/* Contact Card */}
          {activeCard === 1 && (
            <div className="p-4 space-y-3">
              {userInfo.email && (
                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
<<<<<<< HEAD
                    <Mail size={20} className="text-blue-600" />
=======
                    <Mail size={20} className="text-blue-600"/>
>>>>>>> 3dfb2372ed1a1b4b12acbb8db30cfbc0b83fef2d
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{userInfo.email}</p>
                    <p className="text-sm text-gray-500">Email Address</p>
                  </div>
                  <a href={`mailto:${userInfo.email}`} className="p-2 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors">
<<<<<<< HEAD
                    <ExternalLink size={16} className="text-blue-600" />
                  </a>
                </div>
              )}

              {userInfo.mobile && (
                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Phone size={20} className="text-green-600" />
=======
                    <ExternalLink size={16} className="text-blue-600"/>
                  </a>
                </div>
              )}
              
              {userInfo.mobile && (
                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Phone size={20} className="text-green-600"/>
>>>>>>> 3dfb2372ed1a1b4b12acbb8db30cfbc0b83fef2d
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{userInfo.mobile}</p>
                    <p className="text-sm text-gray-500">Phone Number</p>
                  </div>
                  <a href={`tel:${userInfo.mobile}`} className="p-2 bg-green-100 rounded-lg hover:bg-green-200 transition-colors">
<<<<<<< HEAD
                    <ExternalLink size={16} className="text-green-600" />
                  </a>
                </div>
              )}

              {userInfo.website && (
                <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <ExternalLink size={20} className="text-purple-600" />
=======
                    <ExternalLink size={16} className="text-green-600"/>
                  </a>
                </div>
              )}
              
              {userInfo.website && (
                <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <ExternalLink size={20} className="text-purple-600"/>
>>>>>>> 3dfb2372ed1a1b4b12acbb8db30cfbc0b83fef2d
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{userInfo.website}</p>
                    <p className="text-sm text-gray-500">Website</p>
                  </div>
                  <a href={getClickableLink(userInfo.website)} target="_blank" className="p-2 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors">
<<<<<<< HEAD
                    <ExternalLink size={16} className="text-purple-600" />
=======
                    <ExternalLink size={16} className="text-purple-600"/>
>>>>>>> 3dfb2372ed1a1b4b12acbb8db30cfbc0b83fef2d
                  </a>
                </div>
              )}

              {userInfo.address && (
                <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-xl">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
<<<<<<< HEAD
                    <MapPin size={20} className="text-orange-600" />
=======
                    <MapPin size={20} className="text-orange-600"/>
>>>>>>> 3dfb2372ed1a1b4b12acbb8db30cfbc0b83fef2d
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{userInfo.address}</p>
                    <p className="text-sm text-gray-500">Address</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* QR Card */}
          {activeCard === 2 && (
            <div className="p-6 text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Scan to Connect</h3>
              <p className="text-sm text-gray-500 mb-6">Point your camera at the QR code to save my contact</p>
<<<<<<< HEAD

              <div className="inline-block p-4 bg-gray-50 rounded-2xl mb-6">
                <QRCode value={vCardString} size={160} />
              </div>

              <button onClick={saveContact}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                <Download size={18} /> Download vCard
=======
              
              <div className="inline-block p-4 bg-gray-50 rounded-2xl mb-6">
                <QRCode value={vCardString} size={160}/>
              </div>
              
              <button onClick={saveContact}
                      className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                <Download size={18}/> Download vCard
>>>>>>> 3dfb2372ed1a1b4b12acbb8db30cfbc0b83fef2d
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactCard3;
