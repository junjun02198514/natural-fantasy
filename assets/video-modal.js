(function () {
  var lb = document.getElementById('lightbox');
  if (!lb) return;
  var player = document.getElementById('lightbox-video');
  var cap = document.getElementById('lightbox-cap');
  var panel = player.closest('.lightbox-panel');
  var closeBtn = lb.querySelector('.lightbox-close');
  var seek = null, time = null, playBtn = null, muteBtn = null, fsBtn = null, status = null;
  var scrubbing = false;

  // 不使用浏览器原生控制条：它会浮在画面底部，遮住游戏 UI。
  player.removeAttribute('controls');

  function fmt(t) {
    if (!isFinite(t)) t = 0;
    var m = Math.floor(t / 60);
    var s = Math.floor(t % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function sync() {
    if (playBtn) playBtn.textContent = player.paused ? '▶' : '❚❚';
    if (muteBtn) muteBtn.textContent = player.muted || player.volume === 0 ? '🔇' : '🔊';
    if (seek && !scrubbing && player.duration) {
      seek.value = String(Math.round(player.currentTime / player.duration * 1000));
    }
    if (time) time.textContent = fmt(player.currentTime) + ' / ' + fmt(player.duration);
    if (status) {
      if (player.error) status.textContent = '加载失败';
      else if (player.paused) status.textContent = '已暂停';
      else status.textContent = '播放中';
    }
  }

  function buildBar() {
    var bar = document.createElement('div');
    bar.className = 'lb-controls';
    bar.innerHTML =
      '<button class="lb-btn" data-act="play" aria-label="播放 / 暂停">▶</button>' +
      '<input class="lb-seek" type="range" min="0" max="1000" step="1" value="0" aria-label="进度">' +
      '<span class="lb-time">0:00 / 0:00</span>' +
      '<span class="lb-status">已暂停</span>' +
      '<button class="lb-btn" data-act="mute" aria-label="静音">🔊</button>' +
      '<button class="lb-btn" data-act="expand" aria-label="放大 / 还原">⛶</button>';
    panel.insertBefore(bar, cap);
    playBtn = bar.querySelector('[data-act="play"]');
    muteBtn = bar.querySelector('[data-act="mute"]');
    fsBtn = bar.querySelector('[data-act="expand"]');
    seek = bar.querySelector('.lb-seek');
    time = bar.querySelector('.lb-time');
    status = bar.querySelector('.lb-status');

    playBtn.addEventListener('click', function () {
      if (player.paused) player.play(); else player.pause();
    });
    muteBtn.addEventListener('click', function () {
      player.muted = !player.muted;
      sync();
    });
    fsBtn.addEventListener('click', function () {
      lb.classList.toggle('expanded');
    });
    seek.addEventListener('input', function () {
      scrubbing = true;
      if (player.duration) player.currentTime = player.duration * Number(seek.value) / 1000;
      sync();
    });
    seek.addEventListener('change', function () { scrubbing = false; });

    player.addEventListener('timeupdate', sync);
    player.addEventListener('play', sync);
    player.addEventListener('pause', sync);
    player.addEventListener('volumechange', sync);
    player.addEventListener('loadedmetadata', sync);
    player.addEventListener('loadeddata', clearLoadTimer);
    player.addEventListener('canplay', clearLoadTimer);
    player.addEventListener('playing', sync);
    player.addEventListener('waiting', sync);
    player.addEventListener('error', sync);
    player.addEventListener('click', function () {
      if (player.paused) player.play(); else player.pause();
    });
  }

  var loadTimer = null;
  var loadSrc = '';

  function clearLoadTimer() {
    if (loadTimer) {
      clearTimeout(loadTimer);
      loadTimer = null;
    }
  }

  function playWithFallback() {
    var p = player.play();
    if (p && p.catch) p.catch(function () {
      if (player.muted) return;
      // 浏览器拒绝带声音自动播放 → 静音再试一次；控制条上的喇叭可随时恢复
      player.muted = true;
      sync();
      var p2 = player.play();
      if (p2 && p2.catch) p2.catch(function () {});
    });
  }

  function open(src, title) {
    player.src = src;
    player.load();
    player.currentTime = 0;
    player.muted = false;
    player.volume = 1;
    if (cap) cap.textContent = title || '';
    if (seek) seek.value = '0';
    if (time) time.textContent = '0:00 / 0:00';
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    sync();
    loadSrc = src;
    clearLoadTimer();
    // 本地服务器对中断过的缓存可能返回 304，媒体会一直停在 readyState 0。
    // 2.5 秒内没拿到可播放数据，就换一个带时间戳的地址重新请求一次。
    loadTimer = setTimeout(function () {
      if (lb.hidden || player.getAttribute('src') !== loadSrc) return;
      if (player.readyState >= 2) return;
      var bust = loadSrc + (loadSrc.indexOf('?') >= 0 ? '&' : '?') + 'r=' + Date.now();
      loadSrc = bust;
      player.src = bust;
      player.load();
      playWithFallback();
    }, 2500);
    playWithFallback();
  }

  function close() {
    clearLoadTimer();
    player.pause();
    player.removeAttribute('src');
    player.load();
    lb.hidden = true;
    lb.classList.remove('expanded');
    document.body.style.overflow = '';
  }

  buildBar();

  document.querySelectorAll('.vcard video, .monster-media video, .split-media video').forEach(function (v) {
    v.style.cursor = 'pointer';
    var full = v.getAttribute('data-full');
    if (full) {
      var cardEl = v.closest('.vcard');
      if (cardEl) {
        cardEl.style.position = 'relative';
        var badge = document.createElement('span');
        badge.className = 'vbadge';
        badge.textContent = '完整演示';
        cardEl.appendChild(badge);
      }
    }
    v.addEventListener('click', function () {
      var card = v.closest('.vcard, .monster, .split');
      var h = card ? card.querySelector('h3, h2') : null;
      open(full || v.getAttribute('src'), h ? h.textContent : '');
    });
  });

  document.querySelectorAll('[data-video]').forEach(function (el) {
    el.style.cursor = 'pointer';
    el.addEventListener('click', function () {
      open(el.getAttribute('data-video'), el.getAttribute('data-title') || '');
    });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        open(el.getAttribute('data-video'), el.getAttribute('data-title') || '');
      }
    });
  });

  closeBtn.addEventListener('click', close);
  lb.addEventListener('click', function (e) {
    if (e.target === lb) close();
  });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') {
      if (lb.classList.contains('expanded')) lb.classList.remove('expanded');
      else close();
      return;
    }
    if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') {
      e.preventDefault();
      if (player.paused) player.play(); else player.pause();
      return;
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      if (!player.duration) return;
      e.preventDefault();
      var d = e.key === 'ArrowLeft' ? -5 : 5;
      player.currentTime = Math.max(0, Math.min(player.duration, player.currentTime + d));
    }
  });
})();
