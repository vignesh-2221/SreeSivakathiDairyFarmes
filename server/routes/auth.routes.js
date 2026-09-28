const express = require('express');
const bcrypt = require('bcryptjs');
const customerRepository = require('../db/customerRepository');
const { validateRegistration } = require('../validation/customerValidation');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();
const PASSWORD_HASH_ROUNDS = 12;

function toPublicCustomer(customer) {
  if (!customer) return null;
  const { passwordHash, id, ...publicFields } = customer;
  return publicFields;
}

router.post('/register', async (req, res, next) => {
  try {
    const { errors, clean } = validateRegistration(req.body || {});
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', fieldErrors: errors });
    }

    const existing = customerRepository.findByMobile(clean.mobileNumber);
    if (existing) {
      return res.status(409).json({
        error: 'DUPLICATE_MOBILE',
        message: 'An account with this mobile number already exists. Please log in instead.',
      });
    }

    const passwordHash = await bcrypt.hash(clean.password, PASSWORD_HASH_ROUNDS);

    let customer;
    try {
      customer = customerRepository.create({
        fullName: clean.fullName,
        mobileNumber: clean.mobileNumber,
        whatsappNumber: clean.whatsappNumber,
        email: clean.email,
        houseNumber: clean.houseNumber,
        street: clean.street,
        area: clean.area,
        city: clean.city,
        pincode: clean.pincode,
        deliveryPreference: clean.deliveryPreference,
        dailyQuantity: Number(clean.dailyQuantity),
        passwordHash,
      });
    } catch (err) {
      if (err && err.code === 'DUPLICATE_MOBILE') {
        return res.status(409).json({
          error: 'DUPLICATE_MOBILE',
          message: 'An account with this mobile number already exists. Please log in instead.',
        });
      }
      throw err;
    }

    // Auto-login: regenerate the session so a stale session can't be reused, then store identity.
    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.customerId = customer.id;
      req.session.customerCode = customer.customerCode;
      res.status(201).json({ customer: toPublicCustomer(customer) });
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const mobileNumber = String((req.body && req.body.mobileNumber) || '').trim();
    const password = String((req.body && req.body.password) || '');

    if (!mobileNumber || !password) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Mobile number and password are required.' });
    }

    const customer = customerRepository.findByMobile(mobileNumber);
    if (!customer) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Mobile number or password is incorrect.' });
    }

    const passwordMatches = await bcrypt.compare(password, customer.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Mobile number or password is incorrect.' });
    }

    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.customerId = customer.id;
      req.session.customerCode = customer.customerCode;
      res.status(200).json({ customer: toPublicCustomer(customer) });
    });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res, next) => {
  if (!req.session) return res.status(200).json({ ok: true });
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('ssd.sid');
    res.status(200).json({ ok: true });
  });
});

router.get('/me', requireAuth, (req, res) => {
  const customer = customerRepository.findById(req.session.customerId);
  if (!customer) {
    return res.status(401).json({ error: 'NOT_AUTHENTICATED', message: 'Please log in to continue.' });
  }
  res.status(200).json({ customer: toPublicCustomer(customer) });
});

module.exports = router;
