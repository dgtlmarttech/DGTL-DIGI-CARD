
import QRCode from 'react-qr-code';
import {
  BsTelephoneFill,
  BsGlobe,
  BsEnvelopeFill,
  BsGeoAltFill,
} from 'react-icons/bs';



/**
 * Props:
 * - userInfo: { imgUrl, businessName, website, firstName, lastName, mobile, email, address }
 */
export default function ContactCard5({ userInfo }) {
  if (!userInfo) return <div>No contact information provided.</div>;

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
  } = userInfo;

  const saveContact = () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${firstName} ${lastName}
TEL;TYPE=cell,voice:${mobile}
EMAIL:${email}
ORG:${businessName}
URL:${website}
ADR;TYPE=work:;;${address};;;
NOTE:${about}
END:VCARD`;
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${firstName}_${lastName}.vcf`;
    link.click();
  };

  const shareContact = async () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://my.dgtldigicard.com';
    const shareUrl = `${baseUrl}/${userInfo.customUID || userInfo.uid}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${firstName} ${lastName} - Digital Card`,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      } catch (error) {
        alert('Sharing not supported');
      }
    }
  };

  return (
    <div
      className="pt-2 d-flex justify-content-center align-items-center z-100"
      style={{
        backgroundImage: `url('/card-bg-5.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        height: '90vh',
      }}
    >
      <div className="px-4" style={{ maxWidth: '420px' }}>
        {/* Top Section: Image + QR+Buttons Side by Side */}
        <div className="d-flex justify-content-between align-items-start mb-3">
          {/* Left: Image + Name (60%) */}
          <div className=" text-center" style={{ width: '60%' }}>
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
            <h5 className="fw-bold text-dark mt-2 mb-0">{`${firstName} ${lastName}`}</h5>
            <p className="text-dark mb-0">{businessName}</p>
          </div>

          {/* Right: QR + Buttons (40%) */}
          <div className="text-center" style={{ width: '40%' }}>
            <div className="bg-white p-1 rounded shadow-sm mb-2">
              {website ? (
                <QRCode value={website} size={110} />
              ) : (
                <div className="text-danger small">No website</div>
              )}
            </div>
            <button onClick={saveContact} className="btn btn-dark btn-sm rounded-pill fw-semibold w-100 mb-2">
              Save Contact
            </button>
            <button onClick={shareContact} className="btn btn-outline-dark btn-sm rounded-pill fw-semibold w-100 mb-4">
              <i className="bi bi-share me-2 text-info fs-6"></i> Share
            </button>
          </div>
        </div>


        {/* Contact Details */}
        <div className="text-start mx-3" style={{ maxWidth: '400px' }}>
          {/* Phone */}
          <div className="d-flex align-items-center mb-2">
            <BsTelephoneFill className="text-info fs-5" style={{ width: '30px' }} />
            <span className="ms-2">{mobile}</span>
          </div>

          {/* Website */}
          <div className="d-flex align-items-center mb-2">
            <BsGlobe className="text-info fs-5" style={{ width: '30px' }} />
            <a href={website} target="_blank" rel="noopener noreferrer" className="text-decoration-none ms-2">
              {website}
            </a>
          </div>

          {/* Email */}
          <div className="d-flex align-items-center mb-2">
            <BsEnvelopeFill className="text-info fs-5" style={{ width: '30px' }} />
            <span className="ms-2">{email}</span>
          </div>

          {/* Address */}
          <div className="d-flex align-items-center">
            <BsGeoAltFill className="text-info fs-5" style={{ width: '30px' }} />
            <span className="ms-2">{address}</span>
          </div>
        </div>

        {/* About Us  */}
        {about && (
          <div className=" bg-white rounded shadow-sm mx-3 p-2 mt-2">
            <h6 className="fw-bold mb-2" style={{ color: '#172333' }}>About Us</h6>
            <p className="mb-0 text-secondary" style={{ fontSize: '0.95rem' }}>{about}</p>
          </div>
        )}


      </div>
    </div>
  );
}
