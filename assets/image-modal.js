(function () {
  var lb = document.getElementById('imagelightbox');
  if (!lb) return;
  var big = document.getElementById('imagelightbox-img');
  var cap = document.getElementById('imagelightbox-cap');
  var closeBtn = lb.querySelector('.lightbox-close');

  function close() {
    lb.hidden = true;
    big.removeAttribute('src');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.step img, .guide img, .wide-shot img, .shot img, .extras-grid img').forEach(function (im) {
    im.style.cursor = 'zoom-in';
    im.addEventListener('click', function () {
      big.src = im.getAttribute('src');
      big.alt = im.alt || '';
      var fig = im.closest('figure');
      var c = fig ? fig.querySelector('figcaption') : null;
      cap.textContent = c ? c.innerText.trim().split(/\n+/).join(' · ') : (im.alt || '');
      lb.hidden = false;
      document.body.style.overflow = 'hidden';
    });
  });

  closeBtn.addEventListener('click', close);
  lb.addEventListener('click', function (e) {
    if (e.target === lb) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !lb.hidden) close();
  });
})();
