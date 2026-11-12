// 浏览 / 点赞：Abacus 免费计数器（无需后端）
(function () {
  var NS = 'junjun-natural-fantasy';
  var API = 'https://abacus.jasoncameron.dev';
  var vEl = document.getElementById('viewCount');
  var lEl = document.getElementById('likeCount');
  var btn = document.getElementById('likeBtn');
  if (!vEl || !lEl || !btn) return;

  var heart = btn.querySelector('.heart');
  var liked = false;

  function setLiked(on) {
    liked = on;
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.disabled = on;
    if (heart) heart.textContent = on ? '♥' : '♡';
  }

  function fmt(n) {
    return Number(n).toLocaleString('en-US');
  }

  // 浏览量：每次打开 +1
  fetch(API + '/hit/' + NS + '/views')
    .then(function (r) { return r.json(); })
    .then(function (d) { if (d && d.value != null) vEl.textContent = fmt(d.value); })
    .catch(function () {});

  // 点赞数：读取当前值
  liked = localStorage.getItem('nf_liked') === '1';
  fetch(API + '/get/' + NS + '/likes')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (d && d.value != null) lEl.textContent = fmt(d.value);
      if (liked) setLiked(true);
    })
    .catch(function () {});

  btn.addEventListener('click', function () {
    if (liked) return;
    btn.disabled = true;
    fetch(API + '/hit/' + NS + '/likes')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.value != null) {
          lEl.textContent = fmt(d.value);
          localStorage.setItem('nf_liked', '1');
          setLiked(true);
        } else {
          btn.disabled = false;
        }
      })
      .catch(function () { btn.disabled = false; });
  });
})();
