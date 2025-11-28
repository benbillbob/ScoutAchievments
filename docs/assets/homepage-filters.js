// Client-side filter + hero/highlight behavior for the discovery homepage.
// Progressive enhancement only: page must be fully usable without JS.

(() => {
  const catalogEl = document.getElementById('homepage-catalog');
  const heroEl = document.getElementById('hero-section');
  if (!catalogEl || !heroEl) return;

  /** @typedef {{ slug:string,title:string,summary:string,stream:string,stage:number,tags:string[],isStaffPick?:boolean,isTrending?:boolean,score?:number,ctaLabel?:string }} HighlightCard */

  /** @type {HighlightCard[]} */
  let cards = [];
  const raw = catalogEl.getAttribute('data-cards');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) cards = parsed;
    } catch (_err) {
      // Ignore; page will keep server-rendered content.
    }
  }

  if (!cards.length) return;

  const searchInput = document.getElementById('homepage-search');
  const streamButtons = Array.from(document.querySelectorAll('[data-stream-filter]'));
  const resultsContainer = document.getElementById('homepage-results');
  const emptyState = document.getElementById('homepage-empty');
  const homepageRoot = document.getElementById('homepage-root');

  /** @type {string|null} */
  let activeStream = null;
  let currentQuery = '';

  function normalise(str) {
    return (str || '').toLowerCase();
  }

  function score(card) {
    let base = typeof card.score === 'number' ? card.score : 0;
    if (card.isStaffPick) base += 10;
    if (card.isTrending) base += 5;
    return base;
  }

  /**
   * Compute filtered + sorted view of cards.
   * Staff picks always come first, then by score desc, then title.
   */
  function getVisibleCards() {
    const q = normalise(currentQuery);
    return cards
      .filter((card) => {
        if (activeStream && card.stream !== activeStream) return false;
        if (!q) return true;
        const haystack = `${card.title} ${card.summary} ${card.stream} ${card.tags.join(' ')}`;
        return normalise(haystack).includes(q);
      })
      .sort((a, b) => {
        // Staff picks first
        if (a.isStaffPick && !b.isStaffPick) return -1;
        if (!a.isStaffPick && b.isStaffPick) return 1;
        // Higher score first
        const diff = score(b) - score(a);
        if (diff !== 0) return diff;
        return a.title.localeCompare(b.title);
      });
  }

  function renderHero(cardsForView) {
    if (!cardsForView.length) return;
    const primary = cardsForView[0];
    const heroTitle = heroEl.querySelector('[data-hero-title]') || heroEl.querySelector('.homepage-hero-main-title');
    const heroSummary = heroEl.querySelector('[data-hero-summary]');
    const heroCta = heroEl.querySelector('[data-hero-cta]');

    if (heroTitle) heroTitle.textContent = primary.title;
    if (heroSummary) heroSummary.textContent = primary.summary;
    if (heroCta instanceof HTMLAnchorElement) {
      heroCta.href = `/content/${primary.slug}`;
      heroCta.setAttribute('data-hero-slug', primary.slug);
      heroCta.textContent = primary.ctaLabel || 'View template';
    }
  }

  function createCardElement(card) {
    const article = document.createElement('article');
    article.className = 'template-card';

    const header = document.createElement('header');
    header.className = 'card-header';

    const titleEl = document.createElement('h2');
    titleEl.className = 'card-title';
    const link = document.createElement('a');
    link.href = `/content/${card.slug}`;
    link.textContent = card.title;
    link.className = 'card-link';
    titleEl.appendChild(link);

    const stageBadge = document.createElement('span');
    stageBadge.className = 'card-stage';
    stageBadge.textContent = `Stage ${card.stage}`;

    header.appendChild(titleEl);
    header.appendChild(stageBadge);

    const summaryEl = document.createElement('p');
    summaryEl.className = 'card-summary';
    summaryEl.textContent = card.summary;

    const tagsEl = document.createElement('div');
    tagsEl.className = 'card-tags';
    for (const tag of card.tags || []) {
      const span = document.createElement('span');
      span.className = 'tag';
      span.textContent = tag;
      tagsEl.appendChild(span);
    }

    article.appendChild(header);
    article.appendChild(summaryEl);
    article.appendChild(tagsEl);
    return article;
  }

  function renderResults() {
    if (!resultsContainer) return;
    const visible = getVisibleCards();

    resultsContainer.innerHTML = '';

    if (!visible.length) {
      if (emptyState) emptyState.hidden = false;
      resultsContainer.setAttribute('aria-busy', 'false');
      return;
    }

    if (emptyState) emptyState.hidden = true;
    const fragment = document.createDocumentFragment();
    for (const card of visible) {
      fragment.appendChild(createCardElement(card));
    }
    resultsContainer.appendChild(fragment);
    resultsContainer.setAttribute('aria-busy', 'false');

    renderHero(visible);
  }

  function postEngagement(_eventType, _targetSlug, _metadata) {
    // Static deployments have no POST endpoint; disable telemetry.
    return;
  }

  function handleStreamClick(button) {
    const value = button.getAttribute('data-stream-filter');
    activeStream = value || null;
    for (const btn of streamButtons) {
      const isActive = btn === button;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    }
    resultsContainer?.setAttribute('aria-busy', 'true');
    window.requestAnimationFrame(() => {
      const before = getVisibleCards();
      renderResults();
      if (before.length) {
        const primary = before[0];
        postEngagement('filter_apply', primary.slug, {
          filter: button.getAttribute('data-stream-filter') || 'all',
        });
      }
    });
  }

  if (streamButtons.length) {
    streamButtons.forEach((btn) => {
      btn.addEventListener('click', () => handleStreamClick(btn));
    });
  }

  if (searchInput instanceof HTMLInputElement) {
    let debounceId = 0;
    searchInput.addEventListener('input', () => {
      currentQuery = searchInput.value || '';
      resultsContainer?.setAttribute('aria-busy', 'true');
      window.clearTimeout(debounceId);
      debounceId = window.setTimeout(() => {
        renderResults();
      }, 200);
    });
  }

  // Initial render based on preloaded data
  renderResults();

  // Hero CTA telemetry
  const heroCta = document.querySelector('[data-hero-cta]');
  if (heroCta instanceof HTMLAnchorElement) {
    heroCta.addEventListener('click', () => {
      const slug = heroCta.getAttribute('data-hero-slug');
      if (slug) {
        postEngagement('hero_click', slug, { location: 'hero', source: 'homepage' });
      }
    });
  }
})();
