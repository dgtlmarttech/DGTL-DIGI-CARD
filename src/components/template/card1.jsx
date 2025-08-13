import { useEffect, useMemo } from 'react';
import QRCode from 'react-qr-code';

/**
 * Props:
 * - userInfo: { imgUrl, businessName, website, firstName, lastName, mobile, email, address, about, isPremium }
 */
export default function ContactCard({ userInfo }) {

  // 🧠 Move this function to the top
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

  // 🎯 Set page title
  useEffect(() => {
    const title = userInfo.firstName
      ? `${userInfo.firstName} ${userInfo.lastName || ''} - Digital Card`
      : 'Digital Business Card';
    document.title = title;
  }, [userInfo]);

  // 🗂️ vCard blob for download
  const vcardUrl = useMemo(() => {
    const vcardData = generateVCardData(userInfo);
    const blob = new Blob([vcardData], { type: 'text/vcard' });
    return URL.createObjectURL(blob);
  }, [userInfo]);

  // 🧾 Destructure data
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

  // 💾 Save contact to file
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

    // Generate clickable website link
  const getClickableLink = (link) => {
    if (!link) return "";
    return link.startsWith("http://") || link.startsWith("https://")
      ? link
      : `http://${link}`;
  };

  // 🔗 Share contact or copy vCard
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

    const renderSocialIcon = (platform) => {
    switch (platform) {
      case "YouTube":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 461.001 461.001"
            fill="#000000"
            style={{ width: "20px", height: "20px" }}
          >
            <g>
              <path
                fill="#F61C0D"
                d="M365.257,67.393H95.744C42.866,67.393,0,110.259,0,163.137v134.728
                  c0,52.878,42.866,95.744,95.744,95.744h269.513c52.878,0,95.744-42.866,95.744-95.744V163.137
                  C461.001,110.259,418.135,67.393,365.257,67.393z M300.506,237.056l-126.06,60.123
                  c-3.359,1.602-7.239-0.847-7.239-4.568V168.607c0-3.774,3.982-6.22,7.348-4.514l126.06,63.881
                  C304.363,229.873,304.298,235.248,300.506,237.056z"
              />
            </g>
          </svg>
        );

      case "Twitter":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="7.025 7.025 497.951 497.951"
            fill="url(#twitterGradient)"
            style={{ width: "20px", height: "20px" }}
          >
            <defs>
              <linearGradient
                id="twitterGradient"
                gradientUnits="userSpaceOnUse"
                x1="-974.482"
                y1="1306.773"
                x2="-622.378"
                y2="1658.877"
                gradientTransform="translate(1054.43 -1226.825)"
              >
                <stop offset="0" stopColor="#2489be" />
                <stop offset="1" stopColor="#0575b3" />
              </linearGradient>
            </defs>
            <path d="M256 7.025C118.494 7.025 7.025 118.494 7.025 256S118.494 504.975 256 504.975
                     504.976 393.506 504.976 256C504.975 118.494 393.504 7.025 256 7.025
                     zm-66.427 369.343h-54.665V199.761h54.665v176.607
                     zM161.98 176.633c-17.853 0-32.326-14.591-32.326-32.587
                     0-17.998 14.475-32.588 32.326-32.588s32.324 14.59 32.324 32.588
                     c.001 17.997-14.472 32.587-32.324 32.587
                     z m232.45 199.735h-54.4v-92.704
                     c0-25.426-9.658-39.619-29.763-39.619
                     -21.881 0-33.312 14.782-33.312 39.619v92.704h-52.43
                     V199.761h52.43v23.786
                     s15.771-29.173 53.219-29.173
                     c37.449 0 64.257 22.866 64.257 70.169
                     l-.001 111.825z"
            />
          </svg>
        );

      case "Instagram":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 551.034 551.034"
            fill="url(#instaGradient)"
            style={{ width: "20px", height: "20px" }}
          >
            <defs>
              <linearGradient
                id="instaGradient"
                gradientUnits="userSpaceOnUse"
                x1="275.517"
                y1="4.5714"
                x2="275.517"
                y2="549.7202"
                gradientTransform="matrix(1 0 0 -1 0 554)"
              >
                <stop offset="0" stopColor="#E09B3D" />
                <stop offset="0.3" stopColor="#C74C4D" />
                <stop offset="0.6" stopColor="#C21975" />
                <stop offset="1" stopColor="#7024C4" />
              </linearGradient>
            </defs>
            <path
              d="M386.878,0H164.156C73.64,0,0,73.64,0,164.156v222.722
                c0,90.516,73.64,164.156,164.156,164.156h222.722
                c90.516,0,164.156-73.64,164.156-164.156V164.156
                C551.033,73.64,477.393,0,386.878,0z M495.6,386.878
                c0,60.045-48.677,108.722-108.722,108.722H164.156
                c-60.045,0-108.722-48.677-108.722-108.722V164.156
                c0-60.046,48.677-108.722,108.722-108.722h222.722
                c60.045,0,108.722,48.676,108.722,108.722
                L495.6,386.878L495.6,386.878z"
            />
            <path
              d="M275.517,133C196.933,133,133,196.933,133,275.516
                s63.933,142.517,142.517,142.517S418.034,354.1,418.034,275.516
                S354.101,133,275.517,133z M275.517,362.6
                c-48.095,0-87.083-38.988-87.083-87.083
                s38.989-87.083,87.083-87.083
                c48.095,0,87.083,38.988,87.083,87.083
                C362.6,323.611,323.611,362.6,275.517,362.6z"
            />
            <circle
              cx="418.306"
              cy="134.072"
              r="34.149"
              fill="url(#instaGradient)"
            />
          </svg>
        );

      case "LinkedIn":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="7.025 7.025 497.951 497.951"
            fill="url(#linkedinGradient)"
            style={{ width: "20px", height: "20px" }}
          >
            <defs>
              <linearGradient
                id="linkedinGradient"
                gradientUnits="userSpaceOnUse"
                x1="-974.482"
                y1="1306.773"
                x2="-622.378"
                y2="1658.877"
                gradientTransform="translate(1054.43 -1226.825)"
              >
                <stop offset="0" stopColor="#2489be" />
                <stop offset="1" stopColor="#0575b3" />
              </linearGradient>
            </defs>
            <path d="M256 7.025C118.494 7.025 7.025 118.494 7.025 256S118.494 504.975
                     256 504.975 504.976 393.506 504.976 256
                     C504.975 118.494 393.504 7.025 256 7.025
                     zm-66.427 369.343h-54.665V199.761h54.665v176.607
                     zM161.98 176.633c-17.853 0-32.326-14.591-32.326-32.587
                     0-17.998 14.475-32.588 32.326-32.588
                     s32.324 14.59 32.324 32.588
                     c.001 17.997-14.472 32.587-32.324 32.587
                     z m232.45 199.735h-54.4v-92.704
                     c0-25.426-9.658-39.619-29.763-39.619
                     -21.881 0-33.312 14.782-33.312 39.619v92.704
                     h-52.43V199.761h52.43v23.786
                     s15.771-29.173 53.219-29.173
                     c37.449 0 64.257 22.866 64.257 70.169
                     l-.001 111.825z"
            />
          </svg>
        );

      case "Facebook":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 408.788 408.788"
            fill="#13a7f1"
            style={{ width: "20px", height: "20px" }}
          >
            <path d="M353.701,0H55.087C24.665,0,0.002,24.662,0.002,55.085v298.616
                     c0,30.423,24.662,55.085,55.085,55.085h147.275l0.251-146.078
                     h-37.951c-4.932,0-8.935-3.988-8.954-8.92l-0.182-47.087
                     c-0.019-4.959,3.996-8.989,8.955-8.989h37.882
                     v-45.498c0-52.8,32.247-81.55,79.348-81.55h38.65
                     c4.945,0,8.955,4.009,8.955,8.955v39.704
                     c0,4.944-4.007,8.952-8.95,8.955l-23.719,0.011
                     c-25.615,0-30.575,12.172-30.575,30.035v39.389h56.285
                     c5.363,0,9.524,4.683,8.892,10.009l-5.581,47.087
                     c-0.534,4.506-4.355,7.901-8.892,7.901h-50.453l-0.251,146.078
                     h87.631c30.422,0,55.084-24.662,55.084-55.084V55.085
                     C408.786,24.662,384.124,0,353.701,0z" />
          </svg>
        );

      default:
        // Fallback: simple globe icon
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 496 496"
            fill="#333333"
            style={{ width: "20px", height: "20px" }}
          >
            <path d="M248 0C111.033 0 0 111.033 0 248s111.033 248 248 248
                     248-111.033 248-248S384.967 0 248 0zM416 248c0 37.87-10.13 73.331
                     -27.547 103.594L182.406 142.547C212.669 125.13 248.13 115 286 115
                     358.837 115 416 172.163 416 248zM210 142.547L103.406 249.141C86.13
                     218.838 76 182.463 76 143.6 76 64.103 143.103-3 222.6-3 261.463-3
                     297.838 7.13 328.141 24.406L210 142.547z" />
          </svg>
        );
    }
  };

  return (
    <div
      className="pt-2 d-flex justify-content-center "
      style={{
        backgroundImage: 'url("/card1-1.png"), url("/card1-2.png")',
        backgroundRepeat: 'no-repeat, no-repeat',
        backgroundSize: 'cover, contain',
        backgroundColor: 'white',
        backgroundPosition: 'center top, center bottom',

        width: '100%',
        maxWidth: '380px',
        height: 'calc(var(--vh) * 100)',
        aspectRatio: '9 / 16',
      }}
    >
      <div className="px-4 w-100" style={{ marginTop: '20%' }}>
        {/* Top: Profile + QR + Buttons */}
        <div className="d-flex justify-content-between align-items-start mb-3">
          {/* Left: Image & Name */}
          <div className="text-center" style={{ width: '60%' }}>
            <img
              src={imgUrl}
              alt={firstName}
              style={{
                width: '140px',
                height: '140px',
                objectFit: 'cover',
                border: '3px solid #006a85',
                borderRadius: '15%',
              }}
            />
            <h5 className="fw-bold text-dark mt-2 mb-0">
              {`${firstName} ${lastName}`}
            </h5>
            <p className="text-dark mb-0">{businessName}</p>
          </div>

          {/* Right: QR Code + Buttons */}
          <div className="text-center" style={{ width: '40%' }}>
            <a href={vcardUrl} download={`${firstName}_${lastName}.vcf`}>
              <div className="bg-white p-1 rounded shadow-sm mb-2">
                <QRCode value={generateVCardData(userInfo)} size={110} />
              </div>
            </a>
            <button
              className="btn btn-dark btn-sm rounded-pill fw-semibold w-100 mb-2"
              onClick={saveContact}
            >
              Save Contact
            </button>
            <button
              className="btn btn-outline-dark btn-sm rounded-pill fw-semibold w-100 mb-4"
              onClick={shareContact}
            >
              <i className="bi bi-share me-2 text-info fs-6"></i> Share
            </button>
          </div>
        </div>

        {/* Contact Details */}
        <div className="text-start mx-3" style={{ maxWidth: '400px' }}>
          <div className="d-flex align-items-center mb-2">
            <img
              src="https://cdn-icons-png.flaticon.com/512/724/724664.png"
              alt="Phone"
              style={{ width: '20px', height: '20px' }}
            />
            <a
              href={`tel:${mobile}`}
              className="ms-3 text-decoration-none"
              style={{ color: '#1187ac' }}
            >
              {mobile}
            </a>
          </div>

          <div className="d-flex align-items-center mb-2">
            <img
              src="https://cdn-icons-png.flaticon.com/512/3059/3059997.png"
              alt="Website"
              style={{ width: '20px', height: '20px' }}
            />
            <a
              href={getClickableLink(website)}
              target="_blank"
              rel="noopener noreferrer"
              className="ms-3 text-decoration-none"
              style={{ color: '#1187ac' }}
            >
              {website}
            </a>
          </div>

          <div className="d-flex align-items-center mb-2">
            <img
              src="https://cdn-icons-png.flaticon.com/512/5968/5968534.png"
              alt="Email"
              style={{ width: '20px', height: '20px' }}
            />
            <a
              href={`mailto:${email}`}
              className="ms-3 text-decoration-none"
              style={{ color: '#1187ac' }}
            >
              {email}
            </a>
          </div>

          <div className="d-flex align-items-center">
            <img
              src="https://cdn-icons-png.flaticon.com/512/2991/2991231.png"
              alt="Address"
              style={{ width: '20px', height: '20px' }}
            />
              <a
                href={`http://maps.google.com/?q=${address}`}
                target="_blank"
                rel="noreferrer"
                className="ms-3 text-decoration-none"
                style={{ color: '#1187ac' }}
              >
                {address}
              </a>
          </div>
        </div>

        {/* ── NEW: Social Media Links ── */}
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
                        e.currentTarget.style.backgroundColor = "#1187ac";
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow =
                          "0 4px 12px rgba(0, 0, 0, 0.15)";
                        // Change inner SVG fill to white
                        const svg = e.currentTarget.querySelector("svg");
                        if (svg) svg.style.fill = "#ffffff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "white";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow =
                          "0 2px 5px rgba(0, 0, 0, 0.1)";
                        // Revert inner SVG fill
                        const svg = e.currentTarget.querySelector("svg");
                        if (svg) {
                          // Restore original fills per platform:
                          switch (platform) {
                            case "YouTube":
                              svg.style.fill = "none"; // maintain red path
                              break;
                            case "Twitter":
                              svg.style.fill = "url(#twitterGradient)";
                              break;
                            case "Instagram":
                              svg.style.fill = "url(#instaGradient)";
                              break;
                            case "LinkedIn":
                              svg.style.fill = "url(#linkedinGradient)";
                              break;
                            case "Facebook":
                              svg.style.fill = "#13a7f1";
                              break;
                            default:
                              svg.style.fill = "#333333";
                          }
                        }
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
        

        {/* About Section */}
        {about && (
          <div
          className="bg-white rounded mx-3 p-2 mt-3"
          style={{
          boxShadow: '0 -4px 6px -2px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0,0,0,0.1)', // Top + subtle bottom
          }}
          >
            <h6 className="fw-bold mb-2" style={{ color: '#172333' }}>
              About
            </h6>
            <p className="mb-0 text-secondary" style={{ fontSize: '0.95rem' }}>
              {about}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
