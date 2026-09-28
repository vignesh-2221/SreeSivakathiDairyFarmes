const { getDb } = require('./connection');

function generateCandidateCode() {
  const n = Math.floor(100000 + Math.random() * 900000); // 6 digits
  return `SSD-${n}`;
}

function rowToCustomer(row) {
  if (!row) return null;
  return {
    id: row.id,
    customerCode: row.customer_code,
    fullName: row.full_name,
    mobileNumber: row.mobile_number,
    whatsappNumber: row.whatsapp_number,
    email: row.email,
    houseNumber: row.house_number,
    street: row.street,
    area: row.area,
    city: row.city,
    pincode: row.pincode,
    deliveryPreference: row.delivery_preference,
    dailyQuantity: row.daily_quantity,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
  };
}

function findByMobile(mobileNumber) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM customers WHERE mobile_number = ?').get(mobileNumber);
  return rowToCustomer(row);
}

function findByCode(customerCode) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM customers WHERE customer_code = ?').get(customerCode);
  return rowToCustomer(row);
}

function findById(id) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
  return rowToCustomer(row);
}

/** Every customer, alphabetically — the admin panel's delivery book. */
function listAll() {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM customers ORDER BY full_name COLLATE NOCASE ASC').all();
  return rows.map(rowToCustomer);
}

/** Deletes a customer by id. Returns true if a row was removed. */
function remove(id) {
  const db = getDb();
  const info = db.prepare('DELETE FROM customers WHERE id = ?').run(id);
  return info.changes > 0;
}

/**
 * Creates a customer with a freshly generated, guaranteed-unique
 * customer_code. `data.passwordHash` must already be a bcrypt hash —
 * this layer never sees or stores plain-text passwords.
 */
function create(data) {
  const db = getDb();
  const insert = db.prepare(`
    INSERT INTO customers (
      customer_code, full_name, mobile_number, whatsapp_number, email,
      house_number, street, area, city, pincode,
      delivery_preference, daily_quantity, password_hash
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const MAX_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = generateCandidateCode();
    try {
      const info = insert.run(
        code,
        data.fullName,
        data.mobileNumber,
        data.whatsappNumber || null,
        data.email || null,
        data.houseNumber,
        data.street,
        data.area,
        data.city,
        data.pincode,
        data.deliveryPreference,
        data.dailyQuantity,
        data.passwordHash
      );
      return findById(info.lastInsertRowid);
    } catch (err) {
      const message = String((err && err.message) || '');
      if (message.includes('UNIQUE constraint failed') && message.includes('customer_code')) {
        continue; // extremely rare collision on the random code — retry with a fresh one
      }
      if (message.includes('UNIQUE constraint failed') && message.includes('mobile_number')) {
        const dupError = new Error('DUPLICATE_MOBILE');
        dupError.code = 'DUPLICATE_MOBILE';
        throw dupError;
      }
      throw err;
    }
  }
  throw new Error('Could not generate a unique customer ID after several attempts. Please try again.');
}

module.exports = { findByMobile, findByCode, findById, listAll, remove, create };
