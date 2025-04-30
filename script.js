  // —— 3D Layout & Rotation with Throttle ——
    const container = document.getElementById('container');
    const pages = Array.from(document.querySelectorAll('.page'));
    let current = 0;
    let lastScroll = 0;
    const delay = 1200; // ms throttle
    let rotating = false;

    function layoutPages() {
      const N = pages.length;
      const theta = 360 / N;
      const radius = (window.innerHeight/2) / Math.tan(Math.PI / N);
      pages.forEach((pg,i) => {
        pg.style.transform = `rotateX(${i*theta}deg) translateZ(${radius}px)`;
      });
      container.style.transform = `translateZ(-${radius}px) rotateX(0deg)`;
      current = 0;
      updateActiveStates();
    }

    function rotateTo(idx) {
      const N = pages.length;
      const angle = - idx * (360 / N);
      const radius = (window.innerHeight/2) / Math.tan(Math.PI / N);
      container.style.transform = `translateZ(-${radius}px) rotateX(${angle}deg)`;
      current = idx;
      updateActiveStates();
    }

    // Update active states for pages and navigation dots
    function updateActiveStates() {
      // Update page active states
      pages.forEach((page, i) => {
        if (i === current) {
          page.classList.add('active');
        } else {
          page.classList.remove('active');
        }
      });

      // Update navigation dots
      document.querySelectorAll('.dot-nav').forEach((dot, i) => {
        if (i === current) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });

      // Update URL hash
      const currentPageId = pages[current].id;
      history.replaceState(null, '', `#${currentPageId}`);

      // Hide/show scroll indicator on first/last page
      const scrollIndicator = document.querySelector('.scroll-indicator');
      if (current === pages.length - 1) {
        scrollIndicator.style.opacity = '0';
      } else {
        scrollIndicator.style.opacity = '0.7';
      }
    }

    // Once the CSS transform finishes, allow another flip:
    container.addEventListener('transitionend', () => {
      rotating = false;
    });

    window.addEventListener('resize', layoutPages);

    // Wheel navigation, only fire when not rotating:
    window.addEventListener('wheel', e => {
      e.preventDefault();                   // stop native scrolling
      if (rotating) return;                 // already animating

      const delta = e.deltaY;
      // ignore tiny trackpad deltas; adjust threshold as needed
      if (Math.abs(delta) < 30) return;

      // determine direction
      const dir = delta < 0 ? 1 : -1;
      const next = current + dir;
      if (next >= 0 && next < pages.length) {
        rotating = true;
        rotateTo(next);
      }
    }, { passive: false });

    // Nav‑link clicks (also honor the rotating flag):
    document.querySelectorAll('.hero-nav a').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        if (rotating) return;
        const target = link.getAttribute('href').slice(1);
        const idx = pages.findIndex(p => p.id === target);
        if (idx >= 0) {
          rotating = true;
          rotateTo(idx);
        }
      });
    });

    // Navigation dots click handler
    document.querySelectorAll('.dot-nav').forEach(dot => {
      dot.addEventListener('click', () => {
        if (rotating) return;
        const idx = parseInt(dot.getAttribute('data-index'));
        if (idx !== current) {
          rotating = true;
          rotateTo(idx);
        }
      });
    });

    // On resize, rebuild the cube
    window.addEventListener('resize', layoutPages);

    // Improved Dot animation
    const dotContainer = document.getElementById('dots');
    const dots = [];
    for (let i = 0; i < 30; i++) {
      const d = document.createElement('div');
      d.className = 'dot';
      const size = 40 + Math.random()*120;
      d.style.width = d.style.height = `${size}px`;
      const r = dotContainer.getBoundingClientRect();
      let x = Math.random()*r.width, y = Math.random()*r.height;
      d.style.left = `${x}px`; d.style.top = `${y}px`;
      d.style.opacity = 0.3 + Math.random() * 0.5;
      dotContainer.appendChild(d);
      dots.push({
        el: d,
        x, y,
        vx: (Math.random()*0.5-0.25),
        vy: (Math.random()*0.5-0.25),
        size
      });
    }

    function animateDots() {
      const r = dotContainer.getBoundingClientRect();
      dots.forEach(dot => {
        dot.x = (dot.x + dot.vx + r.width) % r.width;
        dot.y = (dot.y + dot.vy + r.height) % r.height;
        dot.el.style.left = `${dot.x}px`;
        dot.el.style.top = `${dot.y}px`;

        // Pulse animation
        const scale = 0.8 + Math.sin(Date.now() / 1000 / dot.size * 5) * 0.2;
        dot.el.style.transform = `scale(${scale})`;
      });
      requestAnimationFrame(animateDots);
    }

    // Keyboard navigation
    window.addEventListener('keydown', e => {
      if (rotating) return;

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        const next = current + 1;
        if (next < pages.length) {
          rotating = true;
          rotateTo(next);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        const prev = current - 1;
        if (prev >= 0) {
          rotating = true;
          rotateTo(prev);
        }
      }
    });

    // Touch swipe support
    let touchStartY = 0;
    let touchEndY = 0;

    window.addEventListener('touchstart', e => {
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    window.addEventListener('touchend', e => {
      if (rotating) return;

      touchEndY = e.changedTouches[0].screenY;
      const diff = touchStartY - touchEndY;

      // Minimum swipe distance to trigger page change
      if (Math.abs(diff) < 50) return;

      if (diff > 0) { // Swipe up
        const next = current + 1;
        if (next < pages.length) {
          rotating = true;
          rotateTo(next);
        }
      } else { // Swipe down
        const prev = current - 1;
        if (prev >= 0) {
          rotating = true;
          rotateTo(prev);
        }
      }
    }, { passive: true });

    // Check for hash on load
    window.addEventListener('load', () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        const idx = pages.findIndex(p => p.id === hash);
        if (idx >= 0) {
          current = idx;
          rotateTo(idx);
        }
      }

      // Start animations
      layoutPages();
      animateDots();

      // Fade in the page
      document.body.style.opacity = 0;
      setTimeout(() => {
        document.body.style.transition = 'opacity 1s ease';
        document.body.style.opacity = 1;
      }, 100);
    });