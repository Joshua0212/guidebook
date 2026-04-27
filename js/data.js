/**
 * data.js — Guidebook Data Management Module
 * Handles all Firestore CRUD operations for properties and feedback.
 */

const GuidebookData = (() => {
  // Firestore collection and doc names
  const GUIDEBOOK_DOC = 'guidebook';
  const PROPERTIES_KEY = 'properties';
  const ACTIVE_KEY = 'active_property';
  const FEEDBACK_KEY = 'feedback';
  const THEME_KEY = 'theme';

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
  async function getProperties() {
    try {
      if (!window.db) {
        console.warn('getProperties: Firebase not initialized (window.db is falsy)');
        return [];
      }
      const { getDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js');
      const ref = doc(window.db, GUIDEBOOK_DOC, PROPERTIES_KEY);
      const snap = await getDoc(ref);
      return snap && snap.exists() ? snap.data().properties || [] : [];
    } catch (e) {
      console.error('Error reading properties:', e);
      return [];
    }
  }

  /**
   * Save the entire properties array to localStorage
   * @param {Array} properties - Array of property objects
   */
  async function saveProperties(properties) {
    try {
      if (!window.db) throw new Error('Firebase not initialized');
      const { setDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js');
      const ref = doc(window.db, GUIDEBOOK_DOC, PROPERTIES_KEY);
      await setDoc(ref, { properties });
    } catch (e) {
      console.error('Error saving properties:', e);
      throw new Error('Failed to save.');
    }
  }

  /**
   * Get the active property ID
   * @returns {string|null} Active property ID
   */
  async function getActivePropertyId() {
    try {
      if (!window.db) {
        console.warn('getActivePropertyId: Firebase not initialized (window.db is falsy)');
        return null;
      }
      const { getDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js');
      const snap = await getDoc(doc(window.db, GUIDEBOOK_DOC, ACTIVE_KEY));
      return snap && snap.exists() ? snap.data().id : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Set the active property ID
   * @param {string} id - Property ID to activate
   */
  async function setActivePropertyId(id) {
    if (!window.db) throw new Error('Firebase not initialized');
    const { setDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js');
    await setDoc(doc(window.db, GUIDEBOOK_DOC, ACTIVE_KEY), { id });
  }

  /**
   * Get the currently active property object
   * @returns {Object|null} Active property or null
   */
  async function getActiveProperty() {
    const properties = await getProperties();
    const activeId = await getActivePropertyId();
    if (activeId) {
      const found = properties.find(p => p.id === activeId);
      if (found) return found;
    }
    if (properties.length > 0) {
      await setActivePropertyId(properties[0].id);
      return properties[0];
    }
    return null;
  }

  /**
   * Get a property by its ID
   * @param {string} id - Property ID
   * @returns {Object|null} Property object or null
   */
  async function getPropertyById(id) {
    const properties = await getProperties();
    return properties.find(p => p.id === id) || null;
  }

  /**
   * Create a new property and add it to the array
   * @param {string} name - Property name (optional)
   * @returns {Object} The newly created property
   */
  async function createProperty(name) {
    const properties = await getProperties();
    const newProp = getDefaultProperty();
    newProp.name = name || 'New Property';
    properties.push(newProp);
    await saveProperties(properties);
    await setActivePropertyId(newProp.id);
    return newProp;
  }

  /**
   * Update an existing property by ID
   * @param {string} id - Property ID
   * @param {Object} updates - Partial property object with updates
   * @returns {Object|null} Updated property or null
   */
  async function updateProperty(id, updates) {
    const properties = await getProperties();
    const index = properties.findIndex(p => p.id === id);
    if (index === -1) return null;
    properties[index] = { ...properties[index], ...updates, id };
    await saveProperties(properties);
    return properties[index];
  }

  /**
   * Delete a property by ID
   * @param {string} id - Property ID to delete
   */
  async function deleteProperty(id) {
    let properties = await getProperties();
    properties = properties.filter(p => p.id !== id);
    await saveProperties(properties);
    const activeId = await getActivePropertyId();
    if (activeId === id) {
      if (properties.length > 0) {
        await setActivePropertyId(properties[0].id);
      } else {
        const { setDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js');
        await setDoc(doc(window.db, GUIDEBOOK_DOC, ACTIVE_KEY), { id: null });
      }
    }
  }

  /* ========== Feedback CRUD ========== */

  /**
   * Get all feedback entries
   * @returns {Array} Array of feedback objects
   */
  async function getFeedback() {
    try {
      if (!window.db) {
        console.warn('getFeedback: Firebase not initialized (window.db is falsy)');
        return [];
      }
      const { getDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js');
      const snap = await getDoc(doc(window.db, GUIDEBOOK_DOC, FEEDBACK_KEY));
      return snap && snap.exists() ? snap.data().feedback || [] : [];
    } catch (e) {
      console.error('Error reading feedback:', e);
      return [];
    }
  }

  /**
   * Add a new feedback entry
   * @param {Object} entry - Feedback object { name, comment }
   */
  async function addFeedback(entry) {
    const feedback = await getFeedback();
    feedback.unshift({
      id: 'fb_' + Date.now(),
      name: entry.name || 'Anonymous Guest',
      comment: entry.comment,
      date: new Date().toISOString()
    });
    if (!window.db) throw new Error('Firebase not initialized');
    const { setDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js');
    await setDoc(doc(window.db, GUIDEBOOK_DOC, FEEDBACK_KEY), { feedback });
  }

  /**
   * Clear all feedback entries
   */
  async function clearFeedback() {
    if (!window.db) throw new Error('Firebase not initialized');
    const { setDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js');
    await setDoc(doc(window.db, GUIDEBOOK_DOC, FEEDBACK_KEY), { feedback: [] });
  }

  /* ========== Theme ========== */

  /**
   * Get the saved theme preference
   * @returns {string} 'light' or 'dark'
   */
  async function getTheme() {
    try {
      if (!window.db) {
        console.warn('getTheme: Firebase not initialized (window.db is falsy)');
        return 'light';
      }
      const { getDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js');
      const snap = await getDoc(doc(window.db, GUIDEBOOK_DOC, THEME_KEY));
      return snap && snap.exists() ? snap.data().theme : 'light';
    } catch {
      return 'light';
    }
  }

  /**
   * Save theme preference
   * @param {string} theme - 'light' or 'dark'
   */
  async function setTheme(theme) {
    if (!window.db) throw new Error('Firebase not initialized');
    const { setDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js');
    await setDoc(doc(window.db, GUIDEBOOK_DOC, THEME_KEY), { theme });
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
