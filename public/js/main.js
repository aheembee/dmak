/* ============================================================================
   D_MAK MUSIC — client behaviour
   Vanilla JS, no dependencies. Everything degrades gracefully: no script,
   no problem; no network, honest fallbacks.
   ========================================================================== */
(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const safeStore = {
    get(k) {
      try { return window.sessionStorage.getItem(k); } catch (e) { return null; }
    },
    set(k, v) {
      try { window.sessionStorage.setItem(k, v); } catch (e) { /* sandboxed */ }
    },
  };

  /* ------------------------------------------------------------------ toast */

  const toastEl = $('#toast');
  let toastTimer = null;
  function toast(message, isError) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.hidden = false;
    toastEl.classList.toggle('is-error', Boolean(isError));
    requestAnimationFrame(() => toastEl.classList.add('is-on'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('is-on');
      setTimeout(() => { toastEl.hidden = true; }, 400);
    }, 4200);
  }

  /* ----------------------------------------------------- analytics (consent) */

  function trackHit() {
    if (safeStore.get('dmak-hit') === '1') return;
    safeStore.set('dmak-hit', '1');
    fetch('/api/hit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path: location.pathname }),
      keepalive: true,
    }).catch(() => {});
  }

  /* ------------------------------------------------------- navigation state */

  const nav = $('#site-nav');
  const progress = $('.scroll-progress i');
  function onScroll() {
    const y = window.scrollY;
    if (nav) nav.classList.toggle('is-stuck', y > 24);
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = `${max > 0 ? Math.min(100, (y / max) * 100) : 0}%`;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* -------------------------------------------------------------- drawer */

  const burger = $('[data-burger]');
  const drawer = $('#nav-drawer');
  const drawerClose = $('[data-drawer-close]');

  function setDrawer(open) {
    if (!drawer || !burger) return;
    drawer.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('is-locked', open);
    if (open) {
      const first = drawer.querySelector('a, button');
      if (first) first.focus({ preventScroll: true });
    } else {
      burger.focus({ preventScroll: true });
    }
  }
  if (burger) burger.addEventListener('click', () => setDrawer(drawer.hidden));
  if (drawerClose) drawerClose.addEventListener('click', () => setDrawer(false));
  if (drawer) {
    drawer.addEventListener('click', (e) => {
      if (e.target === drawer) setDrawer(false);
    });
  }

  /* ------------------------------------------------------- cursor + reveal */

  const cursor = $('.cursor');
  if (cursor && finePointer && !reduceMotion) {
    let cx = 0, cy = 0, tx = 0, ty = 0, raf = null;
    const loop = () => {
      cx += (tx - cx) * 0.14;
      cy += (ty - cy) * 0.14;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = cx !== tx || cy !== ty ? requestAnimationFrame(loop) : null;
    };
    window.addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY;
      cursor.classList.add('is-on');
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener('pointerleave', () => cursor.classList.remove('is-on'));
  }

  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* -------------------------------------------------------- hero waveform */

  const canvas = $('[data-wave]');
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let visible = true;
    const bars = [];
    const COLORS = ['123,92,255', '255,61,110', '232,180,76'];

    function resize() {
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(28, Math.floor(w / 16));
      bars.length = 0;
      for (let i = 0; i < count; i += 1) {
        bars.push({
          phase: Math.random() * Math.PI * 2,
          speed: 0.006 + Math.random() * 0.014,
          amp: 0.24 + Math.random() * 0.76,
          color: COLORS[i % 3],
        });
      }
    }

    function frame(t) {
      ctx.clearRect(0, 0, w, h);
      const gap = w / bars.length;
      bars.forEach((bar, i) => {
        const env = Math.sin((i / bars.length) * Math.PI);
        const val = (Math.sin(t * bar.speed + bar.phase) * 0.5 + 0.5) * bar.amp * env;
        const height = Math.max(2, val * h * 0.86);
        const x = i * gap + gap * 0.18;
        const bw = Math.max(2, gap * 0.5);
        const grad = ctx.createLinearGradient(0, h, 0, h - height);
        grad.addColorStop(0, `rgba(${bar.color},0.04)`);
        grad.addColorStop(1, `rgba(${bar.color},0.85)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(x, h - height, bw, height, bw / 2) : ctx.rect(x, h - height, bw, height);
        ctx.fill();
      });
      if (visible) requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener('resize', resize);
    new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        visible = entry.isIntersecting;
        if (visible) requestAnimationFrame(frame);
      });
    }, { threshold: 0 }).observe(canvas);
    requestAnimationFrame(frame);
  }

  /* ----------------------------------------------------------- audio player */

  const player = $('#player');
  const queueScript = $('#preview-queue');
  let queue = [];
  try {
    queue = JSON.parse(queueScript ? queueScript.textContent : '[]');
  } catch (err) {
    queue = [];
  }
  const audio = $('[data-player-audio]');
  let currentIndex = -1;
  let currentTrackId = null;

  const el = {
    title: $('[data-player-title]'),
    sub: $('[data-player-sub]'),
    art: $('[data-player-art]'),
    toggle: $('[data-player-toggle]'),
    prev: $('[data-player-prev]'),
    next: $('[data-player-next]'),
    close: $('[data-player-close]'),
    seek: $('[data-player-seek]'),
    elapsed: $('[data-player-elapsed]'),
    total: $('[data-player-total]'),
    badge: $('[data-player-badge]'),
    fallback: $('[data-player-fallback]'),
  };

  const ICON_PLAY = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7L8 5Z"/></svg>';
  const ICON_PAUSE = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7V5Zm6.5 0H17v14h-3.5V5Z"/></svg>';
  const ICON_SPIN = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4a8 8 0 1 0 8 8h-2a6 6 0 1 1-6-6V4Z"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.9s" repeatCount="indefinite"/></path></svg>';

  function fmt(sec) {
    const s = Math.max(0, Math.floor(sec || 0));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  function openPlayer() {
    if (!player) return;
    if (player.hidden) {
      player.hidden = false;
      requestAnimationFrame(() => player.classList.add('is-open'));
      document.body.classList.add('has-player');
    }
  }

  function closePlayer() {
    if (!player) return;
    player.classList.remove('is-open');
    document.body.classList.remove('has-player');
    if (audio) { audio.pause(); }
    setTimeout(() => { player.hidden = true; }, 450);
  }

  function paintToggle(state) {
    if (!el.toggle) return;
    el.toggle.innerHTML = state === 'loading' ? ICON_SPIN : state === 'playing' ? ICON_PAUSE : ICON_PLAY;
    el.toggle.setAttribute('aria-label', state === 'playing' ? 'Pause' : 'Play');
    el.toggle.disabled = state === 'loading';
  }

  function setFallback(message) {
    if (!el.fallback) return;
    el.fallback.hidden = !message;
    el.fallback.textContent = message || '';
  }

  function markPlayingButtons(trackId) {
    $$('[data-play]').forEach((btn) => {
      const match = btn.getAttribute('data-play') === String(trackId);
      btn.classList.toggle('is-playing', Boolean(match && audio && !audio.paused));
      const label = btn.querySelector('svg');
      if (match && label && btn.classList.contains('tracklist__play')) {
        btn.innerHTML = audio && !audio.paused ? ICON_PAUSE : ICON_PLAY;
      } else if (btn.classList.contains('tracklist__play')) {
        btn.innerHTML = ICON_PLAY;
      }
    });
  }

  function loadTrack(trackId, meta, { autoplay = true } = {}) {
    if (!audio || !player) return;
    openPlayer();
    setFallback('');
    const idx = queue.findIndex((t) => String(t.trackId) === String(trackId));
    currentIndex = idx;
    currentTrackId = String(trackId);
    const item = idx >= 0 ? queue[idx] : null;

    const title = (item && item.title) || (meta && meta.title) || 'Preview';
    const release = (item && item.release) || (meta && meta.release) || '';
    const art = (item && item.artwork) || (meta && meta.art) || '';

    if (el.title) el.title.textContent = title;
    if (el.sub) el.sub.textContent = release ? `${release} · D_MAK` : 'D_MAK';
    if (el.art) {
      el.art.style.backgroundImage = art ? `url('${art}')` : 'linear-gradient(140deg,#7b5cff,#ff3d6e)';
    }
    if (el.badge) el.badge.textContent = '30s preview';
    if (el.seek) { el.seek.value = 0; el.seek.style.setProperty('--p', '0%'); el.seek.disabled = false; }
    if (el.elapsed) el.elapsed.textContent = '0:00';
    if (el.total) el.total.textContent = '0:30';

    paintToggle('loading');
    audio.src = `/api/preview/${encodeURIComponent(trackId)}`;
    audio.load();
    if (autoplay) {
      audio.play().then(() => paintToggle('playing')).catch((err) => {
        paintToggle('idle');
        if (err && err.name === 'NotAllowedError') {
          setFallback('Tap play to start the preview.');
        }
      });
    } else {
      paintToggle('idle');
    }
  }

  if (audio) {
    audio.addEventListener('playing', () => {
      paintToggle('playing');
      setFallback('');
      markPlayingButtons(currentTrackId);
    });
    audio.addEventListener('pause', () => {
      paintToggle('idle');
      markPlayingButtons(currentTrackId);
    });
    audio.addEventListener('timeupdate', () => {
      const dur = audio.duration || 30;
      const pct = (audio.currentTime / dur) * 100;
      if (el.seek && !el.seek.matches(':active')) {
        el.seek.value = String(pct);
        el.seek.style.setProperty('--p', `${pct}%`);
      }
      if (el.elapsed) el.elapsed.textContent = fmt(audio.currentTime);
      if (el.total) el.total.textContent = fmt(dur);
    });
    audio.addEventListener('error', () => {
      paintToggle('idle');
      const item = queue[currentIndex];
      const link = item && item.links && item.links.deezer ? ` <a class="text-link" href="${item.links.deezer}" target="_blank" rel="noopener noreferrer">Stream on Deezer</a>` : '';
      if (el.fallback) {
        el.fallback.hidden = false;
        el.fallback.innerHTML = `Preview unavailable right now.${link}`;
      }
    });
    audio.addEventListener('ended', () => {
      if (queue.length > 1) {
        const next = (currentIndex + 1) % queue.length;
        loadTrack(queue[next].trackId, queue[next]);
      } else {
        paintToggle('idle');
      }
    });
  }

  document.addEventListener('click', (e) => {
    const playBtn = e.target.closest('[data-play]');
    if (playBtn) {
      e.preventDefault();
      const trackId = playBtn.getAttribute('data-play');
      if (currentTrackId === trackId && audio) {
        if (audio.paused) {
          audio.play().catch(() => setFallback('Preview unavailable right now.'));
        } else {
          audio.pause();
        }
        return;
      }
      loadTrack(trackId, {
        title: playBtn.getAttribute('data-title'),
        release: playBtn.getAttribute('data-release'),
        art: playBtn.getAttribute('data-art'),
      });
      return;
    }

    const opener = e.target.closest('[data-open-player]');
    if (opener) {
      e.preventDefault();
      if (queue.length) loadTrack(queue[0].trackId, queue[0]);
      else { openPlayer(); toast('No previews configured for this deployment.'); }
      return;
    }

    if (e.target.closest('[data-open-player-hint]')) {
      const email = $('#fan-email');
      if (email) { email.focus({ preventScroll: false }); }
    }
  });

  if (el.toggle) {
    el.toggle.addEventListener('click', () => {
      if (!audio) return;
      if (!audio.currentSrc) {
        if (queue.length) loadTrack(queue[0].trackId, queue[0]);
        return;
      }
      if (audio.paused) audio.play().catch(() => setFallback('Preview unavailable right now.'));
      else audio.pause();
    });
  }
  if (el.next) {
    el.next.addEventListener('click', () => {
      if (!queue.length) return;
      const next = (currentIndex + 1 + queue.length) % queue.length;
      loadTrack(queue[next].trackId, queue[next]);
    });
  }
  if (el.prev) {
    el.prev.addEventListener('click', () => {
      if (!queue.length) return;
      const prev = (currentIndex - 1 + queue.length) % queue.length;
      loadTrack(queue[prev].trackId, queue[prev]);
    });
  }
  if (el.close) el.close.addEventListener('click', closePlayer);
  if (el.seek) {
    el.seek.addEventListener('input', () => {
      if (!audio || !audio.duration) return;
      const pct = Number(el.seek.value) / 100;
      el.seek.style.setProperty('--p', `${pct * 100}%`);
      audio.currentTime = pct * audio.duration;
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (drawer && !drawer.hidden) setDrawer(false);
      closeLightbox();
      return;
    }
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
    if (e.code === 'Space' && player && !player.hidden) {
      e.preventDefault();
      if (el.toggle) el.toggle.click();
    }
  });

  /* -------------------------------------------------------------- lightbox */

  const lightbox = $('#lightbox');
  const lightboxContent = $('[data-lightbox-content]');
  let lastFocused = null;

  function openLightbox(html, label) {
    if (!lightbox || !lightboxContent) return;
    lastFocused = document.activeElement;
    lightboxContent.innerHTML = html;
    lightbox.hidden = false;
    document.body.classList.add('is-locked');
    const dialog = lightbox.querySelector('.lightbox__body');
    if (dialog && label) dialog.setAttribute('aria-label', label);
    const closeBtn = lightbox.querySelector('.lightbox__close');
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    if (lightboxContent) lightboxContent.innerHTML = '';
    document.body.classList.remove('is-locked');
    if (lastFocused && lastFocused.focus) lastFocused.focus({ preventScroll: true });
  }

  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target.closest('[data-lightbox-close]')) closeLightbox();
    });
  }

  document.addEventListener('click', (e) => {
    const videoBtn = e.target.closest('[data-video]');
    if (videoBtn) {
      const id = videoBtn.getAttribute('data-video');
      const title = videoBtn.getAttribute('data-video-title') || 'Video';
      openLightbox(
        `<figure>
          <iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1"
            title="${title.replace(/"/g, '&quot;')}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen loading="lazy"></iframe>
          <figcaption>${title} · If the player is blocked, <a class="text-link" href="https://www.youtube.com/watch?v=${encodeURIComponent(id)}" target="_blank" rel="noopener noreferrer">watch on YouTube</a>.</figcaption>
        </figure>`,
        title
      );
      return;
    }
    const imgBtn = e.target.closest('[data-lightbox-img]');
    if (imgBtn) {
      const src = imgBtn.getAttribute('data-lightbox-img');
      const title = imgBtn.getAttribute('data-lightbox-title') || '';
      openLightbox(
        `<figure><img src="${src}" alt="${title.replace(/"/g, '&quot;')}" /><figcaption>${title}</figcaption></figure>`,
        title
      );
    }
  });

  /* --------------------------------------------------------------- filters */

  function applyDiscFilter() {
    const grid = $('[data-disc-grid]');
    if (!grid) return;
    const activeType = ($('.filters [data-filter-type].is-active') || {}).getAttribute
      ? $('.filters [data-filter-type].is-active').getAttribute('data-filter-type')
      : 'All';
    const term = (($('[data-disc-search]') || {}).value || '').trim().toLowerCase();
    let shown = 0;
    $$('.rel-card', grid).forEach((card) => {
      const type = card.querySelector('.rel-card__type');
      const typeText = type ? type.textContent.trim() : '';
      const haystack = card.textContent.toLowerCase();
      const typeOk = activeType === 'All' || typeText === activeType;
      const termOk = !term || haystack.includes(term);
      const visible = typeOk && termOk;
      card.hidden = !visible;
      if (visible) shown += 1;
    });
    const count = $('[data-disc-count]');
    if (count) {
      count.textContent = `Showing ${shown} of ${$$('.rel-card', grid).length} releases${term ? ` · “${term}”` : ''}`;
    }
    const empty = $('[data-disc-empty]');
    if (empty) empty.hidden = shown !== 0;
  }

  $$('[data-filter-type]').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('[data-filter-type]').forEach((b) => {
        b.classList.remove('is-active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-pressed', 'true');
      applyDiscFilter();
    });
  });
  const discSearch = $('[data-disc-search]');
  if (discSearch) {
    let t = null;
    discSearch.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(applyDiscFilter, 140);
    });
  }
  applyDiscFilter();

  $$('[data-filter-news]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-filter-news');
      $$('[data-filter-news]').forEach((b) => {
        b.classList.remove('is-active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-pressed', 'true');
      $$('[data-news-cat]').forEach((item) => {
        item.hidden = cat !== 'All' && item.getAttribute('data-news-cat') !== cat;
      });
    });
  });

  $$('[data-filter-gallery]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-filter-gallery');
      $$('[data-filter-gallery]').forEach((b) => {
        b.classList.remove('is-active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-pressed', 'true');
      $$('[data-gal-cat]').forEach((item) => {
        item.hidden = cat !== 'All' && item.getAttribute('data-gal-cat') !== cat;
      });
    });
  });

  /* ---------------------------------------------------------------- forms */

  function setStatus(node, message, kind) {
    if (!node) return;
    node.textContent = message || '';
    node.classList.toggle('is-error', kind === 'error');
    node.classList.toggle('is-ok', kind === 'ok');
  }

  function fieldError(input, message) {
    const field = input.closest('.form-field');
    if (!field) return;
    field.classList.toggle('has-error', Boolean(message));
    const err = field.querySelector('[data-error]');
    if (err) err.textContent = message || '';
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function validateContact(form) {
    const errors = {};
    const name = form.elements.name;
    const email = form.elements.email;
    const message = form.elements.message;
    const consent = form.elements.consent;

    fieldError(name, '');
    fieldError(email, '');
    fieldError(message, '');

    if (!name.value.trim() || name.value.trim().length < 2) {
      errors.name = 'Please enter your name.';
      fieldError(name, errors.name);
    }
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email.value.trim())) {
      errors.email = 'Enter a valid email address.';
      fieldError(email, errors.email);
    }
    if (message.value.trim().length < 20) {
      errors.message = 'Please add at least 20 characters.';
      fieldError(message, errors.message);
    }
    if (!consent.checked) {
      errors.consent = 'Please tick the consent box.';
      const err = consent.closest('.form-field').querySelector('[data-error]');
      if (err) err.textContent = errors.consent;
    } else {
      const err = consent.closest('.form-field').querySelector('[data-error]');
      if (err) err.textContent = '';
    }
    return errors;
  }

  const contactForm = $('[data-contact]');
  if (contactForm) {
    // radio card styling
    $$('.route input', contactForm).forEach((input) => {
      input.addEventListener('change', () => {
        $$('.route', contactForm).forEach((r) => r.classList.remove('is-checked'));
        input.closest('.route').classList.add('is-checked');
      });
    });

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const status = contactForm.querySelector('[data-form-status]');
      const submit = contactForm.querySelector('[data-submit]');
      const label = contactForm.querySelector('[data-submit-label]');
      const errors = validateContact(contactForm);
      if (Object.keys(errors).length) {
        setStatus(status, 'Please fix the highlighted fields.', 'error');
        const firstBad = contactForm.querySelector('.has-error input, .has-error textarea');
        if (firstBad) firstBad.focus();
        return;
      }

      const payload = {
        type: (contactForm.querySelector('input[name="type"]:checked') || {}).value || 'booking',
        name: contactForm.elements.name.value.trim(),
        email: contactForm.elements.email.value.trim(),
        organisation: contactForm.elements.organisation.value.trim(),
        eventDate: contactForm.elements.eventDate.value,
        message: contactForm.elements.message.value.trim(),
        consent: contactForm.elements.consent.checked,
        website: contactForm.elements.website.value,
      };

      submit.disabled = true;
      if (label) label.textContent = 'Sending…';
      setStatus(status, 'Sending your message…');

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (data.errors) {
            Object.entries(data.errors).forEach(([key, msg]) => {
              const field = contactForm.elements[key];
              if (field) fieldError(field, msg);
            });
          }
          throw new Error(data.error || 'Could not send the message.');
        }
        contactForm.reset();
        $$('.route', contactForm).forEach((r, i) => r.classList.toggle('is-checked', i === 0));
        setStatus(status, 'Received. The team will be in touch — thank you.', 'ok');
        toast('Enquiry sent. Reference ' + String(data.id || '').slice(0, 6).toUpperCase());
      } catch (err) {
        setStatus(status, err.message || 'Something went wrong. Please try again.', 'error');
      } finally {
        submit.disabled = false;
        if (label) label.textContent = 'Send enquiry';
      }
    });
  }

  $$('[data-subscribe]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const status = form.querySelector('[data-form-status]');
      const input = form.querySelector('input[type="email"]');
      const country = form.querySelector('input[name="country"]');
      const btn = form.querySelector('button[type="submit"]');
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(input.value.trim())) {
        setStatus(status, 'Enter a valid email address.', 'error');
        input.focus();
        return;
      }
      if (btn) btn.disabled = true;
      setStatus(status, 'Adding you…');
      try {
        const res = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            email: input.value.trim(),
            country: country ? country.value.trim() : '',
            source: form.classList.contains('footer__sub') ? 'footer' : 'fanwall',
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Could not subscribe.');
        setStatus(status, data.duplicate ? 'You are already on the list.' : 'You are on the list. Welcome.', 'ok');
        form.reset();
        toast(data.duplicate ? 'Already subscribed.' : 'Subscribed — welcome to the frequency.');
      } catch (err) {
        setStatus(status, err.message || 'Something went wrong.', 'error');
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  });

  /* ------------------------------------------------------------- utilities */

  const printBtn = $('[data-print]');
  if (printBtn) printBtn.addEventListener('click', () => window.print());

  const analyticsBtn = $('[data-analytics-info]');
  if (analyticsBtn) {
    analyticsBtn.addEventListener('click', () => {
      toast('Cookieless analytics: only a page path and a timestamp are counted. No cookies, no IDs.');
    });
  }

  /* Instagram live feed — only renders when the server has a token. */
  const igWall = $('[data-ig-wall]');
  if (igWall) {
    fetch('/api/instagram')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || !data.live || !Array.isArray(data.items) || !data.items.length) return;
        igWall.innerHTML = data.items
          .slice(0, 6)
          .map(
            (item) => `<a class="ig-tile" href="${item.permalink}" target="_blank" rel="noopener noreferrer">
              <img src="${item.thumbnail_url || item.media_url}" alt="Instagram post" loading="lazy" width="400" height="400" />
              <span class="ig-tile__badge mono small">@d_mak_music</span>
            </a>`
          )
          .join('');
        const note = igWall.parentElement.querySelector('.muted.small');
        if (note) note.textContent = 'Live from @d_mak_music via the Instagram Graph API.';
      })
      .catch(() => {});
  }

  trackHit();
})();
