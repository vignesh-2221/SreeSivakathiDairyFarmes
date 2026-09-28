const MOBILE_RE = /^[6-9]\d{9}$/;
const PINCODE_RE = /^[1-9]\d{5}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isBlank(v) {
  return v === undefined || v === null || String(v).trim() === '';
}

/**
 * Validates a registration payload. Returns { errors } where errors is a
 * map of fieldName -> message (empty object means the payload is valid).
 * Runs server-side regardless of what the browser already checked.
 */
function validateRegistration(body) {
  const errors = {};
  const v = {
    fullName: String(body.fullName || '').trim(),
    mobileNumber: String(body.mobileNumber || '').trim(),
    whatsappNumber: String(body.whatsappNumber || '').trim(),
    email: String(body.email || '').trim(),
    houseNumber: String(body.houseNumber || '').trim(),
    street: String(body.street || '').trim(),
    area: String(body.area || '').trim(),
    city: String(body.city || '').trim(),
    pincode: String(body.pincode || '').trim(),
    deliveryPreference: String(body.deliveryPreference || '').trim(),
    dailyQuantity: body.dailyQuantity,
    password: String(body.password || ''),
    confirmPassword: String(body.confirmPassword || ''),
  };

  if (isBlank(v.fullName) || v.fullName.length < 2) {
    errors.fullName = 'Enter the customer’s full name.';
  }

  if (isBlank(v.mobileNumber)) {
    errors.mobileNumber = 'Mobile number is required.';
  } else if (!MOBILE_RE.test(v.mobileNumber)) {
    errors.mobileNumber = 'Enter a valid 10-digit mobile number.';
  }

  if (!isBlank(v.whatsappNumber) && !MOBILE_RE.test(v.whatsappNumber)) {
    errors.whatsappNumber = 'Enter a valid 10-digit WhatsApp number, or leave it blank.';
  }

  if (!isBlank(v.email) && !EMAIL_RE.test(v.email)) {
    errors.email = 'Enter a valid email address, or leave it blank.';
  }

  if (isBlank(v.houseNumber)) errors.houseNumber = 'House/door number is required.';
  if (isBlank(v.street)) errors.street = 'Street name is required.';
  if (isBlank(v.area)) errors.area = 'Area/locality is required.';
  if (isBlank(v.city)) errors.city = 'City is required.';

  if (isBlank(v.pincode)) {
    errors.pincode = 'Pincode is required.';
  } else if (!PINCODE_RE.test(v.pincode)) {
    errors.pincode = 'Enter a valid 6-digit pincode.';
  }

  if (v.deliveryPreference !== 'morning' && v.deliveryPreference !== 'evening') {
    errors.deliveryPreference = 'Choose a morning or evening delivery round.';
  }

  const qty = Number(v.dailyQuantity);
  if (v.dailyQuantity === undefined || v.dailyQuantity === null || v.dailyQuantity === '' || Number.isNaN(qty) || qty <= 0) {
    errors.dailyQuantity = 'Enter the daily milk quantity in litres.';
  }

  if (isBlank(v.password) || v.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }
  if (v.confirmPassword !== v.password) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return { errors, clean: v };
}

module.exports = { validateRegistration, MOBILE_RE, PINCODE_RE, EMAIL_RE };
