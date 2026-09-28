const { getDb } = require('./connection');

function generateCandidateCode() {
  const n = Math.floor(100000 + Math.random() * 900000); // 6 digits
  return `ORD-${n}`;
}

function rowToOrder(row) {
  if (!row) return null;
  return {
    id: row.id,
    orderCode: row.order_code,
    customerId: row.customer_id,
    productId: row.product_id,
    productName: row.product_name,
    quantityLabel: row.quantity_label,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
  };
}

function findById(id) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  return rowToOrder(row);
}

/** All orders placed by one customer, newest first — the "My Orders" list. */
function listByCustomer(customerId) {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC, id DESC').all(customerId);
  return rows.map(rowToOrder);
}

/**
 * Creates an order with a freshly generated, guaranteed-unique order_code.
 * Callers must already have validated productId/quantityLabel against the
 * real product catalog — this layer just persists what it's given.
 */
function create(data) {
  const db = getDb();
  const insert = db.prepare(`
    INSERT INTO orders (order_code, customer_id, product_id, product_name, quantity_label, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const MAX_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = generateCandidateCode();
    try {
      const info = insert.run(
        code,
        data.customerId,
        data.productId,
        data.productName,
        data.quantityLabel,
        data.notes || null
      );
      return findById(info.lastInsertRowid);
    } catch (err) {
      const message = String((err && err.message) || '');
      if (message.includes('UNIQUE constraint failed') && message.includes('order_code')) {
        continue; // extremely rare collision on the random code — retry with a fresh one
      }
      throw err;
    }
  }
  throw new Error('Could not generate a unique order ID after several attempts. Please try again.');
}

module.exports = { findById, listByCustomer, create };
