/**
 * Guards an API route so it only runs for a signed-in customer session.
 */
function requireAuth(req, res, next) {
  if (!req.session || !req.session.customerId) {
    return res.status(401).json({ error: 'NOT_AUTHENTICATED', message: 'Please log in to continue.' });
  }
  next();
}

module.exports = { requireAuth };
