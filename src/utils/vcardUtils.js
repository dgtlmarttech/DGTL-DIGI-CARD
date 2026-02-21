// src/utils/vcardUtils.js

/**
 * Parses a vCard string and extracts common contact details.
 * @param {string} vcardString The raw vCard string.
 * @returns {object} An object containing parsed contact details.
 */
export const parseVCard = (vcardString) => {
  let name = '';
  let company = '';
  let title = '';
  let email = '';
  let phone = '';
  const notesLines = [];

  if (vcardString && vcardString.startsWith('BEGIN:VCARD')) {
    const lines = vcardString.split('\n');
    lines.forEach(line => {
      if (line.startsWith('FN:')) { // Formatted Name
        name = line.substring(3).trim();
      } else if (line.startsWith('ORG:')) { // Organization (Company)
        company = line.substring(4).trim();
      } else if (line.startsWith('TITLE:')) { // Title
        title = line.substring(6).trim();
      } else if (line.startsWith('EMAIL;TYPE=INTERNET:')) { // Email
        email = line.substring('EMAIL;TYPE=INTERNET:'.length).trim();
      } else if (line.startsWith('EMAIL:')) { // Fallback for simpler EMAIL
        email = line.substring(6).trim();
      } else if (line.startsWith('TEL;TYPE=CELL:')) { // Mobile Phone
        phone = line.substring('TEL;TYPE=CELL:'.length).trim();
      } else if (line.startsWith('TEL:')) { // General Phone
        phone = line.substring(4).trim();
      } else if (line.startsWith('NOTE:')) { // Notes
        notesLines.push(line.substring(5).trim());
      }
      // You can add more vCard properties here as needed (e.g., ADR for address, URL for website)
    });
  }
  return { name, company, title, email, phone, notes: notesLines.join('\n') };
};

/**
 * Generates a vCard 3.0 string from provided user information.
 * This function is generic and can be used to create vCards from any contact data.
 * @param {object} userInfo - Object containing contact details.
 * @param {string} [userInfo.name=""] - Full name.
 * @param {string} [userInfo.company=""] - Company name.
 * @param {string} [userInfo.title=""] - Job title.
 * @param {string} [userInfo.email=""] - Email address.
 * @param {string} [userInfo.phone=""] - Phone number.
 * @param {string} [userInfo.notes=""] - Notes/About.
 * @returns {string} The generated vCard string.
 */
export const generateVCardString = ({
  name = "",
  company = "",
  title = "",
  email = "",
  phone = "",
  notes = "",
}) => {
  let vCard = 'BEGIN:VCARD\nVERSION:3.0\n';

  if (name) {
    vCard += `FN:${name}\n`; // Formatted Name
    // Attempt to split name into first/last for N property, or use full name if simple
    const nameParts = name.split(' ');
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
    const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : name;
    vCard += `N:${lastName};${firstName};;;\n`; // Name structure: last;first;middle;prefix;suffix
  }
  if (company) vCard += `ORG:${company}\n`;
  if (title) vCard += `TITLE:${title}\n`;
  if (phone) vCard += `TEL;TYPE=CELL:${phone}\n`; // Assuming mobile for simplicity
  if (email) vCard += `EMAIL;TYPE=INTERNET:${email}\n`;
  if (notes) vCard += `NOTE:${notes}\n`;

  vCard += 'END:VCARD';
  return vCard;
};


/**
 * Exports one or more contacts to a VCF file.
 * @param {Array<object>} contactsToExport An array of contact objects to export.
 * @param {string} filename The desired filename for the VCF file (e.g., "my_contacts.vcf").
 */
export const exportContactsToVCF = (contactsToExport, filename = 'contacts.vcf') => {
  if (!contactsToExport || contactsToExport.length === 0) {
    console.warn("No contacts provided for VCF export.");
    return;
  }

  const vcfContentArray = contactsToExport.map(contact => generateVCardString({
    name: contact.name,
    company: contact.company,
    title: contact.title,
    email: contact.email,
    phone: contact.phone,
    notes: contact.notes,
  }));

  const fullVcfContent = vcfContentArray.join('\n'); // Join multiple vCards with a newline

  const blob = new Blob([fullVcfContent], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url); // Clean up the URL object
};
