const express = require('express');
const orderRepository = require('../db/orderRepository');
const { findProductById } = require('../data/productCatalog');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

const MAX_CUSTOM_QUANTITY = 20000; // sanity ceiling, not a business rule

/**
 * A quantity is valid when it's one of the product's preset options, or a
 * custom "<number> <measureUnit>" the customer typed in (e.g. "750 ml").
 * Either way the unit must match the product's real measure unit — this
 * is what stops a client from sending something like "500 kg" of milk.
 */
function isValidQuantity(quantityLabel, product) {
  if (product.quantityOptions.includes(quantityLabel)) return true;

  const match = /^(\d+(?:\.\d+)?)\s?([a-zA-Z]+)$/.exec(quantityLabel);
  if (!match) return false;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  return unit === product.measureUnit && amount > 0 && amount <= MAX_CUSTOM_QUANTITY;
}

router.post('/orders', requireAuth, (req, res, next) => {
  try {
    const productId = String((req.body && req.body.productId) || '').trim();
    const quantityLabel = String((req.body && req.body.quantityLabel) || '').trim();
    const notes = String((req.body && req.body.notes) || '').trim().slice(0, 300);

    const product = findProductById(productId);
    if (!product) {
      return res.status(400).json({ error: 'INVALID_PRODUCT', message: 'That product could not be found.' });
    }
    if (!quantityLabel || !isValidQuantity(quantityLabel, product)) {
      return res.status(400).json({ error: 'INVALID_QUANTITY', message: 'Enter a valid quantity for this product.' });
    }

    const order = orderRepository.create({
      customerId: req.session.customerId,
      productId: product.id,
      productName: product.name,
      quantityLabel,
      notes,
    });

    res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
});

router.get('/orders', requireAuth, (req, res, next) => {
  try {
    const orders = orderRepository.listByCustomer(req.session.customerId);
    res.status(200).json({ orders });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
