/**
 * data.js — Guidebook Data Management Module
 * Handles all localStorage CRUD operations for properties and feedback.
 */

const GuidebookData = (() => {
  // localStorage keys
  const PROPERTIES_KEY = 'guidebook_properties';
  const ACTIVE_KEY = 'guidebook_active_property';
  const FEEDBACK_KEY = 'guidebook_feedback';
  const THEME_KEY = 'guidebook_theme';

  /**
   * Generate a unique ID for new properties
   * @returns {string} Unique identifier
   */
  function generateId() {
    return 'prop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  }

  /**
   * Returns a blank property template with default values
   * @returns {Object} Default property object
   */
  function getDefaultProperty() {
    return {
      id: generateId(),
      name: '',
      wifi: { name: '', password: '' },
      address: '',
      emergency: [],
      checkin: { checkinTime: '3:00 PM', checkoutTime: '11:00 AM', instructions: '' },
      houseRules: '',
      amenities: [],
      faqs: [],
      tips: [],
      images: []
    };
  }

  /* ========== Properties CRUD ========== */

  /**
   * Get all stored properties
   * @returns {Array} Array of property objects
   */
  function getProperties() {
    try {
      const data = localStorage.getItem(PROPERTIES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading properties:', e);
      return [];
    }
  }

  /**
   * Save the entire properties array to localStorage
   * @param {Array} properties - Array of property objects
   */
  function saveProperties(properties) {
    try {
      localStorage.setItem(PROPERTIES_KEY, JSON.stringify(properties));
    } catch (e) {
      console.error('Error saving properties:', e);
      throw new Error('Failed to save. Storage may be full.');
    }
  }

  /**
   * Get the active property ID
   * @returns {string|null} Active property ID
   */
  function getActivePropertyId() {
    return localStorage.getItem(ACTIVE_KEY);
  }

  /**
   * Set the active property ID
   * @param {string} id - Property ID to activate
   */
  function setActivePropertyId(id) {
    localStorage.setItem(ACTIVE_KEY, id);
  }

  /**
   * Get the currently active property object
   * @returns {Object|null} Active property or null
   */
  function getActiveProperty() {
    const properties = getProperties();
    const activeId = getActivePropertyId();

    if (activeId) {
      const found = properties.find(p => p.id === activeId);
      if (found) return found;
    }

    // Fallback to first property if active ID is invalid
    if (properties.length > 0) {
      setActivePropertyId(properties[0].id);
      return properties[0];
    }

    return null;
  }

  /**
   * Get a property by its ID
   * @param {string} id - Property ID
   * @returns {Object|null} Property object or null
   */
  function getPropertyById(id) {
    const properties = getProperties();
    return properties.find(p => p.id === id) || null;
  }

  /**
   * Create a new property and add it to the array
   * @param {string} name - Property name (optional)
   * @returns {Object} The newly created property
   */
  function createProperty(name) {
    const properties = getProperties();
    const newProp = getDefaultProperty();
    newProp.name = name || 'New Property';
    properties.push(newProp);
    saveProperties(properties);
    setActivePropertyId(newProp.id);
    return newProp;
  }

  /**
   * Update an existing property by ID
   * @param {string} id - Property ID
   * @param {Object} updates - Partial property object with updates
   * @returns {Object|null} Updated property or null
   */
  function updateProperty(id, updates) {
    const properties = getProperties();
    const index = properties.findIndex(p => p.id === id);
    if (index === -1) return null;

    properties[index] = { ...properties[index], ...updates, id };
    saveProperties(properties);
    return properties[index];
  }

  /**
   * Delete a property by ID
   * @param {string} id - Property ID to delete
   */
  function deleteProperty(id) {
    let properties = getProperties();
    properties = properties.filter(p => p.id !== id);
    saveProperties(properties);

    // Update active property if the deleted one was active
    if (getActivePropertyId() === id) {
      if (properties.length > 0) {
        setActivePropertyId(properties[0].id);
      } else {
        localStorage.removeItem(ACTIVE_KEY);
      }
    }
  }

  /* ========== Feedback CRUD ========== */

  /**
   * Get all feedback entries
   * @returns {Array} Array of feedback objects
   */
  function getFeedback() {
    try {
      const data = localStorage.getItem(FEEDBACK_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading feedback:', e);
      return [];
    }
  }

  /**
   * Add a new feedback entry
   * @param {Object} entry - Feedback object { name, comment }
   */
  function addFeedback(entry) {
    const feedback = getFeedback();
    feedback.unshift({
      id: 'fb_' + Date.now(),
      name: entry.name || 'Anonymous Guest',
      comment: entry.comment,
      date: new Date().toISOString()
    });
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(feedback));
  }

  /**
   * Clear all feedback entries
   */
  function clearFeedback() {
    localStorage.setItem(FEEDBACK_KEY, '[]');
  }

  /* ========== Theme ========== */

  /**
   * Get the saved theme preference
   * @returns {string} 'light' or 'dark'
   */
  function getTheme() {
    return localStorage.getItem(THEME_KEY) || 'light';
  }

  /**
   * Save theme preference
   * @param {string} theme - 'light' or 'dark'
   */
  function setTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
  }

  // Public API
  return {
    getProperties,
    saveProperties,
    getActivePropertyId,
    setActivePropertyId,
    getActiveProperty,
    getPropertyById,
    createProperty,
    updateProperty,
    deleteProperty,
    getDefaultProperty,
    getFeedback,
    addFeedback,
    clearFeedback,
    getTheme,
    setTheme
  };
})();
