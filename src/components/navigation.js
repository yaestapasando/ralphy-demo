/**
 * Navigation Component
 *
 * Manages the main navigation bar with tabs for switching between views (Test and History).
 * Handles view switching, active state management, and accessibility.
 */

/**
 * Creates and manages the navigation component
 * @param {HTMLElement} container - The container element for the navigation
 * @param {Object} options - Configuration options
 * @param {Function} options.onViewChange - Callback function when view changes
 * @param {string} options.initialView - Initial active view ('test' or 'history')
 * @returns {Object} Navigation component instance
 */
export function createNavigation(container, options = {}) {
  const {
    onViewChange = () => {},
    initialView = 'test'
  } = options;

  let currentView = initialView;

  /**
   * Creates the navigation HTML structure
   */
  function render() {
    container.innerHTML = `
      <nav class="app-nav" role="navigation" aria-label="Navegación principal">
        <div class="app-nav__container">
          <div class="app-nav__brand">
            <span class="app-nav__icon" aria-hidden="true">🚀</span>
            <h1 class="app-nav__title">Test de Velocidad</h1>
          </div>

          <div class="app-nav__menu">
            <ul class="app-nav__tabs" role="tablist">
              <li role="presentation">
                <button
                  class="app-nav__tab-button ${currentView === 'test' ? 'app-nav__tab-button--active' : ''}"
                  role="tab"
                  aria-selected="${currentView === 'test'}"
                  aria-controls="test-view"
                  id="test-tab"
                  data-view="test"
                >
                  <span class="app-nav__tab-icon" aria-hidden="true">📊</span>
                  <span>Test</span>
                </button>
              </li>
              <li role="presentation">
                <button
                  class="app-nav__tab-button ${currentView === 'history' ? 'app-nav__tab-button--active' : ''}"
                  role="tab"
                  aria-selected="${currentView === 'history'}"
                  aria-controls="history-view"
                  id="history-tab"
                  data-view="history"
                >
                  <span class="app-nav__tab-icon" aria-hidden="true">📜</span>
                  <span>Histórico</span>
                </button>
              </li>
            </ul>

            <div class="app-nav__connection" id="connection-indicator-container"></div>
          </div>
        </div>
      </nav>
    `;

    attachEventListeners();
  }

  /**
   * Attaches event listeners to navigation buttons
   */
  function attachEventListeners() {
    const tabButtons = container.querySelectorAll('[data-view]');

    tabButtons.forEach(button => {
      button.addEventListener('click', handleTabClick);
    });

    // Handle keyboard navigation
    const tabList = container.querySelector('[role="tablist"]');
    if (tabList) {
      tabList.addEventListener('keydown', handleKeyboardNavigation);
    }
  }

  /**
   * Handles tab button clicks
   * @param {Event} event - Click event
   */
  function handleTabClick(event) {
    const button = event.currentTarget;
    const view = button.dataset.view;

    if (view && view !== currentView) {
      switchView(view);
    }
  }

  /**
   * Handles keyboard navigation (arrow keys)
   * @param {KeyboardEvent} event - Keyboard event
   */
  function handleKeyboardNavigation(event) {
    const tabs = Array.from(container.querySelectorAll('[role="tab"]'));
    const currentIndex = tabs.findIndex(tab => tab.getAttribute('aria-selected') === 'true');

    let nextIndex;

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    if (nextIndex !== currentIndex) {
      tabs[nextIndex].focus();
      tabs[nextIndex].click();
    }
  }

  /**
   * Switches to a different view
   * @param {string} view - The view to switch to ('test' or 'history')
   */
  function switchView(view) {
    if (view === currentView) return;

    const previousView = currentView;
    currentView = view;

    // Update tab buttons
    updateTabButtons();

    // Notify listeners
    onViewChange(view, previousView);

    // Update URL hash for deep linking (optional but good UX)
    if (window.history.pushState) {
      window.history.pushState(null, '', `#${view}`);
    } else {
      window.location.hash = view;
    }
  }

  /**
   * Updates the active state of tab buttons
   */
  function updateTabButtons() {
    const tabs = container.querySelectorAll('[role="tab"]');

    tabs.forEach(tab => {
      const view = tab.dataset.view;
      const isActive = view === currentView;

      tab.classList.toggle('app-nav__tab-button--active', isActive);
      tab.setAttribute('aria-selected', isActive);

      // Update tabindex for keyboard navigation
      tab.setAttribute('tabindex', isActive ? '0' : '-1');
    });
  }

  /**
   * Gets the current active view
   * @returns {string} The current view name
   */
  function getCurrentView() {
    return currentView;
  }

  /**
   * Sets the active view programmatically
   * @param {string} view - The view to set as active
   */
  function setView(view) {
    if (view === 'test' || view === 'history') {
      switchView(view);
    }
  }

  /**
   * Destroys the navigation component and cleans up
   */
  function destroy() {
    const tabButtons = container.querySelectorAll('[data-view]');
    tabButtons.forEach(button => {
      button.removeEventListener('click', handleTabClick);
    });

    const tabList = container.querySelector('[role="tablist"]');
    if (tabList) {
      tabList.removeEventListener('keydown', handleKeyboardNavigation);
    }

    container.innerHTML = '';
  }

  // Initialize
  render();
  updateTabButtons(); // Set initial tabindex attributes

  // Return public API
  return {
    getCurrentView,
    setView,
    destroy
  };
}
