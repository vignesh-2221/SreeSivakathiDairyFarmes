const express = require('express');
const customerRepository = require('../db/customerRepository');

/**
 * Admin routes for the local delivery-book panel (admin.html).
 *
 * NOT AUTHENTICATED. This mirrors admin.html itself, which has no login
 * screen today — anyone who can reach this server can list or delete
 * customers. That's an acceptable trade-off for a tool that only runs on
 * your own computer, but before this app is ever exposed beyond
 * localhost, add real admin authentication here first.
 */
const router = express.Router();

function toPublicCustomer(customer) {
  const { passwordHash, ...publicFields } = customer; // eslint-disable-line no-unused-vars
  return publicFields;
}

router.get('/customers', (req, res, next) => {
  try {
    const customers = customerRepository.listAll().map(toPublicCustomer);
    res.status(200).json({ customers });
  } catch (err) {
    next(err);
  }
});

router.delete('/customers/:id', (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'INVALID_ID', message: 'Invalid customer id.' });
    }
    const deleted = customerRepository.remove(id);
    if (!deleted) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'No customer with that id.' });
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
