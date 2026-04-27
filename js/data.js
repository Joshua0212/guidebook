/**
 * data.js — Guidebook Data Management (Firestore v10 modular)
 * Exposes async functions for properties and feedback using the
 * modular `firebase-firestore.js` API. All functions ensure `window.db`
 * is available before attempting Firestore operations.
 */

const GuidebookData = (() => {
  const FIRESTORE_SRC = 'https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js';

  function generateId() {
    return 'prop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  }

  function getDefaultProperty() {
    return {
      name: '',
      wifi: { name: '', password: '' },
      address: '',
      checkin: { checkinTime: '3:00 PM', checkoutTime: '11:00 AM', instructions: '' },
      emergency: [],
      houseRules: '',
      amenities: [],
      faqs: [],
      tips: [],
      feedback: [],
      images: []
    };
  }

  /**
   * Wait for window.db to be available. Polls until timeout.
   * @param {number} timeoutMs
   */
  async function waitForDb(timeoutMs = 3000) {
    const start = Date.now();
    while (!window.db) {
      if (Date.now() - start > timeoutMs) throw new Error('Firebase (window.db) not available');
      await new Promise(r => setTimeout(r, 100));
    }
    return window.db;
  }

  async function getAllProperties() {
    try {
      const db = await waitForDb();
      const { collection, getDocs } = await import(FIRESTORE_SRC);
      const col = collection(db, 'properties');
      const snap = await getDocs(col);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error('getAllProperties error:', e);
      return [];
    }
  }

  async function getPropertyById(id) {
    try {
      if (!id) return null;
      const db = await waitForDb();
      const { doc, getDoc } = await import(FIRESTORE_SRC);
      const ref = doc(db, 'properties', id);
      const snap = await getDoc(ref);
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    } catch (e) {
      console.error('getPropertyById error:', e);
      return null;
    }
  }

  async function createProperty(name) {
    try {
      const db = await waitForDb();
      const { collection, doc, setDoc } = await import(FIRESTORE_SRC);
      const col = collection(db, 'properties');
      const ref = doc(col); // auto-id
      const newProp = getDefaultProperty();
      newProp.name = name || 'New Property';
      newProp.createdAt = new Date().toISOString();
      await setDoc(ref, newProp);
      // ensure selected property points to this one
      await setActivePropertyId(ref.id);
      return { id: ref.id, ...newProp };
    } catch (e) {
      console.error('createProperty error:', e);
      throw e;
    }
  }

  async function updateProperty(id, updates) {
    try {
      if (!id) throw new Error('Missing property id');
      const db = await waitForDb();
      const { doc, setDoc, getDoc } = await import(FIRESTORE_SRC);
      const ref = doc(db, 'properties', id);
      await setDoc(ref, { ...updates, updatedAt: new Date().toISOString() }, { merge: true });
      const snap = await getDoc(ref);
      return { id: snap.id, ...snap.data() };
    } catch (e) {
      console.error('updateProperty error:', e);
      throw e;
    }
  }

  async function deleteProperty(id) {
    try {
      if (!id) throw new Error('Missing property id');
      const db = await waitForDb();
      const { doc, deleteDoc, getDocs, collection } = await import(FIRESTORE_SRC);
      await deleteDoc(doc(db, 'properties', id));
      // if deleted property was active, pick another or clear
      const activeId = await getActivePropertyId();
      if (activeId === id) {
        const snaps = await getDocs(collection(db, 'properties'));
        if (snaps.docs.length > 0) {
          await setActivePropertyId(snaps.docs[0].id);
        } else {
          await setActivePropertyId(null);
        }
      }
    } catch (e) {
      console.error('deleteProperty error:', e);
      throw e;
    }
  }

  /* Active property tracking (stored in a small settings doc) */
  async function getActivePropertyId() {
    try {
      const db = await waitForDb();
      const { doc, getDoc } = await import(FIRESTORE_SRC);
      const snap = await getDoc(doc(db, 'settings', 'selectedProperty'));
      return snap && snap.exists() ? snap.data().id : null;
    } catch (e) {
      console.error('getActivePropertyId error:', e);
      return null;
    }
  }

  async function setActivePropertyId(id) {
    try {
      const db = await waitForDb();
      const { doc, setDoc } = await import(FIRESTORE_SRC);
      await setDoc(doc(db, 'settings', 'selectedProperty'), { id: id || null });
    } catch (e) {
      console.error('setActivePropertyId error:', e);
      throw e;
    }
  }

  async function getActiveProperty() {
    try {
      const id = await getActivePropertyId();
      if (id) {
        const prop = await getPropertyById(id);
        if (prop) return prop;
      }
      const all = await getAllProperties();
      if (all.length > 0) {
        await setActivePropertyId(all[0].id);
        return all[0];
      }
      return null;
    } catch (e) {
      console.error('getActiveProperty error:', e);
      return null;
    }
  }

  /* Feedback stored on each property document as `feedback: [{text,date,...}]` */
  async function getFeedback(propertyId) {
    try {
      if (!propertyId) {
        propertyId = await getActivePropertyId();
      }
      const prop = await getPropertyById(propertyId);
      return prop ? (prop.feedback || []) : [];
    } catch (e) {
      console.error('getFeedback error:', e);
      return [];
    }
  }

  async function addFeedback(arg1, arg2) {
    // Support both addFeedback(entry) and addFeedback(propertyId, entry) for backwards compatibility
    try {
      let propertyId;
      let entry;
      if (typeof arg1 === 'object' && arg2 === undefined) {
        entry = arg1;
        propertyId = undefined;
      } else {
        propertyId = arg1;
        entry = arg2;
      }

      if (!propertyId) propertyId = await getActivePropertyId();
      const prop = await getPropertyById(propertyId);
      const feedback = prop ? (prop.feedback || []) : [];
      const newItem = { id: 'fb_' + Date.now(), name: (entry && entry.name) || 'Guest', text: (entry && (entry.text || entry.comment)) || '', date: new Date().toISOString() };
      feedback.unshift(newItem);
      await updateProperty(propertyId, { feedback });
      return feedback;
    } catch (e) {
      console.error('addFeedback error:', e);
      throw e;
    }
  }

  async function clearFeedback(propertyId) {
    try {
      if (!propertyId) propertyId = await getActivePropertyId();
      await updateProperty(propertyId, { feedback: [] });
    } catch (e) {
      console.error('clearFeedback error:', e);
      throw e;
    }
  }

  // Public API
  return {
    waitForDb,
    getAllProperties,
    getPropertyById,
    createProperty,
    updateProperty,
    deleteProperty,
    getDefaultProperty,
    getActivePropertyId,
    setActivePropertyId,
    getActiveProperty,
    getFeedback,
    addFeedback,
    clearFeedback
  };
})();
