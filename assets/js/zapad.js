/* МСК «ЗАПАД» — интерактив макета. Чистый JS без зависимостей.
   Путь к картинкам можно переопределить: <script src="zapad.js" data-img="https://.../img/"> */
(function () {
  'use strict';
  var IMG = (document.currentScript && document.currentScript.dataset.img) || 'assets/img/';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]zpstatic/.test(location.search); /* ?zpstatic - bez animacij, dlya proverki verstki */
  if (/[?&]zpstatic/.test(location.search)) {
    document.documentElement.style.scrollBehavior = 'auto';
    addEventListener('load', function () {
      var m = /[?&]y=(\d+)/.exec(location.search), t = location.hash && document.getElementById(location.hash.slice(1));
      if (m) scrollTo(0, +m[1]); else if (t) t.scrollIntoView();
    });
  }
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var ease = function (t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };

  /* Когда блок появился в окне: один раз вызываем fn */
  function onView(el, fn, opts) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { fn(el); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); fn(e.target); } });
    }, opts || { threshold: .25 });
    io.observe(el);
  }

  /* Падение деталей: тот же приём, что в презентации (только сдвиг и прозрачность) */
  function DROP(h) {
    return [
      { transform: 'translate3d(0,' + (-h) + 'rem,0)', opacity: 0, easing: 'cubic-bezier(.45,0,.9,.6)' },
      { opacity: 1, offset: .2 },
      { transform: 'translate3d(0,0,0)', offset: .62, easing: 'cubic-bezier(.2,.6,.4,1)' },
      { transform: 'translate3d(0,-.45rem,0)', offset: .8, easing: 'cubic-bezier(.5,0,.8,.5)' },
      { transform: 'translate3d(0,0,0)', opacity: 1 }
    ];
  }
  function place(el, r) { el.style.left = r.x + '%'; el.style.top = r.y + '%'; el.style.width = r.w + '%'; el.style.height = r.h + '%'; }

  /* ---------- кнопки: перекатывающийся текст, заливка из точки курсора, лёгкий «магнит» ---------- */
  var AR = '<svg class="zp-btn__ar" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  $$('.zp-btn').forEach(function (b) {
    if (b.dataset.zpBtn) return; b.dataset.zpBtn = '1';
    var ar = $('.zp-btn__ar', b); if (ar) ar.remove();
    var label = b.textContent.trim();
    var chip = ar || /zp-btn--(go|ink|amber)/.test(b.className) ? '<span class="zp-btn__chip" aria-hidden="true">' + AR + '</span>' : '';
    b.innerHTML = '<span class="zp-btn__t"><span data-t="' + label.replace(/"/g, '&quot;') + '">' + label + '</span></span>' + chip;
    if (reduced) return;
    function at(e) {
      var r = b.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      b.style.setProperty('--x', x + 'px'); b.style.setProperty('--y', y + 'px');
      b.style.setProperty('--s', (Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y)) / 6 + 1).toFixed(1));
    }
    b.addEventListener('pointerenter', at);
    b.addEventListener('pointermove', at);
    b.addEventListener('pointerleave', function (e) { at(e); });
  });

  /* ---------- заголовки по словам и появление блоков ---------- */
  $$('[data-zp-split]').forEach(function (el) {
    var n = 0;
    var wrap = function (node) {
      var words = node.textContent.trim().split(/\s+/);
      node.innerHTML = words.map(function (w) { return '<span class="zp-sw"><span style="--i:' + (n++) + '">' + w + '</span></span>'; }).join(' ');
    };
    var lines = $$('.zp-line', el);
    if (lines.length) lines.forEach(wrap); else wrap(el);
    onView(el, function () { el.classList.add('is-in'); }, { threshold: .3 });
  });
  $$('[data-zp-in]').forEach(function (el) { onView(el, function () { el.classList.add('is-in'); }, { threshold: .15 }); });
  $$('[data-zp-view]').forEach(function (el) { onView(el, function () { el.classList.add('is-in'); }, { threshold: .35 }); });

  /* ---------- счётчики ---------- */
  $$('[data-zp-count]').forEach(function (el) {
    var to = +el.dataset.zpCount, suffix = el.dataset.suffix || '';
    if (reduced) return;
    el.textContent = '0' + suffix;
    onView(el, function () {
      var t0 = performance.now(), ms = 1100;
      (function tick(now) {
        var t = clamp((now - t0) / ms, 0, 1), e = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(to * e) + suffix;
        if (t < 1) requestAnimationFrame(tick);
      })(t0);
    }, { threshold: .6 });
  });

  /* ---------- шапка: выпадающие меню и мобильное меню ---------- */
  (function () {
    var hdr = $('[data-zp-hdr]');
    if (!hdr) return;
    var desktop = matchMedia('(min-width: 1024px)');
    var canHover = matchMedia('(hover: hover)');
    var items = $$('.zp-nav__item', hdr), timer = 0;
    var page = document.body.dataset.page;
    $$('.zp-nav__link[data-page]', hdr).forEach(function (a) { if (a.dataset.page === page) a.setAttribute('aria-current', 'page'); });
    function close(it) { it.classList.remove('is-open'); var l = $('.zp-nav__link', it); if (l) l.setAttribute('aria-expanded', 'false'); }
    function open(it) { items.forEach(function (o) { if (o !== it) close(o); }); it.classList.add('is-open'); $('.zp-nav__link', it).setAttribute('aria-expanded', 'true'); }
    items.forEach(function (it) {
      var link = $('.zp-nav__link', it), mega = $('.zp-mega', it);
      if (!mega) return;
      link.setAttribute('aria-expanded', 'false');
      it.addEventListener('mouseenter', function () { if (desktop.matches && canHover.matches) { clearTimeout(timer); open(it); } });
      it.addEventListener('mouseleave', function () { if (desktop.matches && canHover.matches) timer = setTimeout(function () { close(it); }, 170); });
      link.addEventListener('click', function (e) {
        if (desktop.matches && canHover.matches) return;           // мышь на десктопе: обычный переход
        e.preventDefault();                                         // тач и мобильное меню: раскрыть раздел
        if (it.classList.contains('is-open')) close(it); else open(it);
      });
      link.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); open(it); var f = $('a', mega); if (f) f.focus(); }
      });
      it.addEventListener('focusout', function (e) { if (desktop.matches && !it.contains(e.relatedTarget)) close(it); });
    });
    var burger = $('[data-zp-burger]', hdr);
    function setMenu(on) {
      hdr.classList.toggle('is-menu', on);
      burger.setAttribute('aria-expanded', String(on));
      document.documentElement.style.overflow = on ? 'hidden' : '';
      if (!on) items.forEach(close);
    }
    if (burger) burger.addEventListener('click', function () { setMenu(!hdr.classList.contains('is-menu')); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { items.forEach(close); setMenu(false); } });
    document.addEventListener('click', function (e) {
      if (!hdr.contains(e.target)) items.forEach(close);
      var a = e.target.closest && e.target.closest('.zp-nav a');
      if (a && hdr.classList.contains('is-menu') && !(a.classList.contains('zp-nav__link') && a.parentNode.querySelector('.zp-mega'))) setMenu(false);
    });
    desktop.addEventListener('change', function () { setMenu(false); });
    var top = $('.zp-top', hdr);
    if (top && 'IntersectionObserver' in window) new IntersectionObserver(function (es) { hdr.classList.toggle('is-stuck', !es[0].isIntersecting); }, { threshold: 0, rootMargin: '-2px 0px 0px 0px' }).observe(top);
    var dock = $('[data-zp-dock]');
    if (dock) addEventListener('scroll', function () { dock.classList.toggle('is-on', scrollY > 520); }, { passive: true });
  })();

  /* ---------- макет посёлка на первом экране ---------- */
  var VILLAGE = [{ x: 45.867, y: 4.619, w: 17.331, h: 19.206 }, { x: 59.512, y: 17.747, w: 12.45, h: 14.587 }, { x: 70.767, y: 28.282, w: 12.55, h: 14.668 }, { x: 83.566, y: 40.681, w: 9.811, h: 11.507 }, { x: 28.536, y: 26.661, w: 11.504, h: 13.857 }, { x: 37.4, y: 35.089, w: 16.235, h: 18.395 }, { x: 50.448, y: 47.65, w: 12.6, h: 14.83 }, { x: 62.301, y: 58.833, w: 11.454, h: 13.776 }, { x: 4.283, y: 44.246, w: 17.331, h: 19.206 }, { x: 17.928, y: 57.374, w: 12.45, h: 14.506 }, { x: 29.183, y: 67.909, w: 12.5, h: 14.668 }, { x: 38.048, y: 76.337, w: 17.331, h: 19.206 }];
  (function () {
    var box = $('[data-zp-village]');
    if (!box) return;
    var spots = $$('.zp-spot', box);
    box.insertAdjacentHTML('afterbegin',
      '<img class="zp-village__base" src="' + IMG + 's/v-base.webp" alt="Макет посёлка из домов и бань FSP PANEL" width="1700" height="1045">' +
      VILLAGE.map(function (_, i) { return '<img class="zp-village__h" src="' + IMG + 's/v-' + i + '.webp" alt="" decoding="async">'; }).join(''));
    var houses = $$('.zp-village__h', box);
    houses.forEach(function (h, i) { place(h, VILLAGE[i]); });
    spots.forEach(function (s, k) {
      var r = VILLAGE[+s.dataset.i];
      s.style.setProperty('--x', (r.x + r.w * .5).toFixed(2) + '%');
      s.style.setProperty('--y', (r.y + 1).toFixed(2) + '%');
      s.style.setProperty('--d', (k * 110) + 'ms');
    });
    var ready = Promise.all(houses.concat($('.zp-village__base', box)).map(function (im) { return im.decode ? im.decode().catch(function () {}) : null; }));
    ready.then(function () {
      var order = houses.map(function (h, i) { return [h, VILLAGE[i].y]; }).sort(function (a, b) { return a[1] - b[1]; });
      order.forEach(function (o, k) {
        o[0].style.opacity = 1;
        if (!reduced && o[0].animate) o[0].animate(DROP(13), { duration: 820, delay: 350 + k * 70, fill: 'backwards' });
      });
      setTimeout(function () { box.classList.add('is-ready'); }, reduced ? 0 : 350 + order.length * 70 + 700);
    });
  })();

  /* ---------- панель FSP по слоям ---------- */
  $$('[data-zp-panel]').forEach(function (sec) {
    var stack = $('[data-zp-stack]', sec), items = $$('.zp-layer', sec), pinText = $('[data-zp-pin-text]', sec);
    if (!stack) return;
    var KEYS = ['frame', 'wool', 'membrane', 'osb', 'finish', null];
    var PIN = { frame: [58, 7], wool: [44, 16], membrane: [24, 12], osb: [66, 3], finish: [6, 30] };
    var layers = $$('.zp-stack__l[data-l]', stack), cur = -2;
    var pinQ = matchMedia('(min-width: 900px) and (min-height: 600px)');
    function vars(o, j, k) { stack.style.setProperty('--o', o.toFixed(3)); stack.style.setProperty('--j', j.toFixed(3)); stack.style.setProperty('--k', k); }
    function step(s) {
      if (s === cur) return; cur = s;
      items.forEach(function (it, k) { it.classList.toggle('is-on', k === s); });
      layers.forEach(function (im) { im.classList.toggle('is-act', s >= 0 && s < 5 && im.dataset.l === KEYS[s]); });
      stack.classList.toggle('has-pin', s >= 0);
      if (s >= 0) {
        var p = s < 5 ? PIN[KEYS[s]] : [46, 2];
        stack.style.setProperty('--px', p[0] + '%'); stack.style.setProperty('--py', p[1] + '%');
        if (pinText) pinText.textContent = items[s].dataset.pin || '';
      }
    }
    var pinned = false, ticking = false;
    function frame() {
      ticking = false;
      if (!pinned) return;
      var r = sec.getBoundingClientRect(), total = r.height - innerHeight;
      var p = clamp(-r.top / total, 0, 1);
      if (p < .1) { vars(ease(p / .1), 0, 0); step(-1); }
      else if (p < .7) { vars(1, 0, 0); step(Math.min(4, Math.floor((p - .1) / .12))); }
      else if (p < .86) { var t = ease((p - .7) / .16); vars(1 - t, t, 0); step(5); }
      else { vars(0, 1, 1); step(5); }
    }
    /* Панель разбирается только по клику: на слой в списке или на саму панель (следующий слой). */
    function mode() { pinned = false; sec.classList.remove('is-pinned'); if (cur < 0) vars(0, 0, 0); }
    function pick(s) {
      sec.classList.add('is-used');
      step(s); if (s === 5) { vars(0, 1, 0); setTimeout(function () { if (cur === 5) vars(0, 1, 1); }, 450); } else vars(1, 0, 0);
    }
    items.forEach(function (it, s) { $('button', it).addEventListener('click', function () { pick(s); }); });
    stack.addEventListener('click', function () { pick(cur >= 5 ? 0 : cur + 1); });
    var nextP = $('[data-zp-next]', sec), cntP = $('[data-zp-count-txt]', sec);
    if (nextP) nextP.addEventListener('click', function () { pick(cur >= 5 ? 0 : cur + 1); });
    sec.addEventListener('click', function () { if (cntP) cntP.textContent = 'Слой ' + (cur + 1) + ' из 6'; });
    mode();
  });

  /* ---------- сборка дома ---------- */
  $$('[data-zp-build]').forEach(function (root) {
    var stage = $('[data-zp-stage]', root), steps = $$('.zp-step', root), track = $('[data-zp-track]', root), replay = $('[data-zp-replay]', root);
    if (!stage) return;
    var PARTS = { piles: { x: 4.924, y: 40.967, w: 80.815, h: 57.847 }, frame: { x: 5.207, y: 39.507, w: 80.249, h: 52.646 }, floor: { x: 5.207, y: 39.325, w: 80.249, h: 50.547 }, wallB: { x: 41.426, y: 18.613, w: 45.274, h: 45.164 }, wallL: { x: 4.358, y: 18.613, w: 38.087, h: 37.135 }, wallR: { x: 46.293, y: 37.774, w: 40.238, h: 51.551 }, wallF: { x: 4.131, y: 31.387, w: 43.69, h: 58.12 }, inA: { x: 24.731, y: 24.726, w: 43.633, h: 50.091 }, inB: { x: 41.426, y: 26.186, w: 28.919, h: 38.686 }, slab: { x: 3.962, y: 15.693, w: 82.909, h: 43.887 }, tr1: { x: 1.415, y: 2.372, w: 47.312, h: 32.299 }, tr2: { x: 9.96, y: 5.931, w: 48.613, h: 34.854 }, tr3: { x: 19.694, y: 9.945, w: 49.915, h: 37.682 }, tr4: { x: 30.843, y: 14.416, w: 51.104, h: 41.241 }, tr5: { x: 43.69, y: 19.617, w: 44.992, h: 40.42 }, roofA: { x: 22.694, y: .182, w: 67.912, h: 34.945 }, roofB: { x: .17, y: .091, w: 71.59, h: 58.942 } };
    var STAGES = [['piles', 'frame', 'floor'], ['wallB', 'wallL', 'wallR', 'wallF'], ['inA', 'inB'], ['slab'], ['tr1', 'tr2', 'tr3', 'tr4', 'tr5'], ['roofA', 'roofB'], null];
    stage.innerHTML = steps.map(function (st, i) { return '<img class="zp-build__still" src="' + IMG + 's/b-s' + i + '.webp" alt="' + $('b', st).textContent + '" loading="lazy">'; }).join('') +
      Object.keys(PARTS).map(function (p) { return '<img class="zp-build__part" data-part="' + p + '" src="' + IMG + 's/b-' + p + '.webp" alt="" loading="lazy">'; }).join('');
    var stills = $$('.zp-build__still', stage), parts = {};
    $$('.zp-build__part', stage).forEach(function (g) { parts[g.dataset.part] = g; place(g, PARTS[g.dataset.part]); });
    var cur = -1, timer = 0, auto = 0, anims = [];
    function still(k, slow) { stills.forEach(function (im, i) { im.classList.toggle('is-slow', !!slow); im.classList.toggle('is-on', i === k); }); }
    function mark(s) {
      steps.forEach(function (st, i) { st.classList.toggle('is-on', i === s); st.classList.toggle('is-done', i < s); st.setAttribute('aria-current', i === s ? 'step' : 'false'); });
      if (track) track.style.setProperty('--p', (s + 1) / steps.length);
    }
    function reset(k) {
      clearTimeout(timer); anims.forEach(function (a) { a.cancel(); }); anims = [];
      Object.keys(parts).forEach(function (p) { parts[p].style.visibility = 'hidden'; });
      still(k);
    }
    /* Возвращает длительность шага в мс */
    function go(s, forward) {
      mark(s); cur = s;
      reset(forward ? s - 1 : s);
      var list = STAGES[s];
      if (!forward || reduced || !stage.animate) { still(s); return 300; }
      if (!list) { still(s, true); return 1000; }
      var gap = s === 4 ? 130 : s === 0 ? 240 : s === 2 ? 320 : 210, lift = s === 0 ? 7 : s === 1 ? 9 : 8, end = 0;
      list.forEach(function (p, k) {
        var g = parts[p], dur = 780;
        g.style.visibility = 'visible';
        anims.push(g.animate(p === 'piles' ? [{ transform: 'translate3d(0,1.4rem,0)', opacity: 0 }, { transform: 'none', opacity: 1 }] : DROP(lift),
          { duration: p === 'piles' ? 480 : dur, delay: k * gap, easing: p === 'piles' ? 'cubic-bezier(.2,.75,.2,1)' : 'linear', fill: 'backwards' }));
        end = k * gap + dur;
      });
      if (s === 2) ['wallR', 'wallF'].forEach(function (p) { parts[p].style.visibility = 'visible'; });
      timer = setTimeout(function () {
        still(s);
        timer = setTimeout(function () { Object.keys(parts).forEach(function (p) { parts[p].style.visibility = 'hidden'; }); }, 320);
      }, end);
      return end;
    }
    function play(from) {
      clearTimeout(auto);
      var s = from;
      (function next() {
        if (s >= steps.length) return;
        var d = go(s, true); s++;
        auto = setTimeout(next, d + 950);
      })();
    }
    /* Сборка только по клику: нажали на этап — дом достраивается до него по шагам. */
    function upTo(k) {
      clearTimeout(auto); root.classList.add('is-used');
      if (k <= cur) { go(k, false); return; }
      var s = cur + 1;
      (function next() { var d = go(s, true); if (s < k) { s++; auto = setTimeout(next, Math.min(d, 700) + 250); } })();
    }
    steps.forEach(function (st, i) { st.addEventListener('click', function () { upTo(i); }); });
    stage.addEventListener('click', function () { upTo(cur >= steps.length - 1 ? 0 : cur + 1); });
    var nextB = $('[data-zp-next]', root), cntB = $('[data-zp-count-txt]', root);
    if (nextB) nextB.addEventListener('click', function () { upTo(cur >= steps.length - 1 ? 0 : cur + 1); });
    root.addEventListener('click', function () { setTimeout(function () { if (cntB) cntB.textContent = 'Этап ' + (cur + 1) + ' из ' + steps.length; }, 0); });
    if (replay) replay.addEventListener('click', function () { root.classList.add('is-used'); reset(-1); cur = -1; play(0); });
    mark(-1); still(steps.length - 1);   /* до первого клика показываем готовый дом */
  });

  /* ---------- было / стало ---------- */
  $$('[data-zp-ba]').forEach(function (ba) {
    var r = $('.zp-ba__r', ba);
    if (!r) return;
    r.addEventListener('input', function () { ba.style.setProperty('--p', r.value + '%'); });
    onView(ba, function () {
      if (reduced) return;
      var t0 = performance.now();
      (function tick(now) {
        var t = clamp((now - t0) / 1400, 0, 1);
        var v = 50 + 36 * Math.cos(t * Math.PI * 1.5) * (1 - t);
        if (document.activeElement !== r) { ba.style.setProperty('--p', v.toFixed(1) + '%'); r.value = v; }
        if (t < 1) requestAnimationFrame(tick);
      })(t0);
    }, { threshold: .5 });
  });

  /* ---------- «выбери — покажем»: [data-zp-pick] > [data-pick] / [data-pane]
     Переключение только по клику. Пока человек не нажал, кнопки слегка подсвечиваются и висит подсказка. ---------- */
  $$('[data-zp-sel]').forEach(function (root) {
    var btns = $$('[data-pick]', root), panes = $$('[data-pane]', root);
    function sel(id, user) {
      btns.forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.pick === id)); });
      panes.forEach(function (p) { p.classList.toggle('is-on', p.dataset.pane === id); });
      if (user) root.classList.add('is-used');
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); sel(b.dataset.pick, true); });
      b.addEventListener('keydown', function (e) {
        var k = btns.indexOf(b), n = e.key === 'ArrowRight' ? k + 1 : e.key === 'ArrowLeft' ? k - 1 : -9;
        if (n !== -9 && btns.length) { e.preventDefault(); var t = btns[(n + btns.length) % btns.length]; t.focus(); sel(t.dataset.pick, true); }
      });
    });
    var first = btns.filter(function (b) { return b.getAttribute('aria-selected') === 'true'; })[0] || (panes.length ? btns[0] : null);
    if (first) sel(first.dataset.pick, false);
  });

  /* ---------- конфигуратор бани: выбранное сразу видно на картинке и в итоге ---------- */
  $$('[data-zp-conf]').forEach(function (root) {
    var sum = $('[data-zp-conf-sum]', root), house = $('.zp-conf__house', root);
    var LABELS = { 'c-par': 'Парная', 'c-pech': 'Печь', 'c-ras': 'Растопка', 'c-otd': 'Отделка парной', 'c-col': 'Фасад' };
    function render() {
      sum.innerHTML = Object.keys(LABELS).map(function (n) { var i = $('input[name="' + n + '"]:checked', root); return '<li><span>' + LABELS[n] + '</span><b>' + (i ? i.value : '') + '</b></li>'; }).join('');
      var col = $('input[name="c-col"]:checked', root); if (col) house.style.setProperty('--wall', col.dataset.c);
      var pech = $('input[name="c-pech"]:checked', root); house.style.setProperty('--smoke', pech && pech.value === 'Дровяная' ? 1 : 0);
    }
    root.addEventListener('change', render); render();
  });

  /* ---------- просмотр фото крупно: ссылки [data-zp-lb] ---------- */
  (function () {
    if (!$('[data-zp-lb]')) return;
    var lb = document.createElement('div'); lb.className = 'zp-lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-label', 'Фото'); lb.innerHTML = '<img alt="">';
    document.body.appendChild(lb);
    var im = $('img', lb);
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('[data-zp-lb]');
      if (a) { e.preventDefault(); im.src = a.getAttribute('href'); im.alt = ($('img', a) || {}).alt || ''; lb.classList.add('is-open'); return; }
      if (lb.classList.contains('is-open') && lb.contains(e.target)) lb.classList.remove('is-open');
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') lb.classList.remove('is-open'); });
  })();

  /* ---------- универсальные вкладки: [data-zp-tabs] > [data-tab] / [data-pane] ---------- */  $$('[data-zp-tabs]').forEach(function (root) {
    var btns = $$('[data-tab]', root), panes = $$('[data-pane]', root);
    function sel(id) {
      btns.forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.tab === id)); });
      panes.forEach(function (p) { p.classList.toggle('is-on', p.dataset.pane === id); });
      root.dataset.cur = id;
    }
    btns.forEach(function (b) { b.addEventListener('click', function () { sel(b.dataset.tab); root.dispatchEvent(new CustomEvent('zp:tab', { detail: b.dataset.tab })); }); });
    root.zpSelect = sel;
    if (btns[0]) sel(root.dataset.cur || btns[0].dataset.tab);
  });
  /* модель из адреса: /fsp-panel#house-5x6 открывает нужную карточку */
  (function () {
    var cat = $('[data-zp-models]');
    if (!cat) return;
    function fromHash() {
      var id = location.hash.slice(1);
      if (id && $('[data-pane="' + id + '"]', cat)) { cat.zpSelect(id); cat.scrollIntoView({ block: 'start' }); }
    }
    addEventListener('hashchange', fromHash);
    fromHash();
  })();

  /* ---------- галереи: объекты и фото модели ---------- */
  $$('[data-zp-gal]').forEach(function (g) {
    var tb = $('[data-zp-thumbs]', g);   /* миниатюры строим из больших фото, чтобы не дублировать разметку */
    if (tb && !tb.children.length) tb.innerHTML = $$('[data-shot]', g).map(function (s, n) {
      return '<button class="zp-gal__thumb" type="button" data-thumb aria-label="Фото ' + (n + 1) + '"><img src="' + s.getAttribute('src') + '" alt="" loading="lazy"></button>';
    }).join('');
    var shots = $$('[data-shot]', g), thumbs = $$('[data-thumb]', g), i = 0, auto = 0;
    function show(k) {
      i = (k + shots.length) % shots.length;
      shots.forEach(function (s, n) { s.classList.toggle('is-on', n === i); });
      thumbs.forEach(function (t, n) { t.setAttribute('aria-selected', String(n === i)); });
    }
    thumbs.forEach(function (t, n) { t.addEventListener('click', function () { clearInterval(auto); show(n); }); });
    show(0);
    if (g.hasAttribute('data-auto') && !reduced) {
      onView(g, function () { auto = setInterval(function () { show(i + 1); }, 4200); }, { threshold: .4 });
      g.addEventListener('pointerenter', function () { clearInterval(auto); });
    }
  });

  /* ---------- комплектации: дома / бани ---------- */
  $$('[data-zp-kitroot]').forEach(function (root) {
    $$('[data-kit]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        root.classList.toggle('is-baths', b.dataset.kit === 'baths');
        $$('[data-kit]', root).forEach(function (o) { o.setAttribute('aria-selected', String(o === b)); });
      });
    });
  });

  /* ---------- темп производства ---------- */
  $$('[data-zp-rate]').forEach(function (root) {
    var box = $('[data-zp-bars]', root), num = $('[data-zp-rate-num]', root), label = $('[data-zp-rate-label]', root);
    box.innerHTML = Array.apply(null, Array(12)).map(function (_, i) { return '<i style="--i:' + i + '"></i>'; }).join('');
    var bars = $$('i', box);
    function set(n) {
      num.textContent = n === 10 ? '10' : '4–5';
      label.textContent = n === 10 ? 'домов в месяц при заказе от 50 домов' : 'домов в месяц при заказе около 10 домов';
      bars.forEach(function (b, i) { b.style.setProperty('--h', Math.max(.03, ((i + 1) * n) / 120).toFixed(3)); });
      $$('[data-rate]', root).forEach(function (b) { b.setAttribute('aria-selected', String(+b.dataset.rate === n)); });
    }
    $$('[data-rate]', root).forEach(function (b) { b.addEventListener('click', function () { set(+b.dataset.rate); }); });
    onView(root, function () { set(10); }, { threshold: .4 });
  });

  /* ---------- калькулятор посёлка ---------- */
  $$('[data-zp-calc]').forEach(function (root) {
    var PRICE = { 'house-5x6': 2210000, 'house-5x12': 4550000, 'bath-2x6': 1150000, 'bath-5x6': 2250000, 'bath-5x8': 3040000 };
    var range = $('[data-zp-calc-range]', root), nOut = $('[data-zp-calc-n]', root), sum = $('[data-zp-calc-sum]', root), time = $('[data-zp-calc-time]', root), plots = $('[data-zp-plots]', root);
    var HOUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3L2 12h3v9h14v-9h3z"/></svg>';
    plots.innerHTML = Array.apply(null, Array(100)).map(function (_, i) { return '<i style="--i:' + i + '">' + HOUSE + '</i>'; }).join('');
    var cells = $$('i', plots);
    function pace(n) {
      if (n <= 15) return [Math.ceil(n / 5), Math.ceil(n / 4)];
      if (n < 50) return [Math.ceil(n / 10), Math.ceil(n / 5)];
      return [Math.ceil(n / 10), Math.ceil(n / 10)];
    }
    function mon(v) { return v + ' ' + (v % 10 === 1 && v % 100 !== 11 ? 'месяц' : v % 10 >= 2 && v % 10 <= 4 && (v % 100 < 10 || v % 100 >= 20) ? 'месяца' : 'месяцев'); }
    function render() {
      var n = +range.value, id = ($('input[name="zp-calc-m"]:checked', root) || {}).value, total = PRICE[id] * n;
      nOut.textContent = n;
      sum.textContent = 'от ' + (total >= 1e9 ? (total / 1e9).toFixed(2).replace('.', ',') + ' млрд ₽' : (total / 1e6).toFixed(total >= 1e7 ? 0 : 1).replace('.', ',') + ' млн ₽');
      var p = pace(n);
      var gen = p[1] + ' ' + (p[1] % 10 === 1 && p[1] % 100 !== 11 ? 'месяца' : 'месяцев');   /* «около 3 месяцев» */
      time.textContent = p[0] === p[1] ? 'около ' + gen : p[0] + '–' + mon(p[1]);
      cells.forEach(function (c, i) { c.classList.toggle('is-on', i < n); });
    }
    root.addEventListener('input', render);
    render();
  });

  /* ---------- ночной посёлок: окна загораются по очереди ---------- */
  var NIGHT = [{ x: 36.554, y: .81, w: 29.133, h: 31.686 }, { x: 50.349, y: 11.507, w: 26.594, h: 29.498 }, { x: 61.554, y: 22.204, w: 26.743, h: 29.498 }, { x: 72.809, y: 33.063, w: 25.149, h: 27.553 }, { x: 22.56, y: 19.935, w: 24.502, h: 27.472 }, { x: 32.321, y: 29.741, w: 29.88, h: 28.363 }, { x: 43.625, y: 41.41, w: 27.39, h: 27.391 }, { x: 54.831, y: 52.107, w: 24.502, h: 26.256 }, { x: 0, y: 40.357, w: 24.104, h: 30.389 }, { x: 8.715, y: 51.053, w: 26.643, h: 29.498 }, { x: 19.97, y: 61.75, w: 26.594, h: 29.498 }, { x: 30.279, y: 72.447, w: 26.345, h: 27.553 }];
  $$('[data-zp-night]').forEach(function (box) {
    var LIT = [5, 0, 9, 3, 7, 11, 1, 6, 10, 2, 8, 4];
    box.innerHTML = '<img class="zp-night__base" src="' + IMG + 's/n-base.webp" alt="" loading="lazy">' +
      NIGHT.map(function (_, i) { return '<img class="zp-night__l" src="' + IMG + 's/n-' + i + '.webp" alt="" loading="lazy" style="--k:' + LIT.indexOf(i) + '">'; }).join('');
    $$('.zp-night__l', box).forEach(function (im, i) { place(im, NIGHT[i]); });
    onView(box, function () { box.classList.add('is-lit'); }, { threshold: .3 });
  });

  /* ---------- формы и всплывающее окно ----------
     Кнопки ведут на #popup:call — на Тильде такие ссылки откроют ваш рабочий попап с формой.
     В макете открываем демонстрационное окно. */
  (function () {
    var modal = $('[data-zp-modal]'), last = null;
    function open(topic) {
      if (!modal) return;
      last = document.activeElement;
      if (topic) { var r = $('input[name="topic"][value="' + topic + '"]', modal); if (r) r.checked = true; }
      modal.classList.add('is-open'); modal.setAttribute('aria-hidden', 'false');
      var f = $('input[type="text"]', modal); if (f) setTimeout(function () { f.focus(); }, 60);
    }
    function close() { if (!modal) return; modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true'); if (last && last.focus) last.focus(); }
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#popup:"]');
      if (a) { e.preventDefault(); open(a.dataset.topic); return; }
      if (modal && (e.target === modal || (e.target.closest && e.target.closest('[data-zp-close]')))) close();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    $$('input[type="tel"]').forEach(function (inp) {
      inp.addEventListener('input', function () {
        var d = inp.value.replace(/\D/g, '').replace(/^[78]/, '').slice(0, 10), o = '+7';
        if (d.length) o += ' ' + d.slice(0, 3);
        if (d.length > 3) o += ' ' + d.slice(3, 6);
        if (d.length > 6) o += '-' + d.slice(6, 8);
        if (d.length > 8) o += '-' + d.slice(8, 10);
        inp.value = o;
      });
    });
    $$('form[data-zp-form]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var tel = $('input[type="tel"]', form);
        if (tel && tel.value.replace(/\D/g, '').length < 11) { tel.focus(); tel.setCustomValidity('Введите номер полностью'); tel.reportValidity(); tel.setCustomValidity(''); return; }
        form.classList.add('is-sent');
      });
    });
  })();

  /* ---------- подсветка текущего раздела в подменю страницы ---------- */
  (function () {
    var nav = $('[data-zp-subnav]');
    if (!nav || !('IntersectionObserver' in window)) return;
    var links = $$('a[href^="#"]', nav), map = {};
    links.forEach(function (a) { var t = document.getElementById(a.getAttribute('href').slice(1)); if (t) map[t.id] = a; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('is-on', a === map[e.target.id]); });
        var a = map[e.target.id];
        if (a && a.scrollIntoView && nav.scrollWidth > nav.clientWidth) a.parentNode.scrollTo({ left: a.offsetLeft - 20, behavior: 'smooth' });
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  })();
})();
