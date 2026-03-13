/**
 * main.js - Shared JavaScript for academic portfolio website
 * No dependencies. All public functions exposed on window object.
 */

/* =========================================================
   1. THEME TOGGLE (Dark / Light Mode)
   ========================================================= */

(function initTheme() {
  const html = document.documentElement;
  const saved = localStorage.getItem('theme');

  if (saved === 'dark') {
    html.setAttribute('data-theme', 'dark');
  }

  function toggleTheme() {
    var isDark = html.getAttribute('data-theme') === 'dark';
    if (isDark) {
      html.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    } else {
      html.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    }
    applyTheme();
  }

  function applyTheme() {
    var isDark = html.getAttribute('data-theme') === 'dark';

    // Update desktop toggle
    var btn = document.getElementById('themeToggle');
    if (btn) {
      var icon = btn.querySelector('.theme-icon');
      if (icon) {
        icon.textContent = isDark ? '\u2600' : '\u263D';
      } else {
        btn.textContent = isDark ? '\u2600' : '\u263D';
      }
      btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    }

    // Update mobile toggle
    var mBtn = document.getElementById('mobileThemeToggle');
    if (mBtn) {
      var mIcon = mBtn.querySelector('.theme-icon');
      if (mIcon) mIcon.textContent = isDark ? '\u2600' : '\u263D';
      mBtn.lastChild.textContent = isDark ? ' Light Mode' : ' Dark Mode';
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyTheme();

    var btn = document.getElementById('themeToggle');
    if (btn) btn.addEventListener('click', toggleTheme);

    var mBtn = document.getElementById('mobileThemeToggle');
    if (mBtn) mBtn.addEventListener('click', toggleTheme);
  });
})();


/* =========================================================
   2. MOBILE NAVIGATION
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {
  var navToggle = document.getElementById('navToggle');
  var mobileMenu = document.getElementById('mobileMenu');

  if (!navToggle) return;

  navToggle.addEventListener('click', function (e) {
    e.stopPropagation();
    navToggle.classList.toggle('open');
    if (mobileMenu) mobileMenu.classList.toggle('open');
  });

  // Close mobile menu when a link is clicked
  if (mobileMenu) {
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navToggle.classList.remove('open');
        mobileMenu.classList.remove('open');
      });
    });
  }

  // Close when clicking outside
  document.addEventListener('click', function (e) {
    if (!mobileMenu) return;
    if (!mobileMenu.contains(e.target) && e.target !== navToggle && !navToggle.contains(e.target)) {
      navToggle.classList.remove('open');
      mobileMenu.classList.remove('open');
    }
  });
});


/* =========================================================
   3. ACTIVE NAVIGATION LINK
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {
  var pathname = window.location.pathname;
  var filename = pathname.split('/').pop().replace('.html', '') || 'index';

  // Mark active in both desktop nav and mobile menu
  document.querySelectorAll('[data-page]').forEach(function (link) {
    if (link.getAttribute('data-page') === filename) {
      link.classList.add('active');
    }
  });
});


/* =========================================================
   4. SCROLL FADE-IN ANIMATION
   ========================================================= */

function initFadeIn(root) {
  var container = root || document;
  var fadeEls = container.querySelectorAll('.fade-in:not(.visible)');
  if (!fadeEls.length) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var el = entry.target;
        var delay = parseInt(el.getAttribute('data-delay') || '0', 10);
        setTimeout(function () {
          el.classList.add('visible');
        }, delay * 100);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.1 });

  fadeEls.forEach(function (el) {
    observer.observe(el);
  });
}

window.initFadeIn = initFadeIn;

document.addEventListener('DOMContentLoaded', function () {
  initFadeIn();
});


/* =========================================================
   5. DATA LOADING UTILITIES
   ========================================================= */

async function loadJSON(path) {
  var res = await fetch(path);
  if (!res.ok) throw new Error('Failed to load ' + path + ': ' + res.status);
  return res.json();
}

window.loadJSON = loadJSON;


/* =========================================================
   6. RESEARCH FILTER (research.html)
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {
  var filterBtns = document.querySelectorAll('.filter-btn');
  if (!filterBtns.length) return;

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var filter = btn.getAttribute('data-filter');

      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');

      document.querySelectorAll('[data-category]').forEach(function (card) {
        if (filter === 'all' || card.getAttribute('data-category') === filter) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });
});


/* =========================================================
   7. PUBLICATION RENDERING (cv.html)
   ========================================================= */

function _highlightAuthor(authors) {
  return authors.replace(/Kim,\s*Y\.C\./g, '<strong>Kim, Y.C.</strong>');
}

function _buildPubMeta(pub) {
  var html = '';
  if (pub.venue)    html += '<span class="pub-venue">' + pub.venue + '</span>';
  if (pub.location) html += '<span class="pub-location">' + pub.location + '</span>';
  if (pub.year)     html += '<span class="pub-year">' + pub.year + '</span>';
  if (pub.index)    html += '<span class="pill pub-index">' + pub.index + '</span>';
  // Support both "impactFactor" (from JSON) and "IF" field names
  var ifValue = pub.impactFactor || pub.IF;
  if (ifValue)      html += '<span class="pill pub-if">IF: ' + ifValue + '</span>';
  if (pub.rank)     html += '<span class="pill pub-rank">Rank: ' + pub.rank + '</span>';
  if (pub.award)    html += '<span class="pill award-pill">' + pub.award + '</span>';
  return html;
}

