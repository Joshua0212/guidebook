/**
 * ui.js — Shared UI Utilities
 * Navigation rendering, dark mode toggle, toast notifications,
 * copy-to-clipboard, and page initialization.
 */

const GuidebookUI = (() => {

  /* ========== Navigation Data ========== */
  const navLinks = [
    { href: 'index.html', icon: '🏠', label: 'Welcome' },
    { href: 'wifi.html', icon: '📶', label: 'WiFi' },
    { href: 'location.html', icon: '📍', label: 'Location' },
    { href: 'checkin.html', icon: '🕐', label: 'Check-in/out' },
    { href: 'houserules.html', icon: '📋', label: 'House Rules' },
    { href: 'amenities.html', icon: '✨', label: 'Amenities' },
    { href: 'emergency.html', icon: '🚨', label: 'Emergency' },
    { href: 'faq.html', icon: '❓', label: 'FAQ' },
    { href: 'tips.html', icon: '💡', label: 'Tips' },
    { href: 'feedback.html', icon: '💬', label: 'Feedback' },
  ];

  const adminLink = { href: 'admin.html', icon: '⚙️', label: 'Host Editor' };

  /**
   * Get the current page filename from the URL
   * @returns {string} Current page filename
   */
  function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
    return page;
  }

  /**
   * Render the top navigation bar and side drawer
   */
  async function renderNavigation() {
    const currentPage = getCurrentPage();
    const property = await GuidebookData.getActiveProperty();
    const brandName = property ? property.name : 'Guidebook';

    // Top Nav
    const topNav = document.createElement('nav');
    topNav.className = 'top-nav';
    topNav.id = 'topNav';
    topNav.innerHTML = `
      <div class="nav-brand">
        <div class="brand-icon">🏡</div>
        <span>${escapeHtml(brandName) || 'Guidebook'}</span>
      </div>
      <div class="nav-actions">
        <button class="nav-btn" id="darkModeToggle" title="Toggle dark mode" aria-label="Toggle dark mode">
          <span id="themeIcon">🌙</span>
        </button>
        <button class="nav-btn" id="menuToggle" title="Open menu" aria-label="Open menu">
          <div class="hamburger-lines">
            <span></span><span></span><span></span>
          </div>
        </button>
      </div>
    `;

    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'drawer-overlay';
    overlay.id = 'drawerOverlay';

    // Side Drawer
    const drawer = document.createElement('aside');
    drawer.className = 'side-drawer';
    drawer.id = 'sideDrawer';

    let linksHtml = navLinks.map(link => `
      <a href="${link.href}" class="${currentPage === link.href ? 'active' : ''}">
        <span class="nav-icon">${link.icon}</span>
        ${link.label}
      </a>
    `).join('');

    linksHtml += `<div class="drawer-divider"></div>`;
    linksHtml += `
  <div class="admin-nav-item" id="adminNavItem" style="margin:2px 0; padding:0 var(--space-md);">
    <div id="adminNavDefault" style="display:flex; align-items:center; gap:var(--space-md); padding:var(--space-md) var(--space-lg); border-radius:var(--radius-md); color:var(--color-text); font-size:var(--font-size-md); cursor:pointer; transition:all var(--transition-fast);"
      onmouseover="this.style.background='var(--color-primary-light)'; this.style.color='var(--color-primary)';"
      onmouseout="this.style.background='transparent'; this.style.color='var(--color-text)';"
      onclick="(function(){
        document.getElementById('adminNavDefault').style.display='none';
        var pw = document.getElementById('adminPwRow');
        pw.style.display='flex';
        pw.querySelector('input').focus();
      })()"
    >
      <span style="width:20px; text-align:center; font-size:18px; flex-shrink:0;">⚙️</span>
      Host Editor
    </div>

    <div id="adminPwRow" style="display:none; align-items:center; border:1.5px solid var(--color-border); border-radius:var(--radius-md); overflow:hidden; background:var(--color-bg); height:48px;">
      <input
        type="password"
        placeholder="Enter password…"
        style="flex:1; border:none; outline:none; padding:0 14px; height:100%; font-size:14px; background:transparent; color:var(--color-text); font-family:var(--font-family); min-width:0;"
        onkeydown="if(event.key==='Escape'){ document.getElementById('adminPwRow').style.display='none'; document.getElementById('adminNavDefault').style.display='flex'; } if(event.key==='Enter'){ document.getElementById('adminSubmitBtn').click(); }"
      />
      <button
        id="adminSubmitBtn"
        style="flex-shrink:0; width:48px; height:100%; border:none; border-left:1.5px solid var(--color-border); background:transparent; cursor:pointer; font-size:26px; font-weight:700; color:var(--color-primary); display:flex; align-items:center; justify-content:center; transition:background 0.2s; line-height:1;"
        onmouseover="this.style.background='var(--color-primary-light)'"
        onmouseout="this.style.background='transparent'"
        onclick="(function(){
          var row = document.getElementById('adminPwRow');
          var input = row.querySelector('input');
          if (input.value === 'CosmosHaven') {
            window.location.href = 'admin.html';
          } else {
            input.value = '';
            input.placeholder = 'Wrong password…';
            row.style.borderColor = 'var(--color-danger)';
            row.style.animation = 'shake 0.35s ease';
            setTimeout(function(){
              row.style.animation = '';
              row.style.borderColor = 'var(--color-border)';
              input.placeholder = 'Enter password…';
            }, 1500);
          }
        })()"
      >→</button>
    </div>
  </div>
`;

    drawer.innerHTML = `
      <div class="drawer-header">
        <h3>Navigation</h3>
      </div>
      <nav class="drawer-nav">
        ${linksHtml}
      </nav>
    `;

    // Insert into DOM
    document.body.prepend(drawer);
    document.body.prepend(overlay);
    document.body.prepend(topNav);

    // Toast container
    if (!document.getElementById('toastContainer')) {
      const toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      toastContainer.id = 'toastContainer';
      document.body.appendChild(toastContainer);
    }

    // Bind events
    bindNavigationEvents();
  }

  /**
   * Setup navigation toggle and overlay events
   */
  function bindNavigationEvents() {
    const menuToggle = document.getElementById('menuToggle');
    const drawer = document.getElementById('sideDrawer');
    const overlay = document.getElementById('drawerOverlay');

    menuToggle.addEventListener('click', () => {
      const isOpen = drawer.classList.contains('active');
      drawer.classList.toggle('active');
      overlay.classList.toggle('active');
      menuToggle.classList.toggle('active');
      menuToggle.setAttribute('aria-label', isOpen ? 'Open menu' : 'Close menu');
    });

    overlay.addEventListener('click', () => {
      drawer.classList.remove('active');
      overlay.classList.remove('active');
      menuToggle.classList.remove('active');
    });

    // Dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    darkModeToggle.addEventListener('click', toggleDarkMode);
  }

  /* ========== Dark Mode ========== */

  /**
   * Initialize the theme from saved preference
   */
  function initTheme() {
    const theme = GuidebookData.getTheme();
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
  }

  /**
   * Toggle between light and dark mode
   */
  function toggleDarkMode() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    GuidebookData.setTheme(next);
    updateThemeIcon(next);
  }

  /**
   * Update the theme toggle icon
   * @param {string} theme - 'light' or 'dark'
   */
  function updateThemeIcon(theme) {
    const icon = document.getElementById('themeIcon');
    if (icon) {
      icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  /* ========== Toast Notifications ========== */

  /**
   * Show a toast notification
   * @param {string} message - Message to display
   * @param {string} type - 'success', 'error', or 'info'
   */
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || ''}</span><span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 3000);
  }

  /* ========== Clipboard ========== */

  /**
   * Copy text to clipboard and show a toast
   * @param {string} text - Text to copy
   * @param {string} label - Label for the toast notification
   */
  function copyToClipboard(text, label = 'Text') {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(`${label} copied to clipboard!`, 'success');
      }).catch(() => {
        fallbackCopy(text, label);
      });
    } else {
      fallbackCopy(text, label);
    }
  }

  /**
   * Fallback copy using textarea method
   */
  function fallbackCopy(text, label) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showToast(`${label} copied to clipboard!`, 'success');
    } catch (e) {
      showToast('Failed to copy', 'error');
    }
    document.body.removeChild(textarea);
  }

  /* ========== Utility Functions ========== */

  /**
   * Escape HTML to prevent XSS
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Format an ISO date string to a readable format
   * @param {string} isoString - ISO date string
   * @returns {string} Formatted date
   */
  function formatDate(isoString) {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  }

  /**
   * Render an empty state message
   * @param {string} icon - Emoji icon
   * @param {string} title - Title text
   * @param {string} description - Description text
   * @returns {string} HTML string
   */
  function renderEmptyState(icon, title, description) {
    return `
      <div class="empty-state">
        <div class="empty-icon">${icon}</div>
        <h3>${title}</h3>
        <p>${description}</p>
      </div>
    `;
  }

  /**
   * Initialize a guest page — renders nav, theme, and loads property data
   * @param {Function} renderFn - Page-specific render function
   */
  async function initGuestPage(renderFn) {
    await initTheme();
    await renderNavigation();
    const property = await GuidebookData.getActiveProperty();
    if (property && renderFn) {
      renderFn(property);
    } else if (renderFn) {
      renderFn(null);
    }
  }

  // Public API
  return {
    renderNavigation,
    initTheme,
    toggleDarkMode,
    showToast,
    copyToClipboard,
    escapeHtml,
    formatDate,
    renderEmptyState,
    initGuestPage,
    getCurrentPage
  };
})();
