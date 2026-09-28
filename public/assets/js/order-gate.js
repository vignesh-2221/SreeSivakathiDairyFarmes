/**
 * Order Now gate: before sending a visitor to the ordering page, check
 * whether they're a signed-in customer. Logged in -> straight through.
 * Not logged in -> register first (which also offers "Log in" for
 * existing customers), then continue on to the original destination.
 *
 * Any link with class="js-order-link" is intercepted. Its plain `href`
 * stays in the markup as a no-JS fallback.
 */
(function () {
  function safeNext(path) {
    if (!path) return null;
    if (path.indexOf('://') !== -1) return null;
    if (path.indexOf('//') === 0) return null;
    return path;
  }
  window.SSDSafeNext = safeNext;

  function goToOrder(productName) {
    var dest = 'order.html' + (productName ? ('?product=' + encodeURIComponent(productName)) : '');

    fetch('/api/me', { credentials: 'same-origin' })
      .then(function (res) {
        if (res.status === 200) {
          window.location.href = dest;
        } else {
          window.location.href = 'register.html?next=' + encodeURIComponent(dest);
        }
      })
      .catch(function () {
        // Can't reach the server to check — don't strand the visitor, just continue.
        window.location.href = dest;
      });
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest('.js-order-link');
    if (!link) return;
    e.preventDefault();
    goToOrder(link.getAttribute('data-product') || '');
  });
})();
