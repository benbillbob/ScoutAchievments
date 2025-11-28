// Client-side search and filter functionality
(function () {
  let allEntries = [];
  let filteredEntries = [];
  let activeFilters = {
    stream: null,
    stage: null,
    search: '',
  };

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', async () => {
    await loadCatalog();
    setupEventListeners();
  });

  // Load catalog from API
  async function loadCatalog() {
    try {
      const response = await fetch('/api/catalog/index.json');
      if (!response.ok) {
        throw new Error('Failed to load catalog');
      }

      const data = await response.json();
      allEntries = data.entries || [];
      filteredEntries = [...allEntries];

      document.getElementById('catalog-loading').style.display = 'none';
      document.getElementById('catalog-content').style.display = 'block';

      renderStreamFilters();
      renderTemplates();
    } catch (error) {
      console.error('Error loading catalog:', error);
      document.getElementById('catalog-loading').style.display = 'none';
      document.getElementById('catalog-error').style.display = 'block';
    }
  }

  // Setup event listeners
  function setupEventListeners() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', handleSearch);
  }

  // Handle search input
  function handleSearch(event) {
    activeFilters.search = event.target.value.toLowerCase();
    applyFilters();
  }

  // Handle stream filter
  function handleStreamFilter(stream) {
    activeFilters.stream = stream === 'all' ? null : stream;
    applyFilters();
    updateFilterButtons();
  }

  // Apply all active filters
  function applyFilters() {
    filteredEntries = allEntries.filter((entry) => {
      // Apply search filter
      if (activeFilters.search) {
        const searchMatch =
          entry.displayTitle.toLowerCase().includes(activeFilters.search) ||
          entry.stream.toLowerCase().includes(activeFilters.search) ||
          entry.summary.toLowerCase().includes(activeFilters.search) ||
          entry.tags.some((tag) => tag.toLowerCase().includes(activeFilters.search));

        if (!searchMatch) return false;
      }

      // Apply stream filter
      if (activeFilters.stream && entry.stream !== activeFilters.stream) {
        return false;
      }

      // Apply stage filter
      if (activeFilters.stage && entry.stage !== activeFilters.stage) {
        return false;
      }

      return true;
    });

    renderTemplates();
    updateFilterChips();
  }

  // Render stream filter buttons
  function renderStreamFilters() {
    const streams = [...new Set(allEntries.map((e) => e.stream))].sort();
    const container = document.querySelector('.stream-filters');

    streams.forEach((stream) => {
      const button = document.createElement('button');
      button.className = 'filter-btn';
      button.dataset.filter = stream;
      button.textContent = stream.charAt(0).toUpperCase() + stream.slice(1);
      button.addEventListener('click', () => handleStreamFilter(stream));
      container.appendChild(button);
    });

    // Setup "All" button
    const allBtn = container.querySelector('[data-filter="all"]');
    allBtn.addEventListener('click', () => handleStreamFilter('all'));
  }

  // Update filter button states
  function updateFilterButtons() {
    document.querySelectorAll('.filter-btn').forEach((btn) => {
      const filter = btn.dataset.filter;
      if (filter === 'all' && !activeFilters.stream) {
        btn.classList.add('active');
      } else if (filter === activeFilters.stream) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Update filter chips
  function updateFilterChips() {
    const container = document.getElementById('filter-chips');
    container.innerHTML = '';

    if (activeFilters.stream) {
      const chip = createFilterChip('Stream', activeFilters.stream, () => {
        activeFilters.stream = null;
        applyFilters();
        updateFilterButtons();
      });
      container.appendChild(chip);
    }

    if (activeFilters.search) {
      const chip = createFilterChip('Search', activeFilters.search, () => {
        activeFilters.search = '';
        document.getElementById('search-input').value = '';
        applyFilters();
      });
      container.appendChild(chip);
    }
  }

  // Create a filter chip element
  function createFilterChip(label, value, onRemove) {
    const chip = document.createElement('div');
    chip.className = 'filter-chip';
    chip.innerHTML = `
      <span class="chip-label">${label}:</span>
      <span class="chip-value">${value}</span>
      <button class="chip-remove" aria-label="Remove ${label} filter">×</button>
    `;
    chip.querySelector('.chip-remove').addEventListener('click', onRemove);
    return chip;
  }

  // Render templates list
  function renderTemplates() {
    const container = document.getElementById('templates-list');
    container.innerHTML = '';

    if (filteredEntries.length === 0) {
      container.innerHTML = '<p class="no-results">No templates match your filters.</p>';
      return;
    }

    // Group by stream
    const grouped = {};
    filteredEntries.forEach((entry) => {
      if (!grouped[entry.stream]) {
        grouped[entry.stream] = [];
      }
      grouped[entry.stream].push(entry);
    });

    // Render each stream group
    Object.keys(grouped)
      .sort()
      .forEach((stream) => {
        const section = document.createElement('section');
        section.className = 'stream-section';

        const heading = document.createElement('h2');
        heading.textContent = stream.charAt(0).toUpperCase() + stream.slice(1);
        section.appendChild(heading);

        const list = document.createElement('div');
        list.className = 'template-cards';

        grouped[stream]
          .sort((a, b) => a.stage - b.stage)
          .forEach((entry) => {
            const card = createTemplateCard(entry);
            list.appendChild(card);
          });

        section.appendChild(list);
        container.appendChild(section);
      });
  }

  // Create a template card element
  function createTemplateCard(entry) {
    const card = document.createElement('article');
    card.className = 'template-card';
    card.innerHTML = `
      <div class="card-header">
        <h3 class="card-title">${entry.displayTitle}</h3>
        <span class="card-stage">Stage ${entry.stage}</span>
      </div>
      <p class="card-summary">${entry.summary}</p>
      <a href="${entry.route}" class="card-link">View Template →</a>
    `;
    return card;
  }
})();
