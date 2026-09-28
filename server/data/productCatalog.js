const fs = require('fs');
const path = require('path');

/**
 * Reads the same product data the home page renders from
 * (public/assets/data/products.json) so orders can be validated against
 * real products without duplicating the catalog. Cached after first read;
 * restart the server if you edit products.json.
 */
const CATALOG_PATH = path.join(__dirname, '..', '..', 'public', 'assets', 'data', 'products.json');

let cache = null;

function loadCatalog() {
  if (cache) return cache;
  const raw = fs.readFileSync(CATALOG_PATH, 'utf8');
  cache = JSON.parse(raw);
  return cache;
}

function findProductById(id) {
  return loadCatalog().find((p) => p.id === id) || null;
}

module.exports = { loadCatalog, findProductById };
