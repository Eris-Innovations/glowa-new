/* =================================================================
   GLOWA theme — global interactivity
   - FAQ accordion
   - Size / variant selector (updates "Size: X" label + price)
   - Quantity stepper (min 1)
   - Wishlist heart toggle
   - Footer newsletter validation
   - Scroll-reveal (IntersectionObserver)
   - Mobile drawer
   - Marquee CSS fallback
   - AJAX add-to-cart
   - Shopify product recommendations API loader (optional)
   ================================================================= */

(function () {
  'use strict';

  const ready = (fn) => {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  };

  /* -------------------------------------------------------------
     1. FAQ accordion
     ------------------------------------------------------------- */
  function initAccordions() {
    document.querySelectorAll('.glowa-accordion').forEach((wrap) => {
      const items = wrap.querySelectorAll('.glowa-accordion__item');
      items.forEach((item) => {
        const trigger = item.querySelector('.glowa-accordion__trigger');
        if (!trigger) return;
        trigger.addEventListener('click', () => {
          const isOpen = item.classList.contains('is-open');
          items.forEach((other) => {
            other.classList.remove('is-open');
            const iconEl = other.querySelector('.glowa-accordion__icon');
            if (iconEl) iconEl.textContent = '+';
            const trg = other.querySelector('.glowa-accordion__trigger');
            if (trg) trg.setAttribute('aria-expanded', 'false');
          });
          if (!isOpen) {
            item.classList.add('is-open');
            const iconEl = item.querySelector('.glowa-accordion__icon');
            if (iconEl) iconEl.textContent = '\u2013';
            trigger.setAttribute('aria-expanded', 'true');
          }
        });
      });
    });
  }

  /* -------------------------------------------------------------
     2. Size selector + variant change (price/avail update)
     ------------------------------------------------------------- */
  function initSizeSelectors() {
    document.querySelectorAll('[data-glowa-size-group]').forEach((group) => {
      const root = group.closest('[data-glowa-product]') || group.closest('.glowa-card') || document;
      const labelEl = root.querySelector('[data-glowa-size-label]');
      const priceEl = root.querySelector('[data-glowa-price]');
      const variantIdInput = root.querySelector('[data-glowa-variant-id]');
      const ctaBtn = root.querySelector('[data-glowa-add-to-cart]');
      const buyBtn = root.querySelector('[data-glowa-buy-now]');

      group.querySelectorAll('.glowa-size-options__button, .glowa-card__size').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          group.querySelectorAll('.glowa-size-options__button, .glowa-card__size').forEach((b) =>
            b.classList.remove('is-active')
          );
          btn.classList.add('is-active');

          const value = btn.dataset.value || btn.textContent.trim();
          if (labelEl) labelEl.textContent = value;

          const newPrice = btn.dataset.price;
          if (priceEl && newPrice) priceEl.textContent = newPrice;

          const newVariantId = btn.dataset.variantId;
          if (variantIdInput && newVariantId) variantIdInput.value = newVariantId;

          const available = btn.dataset.available;
          if (available === 'false') {
            if (ctaBtn) {
              ctaBtn.disabled = true;
              ctaBtn.dataset.originalText = ctaBtn.dataset.originalText || ctaBtn.textContent;
              ctaBtn.textContent = 'Sold out';
            }
            if (buyBtn) buyBtn.disabled = true;
          } else if (available === 'true') {
            if (ctaBtn) {
              ctaBtn.disabled = false;
              if (ctaBtn.dataset.originalText) ctaBtn.textContent = ctaBtn.dataset.originalText;
            }
            if (buyBtn) buyBtn.disabled = false;
          }
        });
      });
    });
  }

  /* -------------------------------------------------------------
     3. Quantity stepper
     ------------------------------------------------------------- */
  function initQuantity() {
    document.querySelectorAll('[data-glowa-qty]').forEach((wrap) => {
      const input = wrap.querySelector('[data-glowa-qty-input]');
      const minus = wrap.querySelector('[data-glowa-qty-minus]');
      const plus = wrap.querySelector('[data-glowa-qty-plus]');
      if (!input) return;

      const clamp = () => {
        let v = parseInt(input.value, 10);
        if (isNaN(v) || v < 1) v = 1;
        input.value = v;
      };
      input.addEventListener('change', clamp);
      input.addEventListener('blur', clamp);

      if (minus) minus.addEventListener('click', () => {
        const v = parseInt(input.value, 10) || 1;
        input.value = Math.max(1, v - 1);
        input.dispatchEvent(new Event('change'));
      });
      if (plus) plus.addEventListener('click', () => {
        const v = parseInt(input.value, 10) || 1;
        input.value = v + 1;
        input.dispatchEvent(new Event('change'));
      });
    });
  }

  /* -------------------------------------------------------------
     4. Wishlist heart toggle (local-only)
     ------------------------------------------------------------- */
  function initWishlist() {
    const KEY = 'glowa:wishlist';
    let saved;
    try { saved = JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch (e) { saved = []; }

    document.querySelectorAll('.glowa-card__wishlist').forEach((btn) => {
      const id = btn.dataset.productId;
      if (id && saved.includes(id)) btn.classList.add('is-active');

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        btn.classList.toggle('is-active');
        if (!id) return;
        if (btn.classList.contains('is-active')) {
          if (!saved.includes(id)) saved.push(id);
        } else {
          saved = saved.filter((x) => x !== id);
        }
        try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) { /* quota / private mode */ }
      });
    });
  }

  /* -------------------------------------------------------------
     5. Newsletter form validation
     ------------------------------------------------------------- */
  function initNewsletter() {
    document.querySelectorAll('.glowa-newsletter-form').forEach((form) => {
      const input = form.querySelector('input[type="email"]');
      const status = form.querySelector('.glowa-newsletter-form__status');
      form.addEventListener('submit', (e) => {
        const value = (input && input.value || '').trim();
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        if (!isValid) {
          e.preventDefault();
          if (status) {
            status.textContent = 'Please enter a valid email address.';
            status.style.color = '#c62828';
          }
          return;
        }
        if (status) {
          status.textContent = 'Thanks! Check your inbox for the 10% off code.';
          status.style.color = 'var(--color-gold)';
        }
      });
    });
  }

  /* -------------------------------------------------------------
     6. Scroll-reveal — fade-in elements with .glowa-reveal
     ------------------------------------------------------------- */
  function initReveal() {
    const els = document.querySelectorAll('.glowa-reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    els.forEach((el) => io.observe(el));
  }

  /* -------------------------------------------------------------
     7. Mobile drawer
     ------------------------------------------------------------- */
  function initDrawer() {
    const drawer = document.querySelector('[data-glowa-drawer]');
    if (!drawer) return;
    const openers = document.querySelectorAll('[data-glowa-drawer-open]');
    const closers = drawer.querySelectorAll('[data-glowa-drawer-close]');

    const open = () => {
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };
    const close = () => {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    openers.forEach((o) => o.addEventListener('click', open));
    closers.forEach((c) => c.addEventListener('click', close));
    drawer.addEventListener('click', (e) => { if (e.target === drawer) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  /* -------------------------------------------------------------
     8. Marquee JS fallback (only if CSS animation unsupported)
     ------------------------------------------------------------- */
  function initMarqueeFallback() {
    const supportsAnim = CSS && CSS.supports && CSS.supports('animation', 'glowa-marquee 1s linear');
    if (supportsAnim) return;
    document.querySelectorAll('.glowa-announcement__track').forEach((track) => {
      let offset = 0;
      const width = track.scrollWidth / 2;
      const tick = () => {
        offset = (offset + 0.5) % width;
        track.style.transform = `translateX(${-offset}px)`;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  /* -------------------------------------------------------------
     9. AJAX add-to-cart
     ------------------------------------------------------------- */
  function initAddToCart() {
    document.querySelectorAll('[data-glowa-product-form]').forEach((form) => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('[data-glowa-add-to-cart]');
        if (!btn || btn.disabled) return;
        const originalText = btn.textContent;
        btn.classList.add('is-loading');
        btn.textContent = 'Adding...';

        const formData = new FormData(form);
        try {
          const res = await fetch((window.routes && window.routes.cart_add_url) || '/cart/add.js', {
            method: 'POST',
            headers: { Accept: 'application/javascript' },
            body: formData
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.description || 'Could not add to cart.');
          }
          btn.textContent = 'Added \u2713';
          updateCartCount();
          window.dispatchEvent(new CustomEvent('glowa:cart:updated'));
          setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('is-loading');
          }, 1600);
        } catch (err) {
          btn.textContent = originalText;
          btn.classList.remove('is-loading');
          alert(err.message || 'Could not add to cart.');
        }
      });
    });
  }

  async function updateCartCount() {
    try {
      const res = await fetch('/cart.js', { headers: { Accept: 'application/json' } });
      const cart = await res.json();
      document.querySelectorAll('[data-glowa-cart-count]').forEach((el) => {
        el.textContent = cart.item_count;
        el.setAttribute('data-count', cart.item_count);
      });
    } catch (e) { /* offline */ }
  }

  /* -------------------------------------------------------------
     10. Buy It Now (full cart + redirect to checkout)
     ------------------------------------------------------------- */
  function initBuyNow() {
    document.querySelectorAll('[data-glowa-buy-now]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const form = btn.closest('[data-glowa-product-form]');
        if (!form) return;
        if (btn.disabled) return;
        const originalText = btn.textContent;
        btn.classList.add('is-loading');
        btn.textContent = 'Processing...';
        const formData = new FormData(form);
        try {
          const res = await fetch((window.routes && window.routes.cart_add_url) || '/cart/add.js', {
            method: 'POST',
            headers: { Accept: 'application/javascript' },
            body: formData
          });
          if (!res.ok) throw new Error('add-to-cart failed');
          window.location.href = '/checkout';
        } catch (err) {
          btn.classList.remove('is-loading');
          btn.textContent = originalText;
          alert('Could not start checkout.');
        }
      });
    });
  }

  /* -------------------------------------------------------------
     11. Bestsellers / New Releases tab switcher
     ------------------------------------------------------------- */
  function initTabs() {
    document.querySelectorAll('[data-glowa-tabs]').forEach((wrap) => {
      const tabs = wrap.querySelectorAll('[data-glowa-tab]');
      const panels = wrap.querySelectorAll('[data-glowa-tab-panel]');
      tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          const target = tab.dataset.glowaTab;
          tabs.forEach((t) => {
            const isActive = t === tab;
            t.classList.toggle('is-active', isActive);
            t.setAttribute('aria-selected', isActive ? 'true' : 'false');
          });
          panels.forEach((p) => {
            const isActive = p.dataset.glowaTabPanel === target;
            p.classList.toggle('is-active', isActive);
            if (isActive) p.removeAttribute('hidden');
            else p.setAttribute('hidden', '');
          });
          window.dispatchEvent(new CustomEvent('glowa:tabs:changed', { detail: { tab: target } }));
        });
      });
    });
  }

  /* -------------------------------------------------------------
     12. Carousel arrows (testimonials)
     ------------------------------------------------------------- */
  function initCarousels() {
    document.querySelectorAll('[data-glowa-carousel]').forEach((wrap) => {
      const track = wrap.querySelector('[data-glowa-carousel-track]');
      const prev = wrap.querySelector('[data-glowa-carousel-prev]');
      const next = wrap.querySelector('[data-glowa-carousel-next]');
      if (!track) return;

      const step = () => {
        const child = track.querySelector(':scope > *');
        if (!child) return track.clientWidth * 0.9;
        const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '0');
        return child.getBoundingClientRect().width + gap;
      };

      const updateButtons = () => {
        const max = track.scrollWidth - track.clientWidth - 1;
        if (prev) prev.disabled = track.scrollLeft <= 0;
        if (next) next.disabled = track.scrollLeft >= max;
      };

      if (prev) prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
      if (next) next.addEventListener('click', () => track.scrollBy({ left:  step(), behavior: 'smooth' }));
      track.addEventListener('scroll', updateButtons, { passive: true });
      window.addEventListener('resize', updateButtons);
      updateButtons();
    });
  }

  /* -------------------------------------------------------------
     13. Shopify product recommendations API loader
         If a [data-glowa-recommendations][data-product-id] element
         exists but is empty, fetch the recommendations API.
     ------------------------------------------------------------- */
  async function initRecommendationsLoader() {
    document.querySelectorAll('[data-glowa-recommendations][data-needs-fetch="true"]').forEach(async (host) => {
      const productId = host.dataset.productId;
      const limit = host.dataset.limit || 4;
      if (!productId) return;
      try {
        const url = `/recommendations/products?section_id=${host.dataset.sectionId || ''}&product_id=${productId}&limit=${limit}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('reco failed');
        const html = await res.text();
        const tmp = document.createElement('div');
        tmp.innerHTML = html.trim();
        const grid = tmp.querySelector('.glowa-recs__grid');
        const target = host.querySelector('.glowa-recs__grid');
        if (grid && target) {
          target.innerHTML = grid.innerHTML;
          initSizeSelectors();
          initWishlist();
          initReveal();
        }
      } catch (e) { /* silent */ }
    });
  }

  /* -------------------------------------------------------------
     Boot
     ------------------------------------------------------------- */
  ready(() => {
    initAccordions();
    initSizeSelectors();
    initQuantity();
    initWishlist();
    initNewsletter();
    initReveal();
    initDrawer();
    initMarqueeFallback();
    initAddToCart();
    initBuyNow();
    initTabs();
    initCarousels();
    initRecommendationsLoader();
  });

  // Re-init when sections are reloaded inside the Shopify theme editor
  document.addEventListener('shopify:section:load', () => {
    initAccordions();
    initSizeSelectors();
    initQuantity();
    initWishlist();
    initNewsletter();
    initReveal();
    initDrawer();
    initAddToCart();
    initBuyNow();
    initTabs();
    initCarousels();
  });
})();