function renderPubItem(pub) {
  var titleHtml = pub.link
    ? '<a href="' + pub.link + '" class="pub-title" target="_blank" rel="noopener">' + pub.title + '</a>'
    : '<span class="pub-title">' + pub.title + '</span>';

  return (
    '<div class="pub-item fade-in" data-year="' + (pub.year || '') + '">' +
      '<div class="pub-id">' + (pub.id || '') + '</div>' +
      '<div class="pub-body">' +
        titleHtml +
        '<div class="pub-authors">' + _highlightAuthor(pub.authors || '') + '</div>' +
        '<div class="pub-meta">' + _buildPubMeta(pub) + '</div>' +
      '</div>' +
    '</div>'
  );
}

/**
 * Render publications into a container.
 * Accepts either:
 *   - { journals: [...], conferences: [...] }  (renders both)
 *   - { journals: [...] }  (journals only)
 *   - { conferences: [...] }  (conferences only)
 */
function renderPublications(containerId, data) {
  var container = document.getElementById(containerId);
  if (!container) return;

  var html = '';

  if (data.journals && data.journals.length) {
    data.journals.forEach(function (pub) { html += renderPubItem(pub); });
  }

  if (data.conferences && data.conferences.length) {
    data.conferences.forEach(function (pub) { html += renderPubItem(pub); });
  }

  container.innerHTML = html;
  initFadeIn(container);
}

window.renderPublications = renderPublications;


/* =========================================================
   8. RESEARCH CARD RENDERING (research.html)
   ========================================================= */

/**
 * Render research cards.
 * Accepts data with nested categories structure:
 *   { categories: [ { key, label, items: [ { title, description, image, relatedPaper } ] } ] }
 */
function renderResearch(containerId, data) {
  var container = document.getElementById(containerId);
  if (!container) return;

  var html = '';
  var categories = data.categories || data;

  // Handle nested categories structure
  if (Array.isArray(categories)) {
    categories.forEach(function (cat) {
      if (cat.items && Array.isArray(cat.items)) {
        // Nested: each category has items array
        cat.items.forEach(function (item) {
          html += _buildResearchCard(item, cat.key, cat.label);
        });
      } else {
        // Flat: each item is a card
        html += _buildResearchCard(cat, cat.key, cat.label);
      }
    });
  }

  container.innerHTML = html;
  initFadeIn(container);
}

function _buildResearchCard(item, key, label) {
  var imageClass = item.image ? '' : ' no-image';
  var imgStyle = '';
  if (item.image && item.imgAdjust) {
    var adj = item.imgAdjust;
    var ox = (adj.posX != null ? adj.posX : 50);
    var oy = (adj.posY != null ? adj.posY : 50);
    var z = (adj.zoom && adj.zoom !== 100) ? adj.zoom : 100;
    var parts = [];
    parts.push('transform-origin:' + ox + '% ' + oy + '%');
    if (z !== 100) parts.push('transform:scale(' + (z / 100) + ')');
    if (parts.length) imgStyle = ' style="' + parts.join(';') + '"';
  }
  var imageHtml = item.image
    ? '<img src="' + item.image + '" alt="' + (item.title || '').replace(/"/g, '&quot;') + '" loading="lazy"' + imgStyle + ' />'
    : '';

  var footerParts = [];
  if (item.relatedPaper) {
    footerParts.push('<span class="research-card-ref">Related: ' + item.relatedPaper + '</span>');
  }
  if (item.link) {
    footerParts.push('<a href="' + item.link + '" target="_blank" rel="noopener" class="research-card-link">View Paper &rarr;</a>');
  }

  var footerHtml = footerParts.length
    ? '<div class="research-card-footer">' + footerParts.join('') + '</div>'
    : '';

  return (
    '<div class="research-card fade-in" data-category="' + (key || '') + '">' +
      '<div class="research-card-image' + imageClass + '">' + imageHtml + '</div>' +
      '<div class="research-card-body">' +
        '<span class="pill category-' + (key || '') + '">' + (label || '') + '</span>' +
        '<h3 class="research-card-title">' + (item.title || '') + '</h3>' +
        '<p class="research-card-desc">' + (item.description || '') + '</p>' +
        footerHtml +
      '</div>' +
    '</div>'
  );
}

window.renderResearch = renderResearch;


/* =========================================================
   9. AWARDS RENDERING (awards.html)
   ========================================================= */

function _awardRank(title) {
  var t = (title || '').toLowerCase();
  if (t.includes('1st')) return '1st';
  if (t.includes('2nd')) return '2nd';
  if (t.includes('top')) return 'top';
  return 'other';
}

/**
 * Render award cards.
 * Accepts either:
 *   - { competitions: [...] }  (from awards.json)
 *   - [...] (plain array)
 */
function renderAwards(containerId, data) {
  var container = document.getElementById(containerId);
  if (!container) return;

  var items = data.competitions || data;
  if (!Array.isArray(items)) return;

  var html = '';

  items.forEach(function (item) {
    var rank = _awardRank(item.title);

    html += (
      '<div class="award-card fade-in" data-rank="' + rank + '">' +
        '<div class="award-card-accent"></div>' +
        '<div class="award-card-body">' +
          '<div class="award-card-title">' + (item.title || '') + '</div>' +
          '<div class="award-card-event">' + (item.event || '') + '</div>' +
          '<div class="award-card-year">' + (item.year || '') + '</div>' +
        '</div>' +
      '</div>'
    );
  });

  container.innerHTML = html;
  initFadeIn(container);
}

window.renderAwards = renderAwards;


