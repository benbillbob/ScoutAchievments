// Client-side filtering for the discovery homepage.
// Progressive enhancement only: the page must remain usable without JavaScript.

(() => {
  const catalogEl = document.getElementById('homepage-catalog');
  if (!catalogEl) return;

  /**
   * @typedef {{
   *   slug: string,
   *   title: string,
   *   summary: string,
   *   stream: string,
   *   stage: number | null,
   *   tags: string[]
   * }} ActivityCard
   */

  /** @type {ActivityCard[]} */
  let cards = [];
  const raw = catalogEl.getAttribute('data-cards');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        cards = parsed;
      }
    } catch (_error) {
      // Ignore parsing issues – the server-rendered HTML will remain visible.
    }
  }

  if (!cards.length) return;

  cards.sort((a, b) => a.title.localeCompare(b.title));

  const searchInput = /** @type {HTMLInputElement | null} */ (document.getElementById('homepage-search'));
  const streamButtons = Array.from(document.querySelectorAll('[data-stream-filter]'));
  const resultsContainer = document.getElementById('homepage-results');
  const emptyState = document.getElementById('homepage-empty');

  /** @type {string | null} */
  let activeStream = null;
  let currentQuery = '';

  const normalise = (str) => (str || '').toLowerCase();

  const formatStreamLabel = (stream) =>
    stream
      .split('/')
      .map((segment) => segment.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()))
      .join(' / ');

  const createCardElement = (card) => {
    const article = document.createElement('article');
    article.className = 'template-card';
    article.setAttribute('data-stream', card.stream);
    if (typeof card.stage === 'number') {
      article.setAttribute('data-stage', String(card.stage));
    }

    const header = document.createElement('header');
    header.className = 'card-header';

    const titleEl = document.createElement('h2');
    titleEl.className = 'card-title';
    const link = document.createElement('a');
    link.href = `/content/${card.slug}`;
    link.className = 'card-link';
    link.textContent = card.title;
    titleEl.appendChild(link);

    header.appendChild(titleEl);

    if (typeof card.stage === 'number' && Number.isFinite(card.stage)) {
      const stageBadge = document.createElement('span');
      stageBadge.className = 'card-stage';
      stageBadge.textContent = `Stage ${card.stage}`;
      header.appendChild(stageBadge);
    }

    const summaryEl = document.createElement('p');
    summaryEl.className = 'card-summary';
    summaryEl.textContent = card.summary;

    const metaEl = document.createElement('div');
    metaEl.className = 'card-meta';
    const streamLabel = document.createElement('span');
    streamLabel.className = 'card-stream';
    streamLabel.textContent = formatStreamLabel(card.stream);
    metaEl.appendChild(streamLabel);

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
    article.appendChild(metaEl);
    if (tagsEl.childNodes.length) {
      article.appendChild(tagsEl);
    }

    return article;
  };

  const getVisibleCards = () => {
    const query = normalise(currentQuery);
    return cards.filter((card) => {
      if (activeStream && card.stream !== activeStream) return false;
      if (!query) return true;
      const haystack = `${card.title} ${card.summary} ${card.stream} ${(card.tags || []).join(' ')}`;
      return normalise(haystack).includes(query);
    });
  };

  const renderResults = () => {
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
  };

  const handleStreamClick = (button) => {
    const value = button.getAttribute('data-stream-filter');
    activeStream = value || null;
    for (const btn of streamButtons) {
      const isActive = btn === button;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    }
    resultsContainer?.setAttribute('aria-busy', 'true');
    window.requestAnimationFrame(renderResults);
  };

  if (streamButtons.length) {
    streamButtons.forEach((btn) => {
      btn.addEventListener('click', () => handleStreamClick(btn));
    });
  }

  if (searchInput) {
    let debounceId = 0;
    searchInput.addEventListener('input', () => {
      currentQuery = searchInput.value || '';
      resultsContainer?.setAttribute('aria-busy', 'true');
      window.clearTimeout(debounceId);
      debounceId = window.setTimeout(renderResults, 160);
    });
  }

  renderResults();
})();
