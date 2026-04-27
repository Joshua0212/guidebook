/**
 * admin.js — Host Editor Logic
 * Manages the admin dashboard: property editing, image uploads,
 * multi-property support, QR code generation, and feedback management.
 */

const AdminPage = (() => {
  let draft = null;
  let hasChanges = false;

  async function init() {
    await GuidebookUI.initTheme();
    await GuidebookUI.renderNavigation();
    await ensureAtLeastOneProperty();
    await loadPropertySelector();
    await loadDraft();
    renderAllSections();
    bindEvents();
    updateSaveBarState();
  }

  async function ensureAtLeastOneProperty() {
    const properties = await GuidebookData.getProperties();
    if (properties.length === 0) {
      await GuidebookData.createProperty('My Studio');
    }
  }

  async function loadPropertySelector() {
    const select = document.getElementById('propertySelect');
    const properties = await GuidebookData.getProperties();
    const activeId = await GuidebookData.getActivePropertyId();
    select.innerHTML = properties.map(p =>
      `<option value="${p.id}" ${p.id === activeId ? 'selected' : ''}>${GuidebookUI.escapeHtml(p.name) || 'Unnamed Property'}</option>`
    ).join('');
  }

  async function loadDraft() {
    const property = await GuidebookData.getActiveProperty();
    if (property) {
      draft = JSON.parse(JSON.stringify(property));
    } else {
      draft = GuidebookData.getDefaultProperty();
    }
    hasChanges = false;
  }

  function markChanged() {
    hasChanges = true;
    updateSaveBarState();
  }

  function updateSaveBarState() {
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
      // FIX: Button is always enabled so host can save at any time
      saveBtn.disabled = false;
      saveBtn.style.opacity = hasChanges ? '1' : '0.7';
    }
  }

  /* ========== Render Sections ========== */

  function renderAllSections() {
    renderBasicInfo();
    renderWifi();
    renderLocation();
    renderCheckinOut();
    renderEmergencyContacts();
    renderHouseRules();
    renderAmenities();
    renderFaqs();
    renderTips();
    renderImages();
    renderFeedbackAdmin();
  }

  function renderBasicInfo() {
    document.getElementById('propName').value = draft.name || '';
  }

  function renderWifi() {
    document.getElementById('wifiName').value = draft.wifi?.name || '';
    document.getElementById('wifiPassword').value = draft.wifi?.password || '';
  }

  function renderLocation() {
    document.getElementById('address').value = draft.address || '';
  }

  function renderCheckinOut() {
    document.getElementById('checkinTime').value = draft.checkin?.checkinTime || '3:00 PM';
    document.getElementById('checkoutTime').value = draft.checkin?.checkoutTime || '11:00 AM';
    document.getElementById('checkinInstructions').value = draft.checkin?.instructions || '';
  }

  function renderEmergencyContacts() {
    const container = document.getElementById('emergencyList');
    if (!draft.emergency || draft.emergency.length === 0) {
      container.innerHTML = '<p class="form-hint">No emergency contacts added yet.</p>';
      return;
    }

    container.innerHTML = draft.emergency.map((entry, i) => `
      <div class="emergency-entry">
        <button class="remove-btn entry-remove" onclick="AdminPage.removeEmergency(${i})" title="Remove">✕</button>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Name</label>
            <input type="text" class="form-input" value="${GuidebookUI.escapeHtml(entry.name)}"
              onchange="AdminPage.updateEmergency(${i}, 'name', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">Number</label>
            <input type="text" class="form-input" value="${GuidebookUI.escapeHtml(entry.number)}"
              onchange="AdminPage.updateEmergency(${i}, 'number', this.value)">
          </div>
        </div>
      </div>
    `).join('');
  }

  function renderHouseRules() {
    document.getElementById('houseRules').value = draft.houseRules || '';
  }

  function renderAmenities() {
    const container = document.getElementById('amenitiesList');
    if (!draft.amenities || draft.amenities.length === 0) {
      container.innerHTML = '<p class="form-hint">No amenities added yet.</p>';
      return;
    }

    container.innerHTML = draft.amenities.map((item, i) => `
      <div class="list-item">
        <span class="item-text">${GuidebookUI.escapeHtml(item)}</span>
        <button class="remove-btn" onclick="AdminPage.removeAmenity(${i})" title="Remove">✕</button>
      </div>
    `).join('');
  }

  function renderFaqs() {
    const container = document.getElementById('faqList');
    if (!draft.faqs || draft.faqs.length === 0) {
      container.innerHTML = '<p class="form-hint">No FAQs added yet.</p>';
      return;
    }

    container.innerHTML = draft.faqs.map((faq, i) => `
      <div class="faq-entry">
        <button class="remove-btn faq-remove" onclick="AdminPage.removeFaq(${i})" title="Remove">✕</button>
        <div class="form-group">
          <label class="form-label">Question</label>
          <input type="text" class="form-input" value="${GuidebookUI.escapeHtml(faq.question)}"
            onchange="AdminPage.updateFaq(${i}, 'question', this.value)">
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">Answer</label>
          <textarea class="form-textarea" rows="3"
            onchange="AdminPage.updateFaq(${i}, 'answer', this.value)">${GuidebookUI.escapeHtml(faq.answer)}</textarea>
        </div>
      </div>
    `).join('');
  }

  function renderTips() {
    const container = document.getElementById('tipsList');
    if (!draft.tips || draft.tips.length === 0) {
      container.innerHTML = '<p class="form-hint">No tips added yet.</p>';
      return;
    }

    container.innerHTML = draft.tips.map((tip, i) => `
      <div class="list-item">
        <span class="item-text">${GuidebookUI.escapeHtml(tip)}</span>
        <button class="remove-btn" onclick="AdminPage.removeTip(${i})" title="Remove">✕</button>
      </div>
    `).join('');
  }

  function renderImages() {
    const container = document.getElementById('imagePreviewGrid');
    if (!draft.images || draft.images.length === 0) {
      container.innerHTML = '<p class="form-hint">No images uploaded yet.</p>';
      return;
    }

    container.innerHTML = draft.images.map((src, i) => `
      <div class="preview-item">
        <img src="${src}" alt="Property photo ${i + 1}">
        <button class="preview-remove" onclick="AdminPage.removeImage(${i})" title="Remove">✕</button>
      </div>
    `).join('');
  }

  async function renderFeedbackAdmin() {
    const container = document.getElementById('feedbackAdminList');
    const feedback = await GuidebookData.getFeedback();

    if (!feedback || feedback.length === 0) {
      container.innerHTML = '<p class="form-hint">No feedback received yet.</p>';
      return;
    }

    container.innerHTML = feedback.map(fb => `
      <div class="feedback-item">
        <div class="feedback-meta">
          <span class="feedback-name">${GuidebookUI.escapeHtml(fb.name)}</span>
          <span class="feedback-date">${GuidebookUI.formatDate(fb.date)}</span>
        </div>
        <p class="feedback-comment">${GuidebookUI.escapeHtml(fb.comment)}</p>
      </div>
    `).join('');
  }

  /* ========== Event Bindings ========== */

  function bindEvents() {
    // Property selector
    document.getElementById('propertySelect').addEventListener('change', async (e) => {
      if (hasChanges && !confirm('You have unsaved changes. Switch property anyway?')) {
        e.target.value = draft.id;
        return;
      }
      await GuidebookData.setActivePropertyId(e.target.value);
      await loadDraft();
      renderAllSections();
      updateSaveBarState();
    });

    // Add property button
    document.getElementById('addPropertyBtn').addEventListener('click', async () => {
      const name = prompt('Enter property name:');
      if (name && name.trim()) {
        await GuidebookData.createProperty(name.trim());
        await loadPropertySelector();
        await loadDraft();
        renderAllSections();
        GuidebookUI.showToast('Property created!', 'success');
      }
    });

    // Delete property button
    document.getElementById('deletePropertyBtn').addEventListener('click', async () => {
      const properties = await GuidebookData.getProperties();
      if (properties.length <= 1) {
        GuidebookUI.showToast('Cannot delete the last property.', 'error');
        return;
      }
      if (confirm(`Delete "${draft.name}"? This cannot be undone.`)) {
        await GuidebookData.deleteProperty(draft.id);
        await loadPropertySelector();
        await loadDraft();
        renderAllSections();
        GuidebookUI.showToast('Property deleted.', 'info');
      }
    });

    // Basic info change tracking
    bindInputTracking('propName', (val) => { draft.name = val; });
    bindInputTracking('wifiName', (val) => { if (!draft.wifi) draft.wifi = {}; draft.wifi.name = val; });
    bindInputTracking('wifiPassword', (val) => { if (!draft.wifi) draft.wifi = {}; draft.wifi.password = val; });
    bindInputTracking('address', (val) => { draft.address = val; });
    bindInputTracking('checkinTime', (val) => { if (!draft.checkin) draft.checkin = {}; draft.checkin.checkinTime = val; });
    bindInputTracking('checkoutTime', (val) => { if (!draft.checkin) draft.checkin = {}; draft.checkin.checkoutTime = val; });
    bindInputTracking('checkinInstructions', (val) => { if (!draft.checkin) draft.checkin = {}; draft.checkin.instructions = val; });
    bindInputTracking('houseRules', (val) => { draft.houseRules = val; });

    // Add emergency contact
    document.getElementById('addEmergencyBtn').addEventListener('click', () => {
      if (!draft.emergency) draft.emergency = [];
      draft.emergency.push({ name: '', number: '' });
      markChanged();
      renderEmergencyContacts();
    });

    // Add amenity
    document.getElementById('addAmenityBtn').addEventListener('click', () => {
      const input = document.getElementById('newAmenity');
      const val = input.value.trim();
      if (!val) return;
      if (!draft.amenities) draft.amenities = [];
      draft.amenities.push(val);
      input.value = '';
      markChanged();
      renderAmenities();
    });

    document.getElementById('newAmenity').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('addAmenityBtn').click();
      }
    });

    // Add FAQ
    document.getElementById('addFaqBtn').addEventListener('click', () => {
      if (!draft.faqs) draft.faqs = [];
      draft.faqs.push({ question: '', answer: '' });
      markChanged();
      renderFaqs();
    });

    // Add tip
    document.getElementById('addTipBtn').addEventListener('click', () => {
      const input = document.getElementById('newTip');
      const val = input.value.trim();
      if (!val) return;
      if (!draft.tips) draft.tips = [];
      draft.tips.push(val);
      input.value = '';
      markChanged();
      renderTips();
    });

    document.getElementById('newTip').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('addTipBtn').click();
      }
    });

    // Image upload
    const uploadZone = document.getElementById('uploadZone');
    const imageInput = document.getElementById('imageInput');

    uploadZone.addEventListener('click', () => imageInput.click());
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.style.borderColor = 'var(--color-primary)';
      uploadZone.style.background = 'var(--color-primary-light)';
    });
    uploadZone.addEventListener('dragleave', () => {
      uploadZone.style.borderColor = '';
      uploadZone.style.background = '';
    });
    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.style.borderColor = '';
      uploadZone.style.background = '';
      handleFiles(e.dataTransfer.files);
    });
    imageInput.addEventListener('change', (e) => {
      handleFiles(e.target.files);
      e.target.value = '';
    });

    // FIX: Save button — always clickable, reads live values from form before saving
    document.getElementById('saveBtn').addEventListener('click', saveProperty);

    // Preview button
    document.getElementById('previewBtn').addEventListener('click', () => {
      if (hasChanges) {
        if (confirm('Save changes before previewing?')) {
          saveProperty();
        }
      }
      window.open('index.html', '_blank');
    });

    // QR Code button
    document.getElementById('qrBtn').addEventListener('click', showQRModal);

    document.getElementById('qrModalOverlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeQRModal();
    });
    document.getElementById('closeQrModal').addEventListener('click', closeQRModal);

    // Clear feedback
    document.getElementById('clearFeedbackBtn').addEventListener('click', async () => {
      if (confirm('Clear all guest feedback? This cannot be undone.')) {
        await GuidebookData.clearFeedback();
        renderFeedbackAdmin();
        GuidebookUI.showToast('Feedback cleared.', 'info');
      }
    });
  }

  function bindInputTracking(elementId, updateFn) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.addEventListener('input', () => {
      updateFn(el.value);
      markChanged();
    });
  }

  /* ========== CRUD Helpers ========== */

  function updateEmergency(index, field, value) {
    if (draft.emergency && draft.emergency[index]) {
      draft.emergency[index][field] = value;
      markChanged();
    }
  }

  function removeEmergency(index) {
    draft.emergency.splice(index, 1);
    markChanged();
    renderEmergencyContacts();
  }

  function removeAmenity(index) {
    draft.amenities.splice(index, 1);
    markChanged();
    renderAmenities();
  }

  function updateFaq(index, field, value) {
    if (draft.faqs && draft.faqs[index]) {
      draft.faqs[index][field] = value;
      markChanged();
    }
  }

  function removeFaq(index) {
    draft.faqs.splice(index, 1);
    markChanged();
    renderFaqs();
  }

  function removeTip(index) {
    draft.tips.splice(index, 1);
    markChanged();
    renderTips();
  }

  function removeImage(index) {
    draft.images.splice(index, 1);
    markChanged();
    renderImages();
  }

  /* ========== Image Handling ========== */

  function handleFiles(files) {
    if (!draft.images) draft.images = [];

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;

      if (file.size > 2 * 1024 * 1024) {
        GuidebookUI.showToast(`${file.name} is too large (max 2MB).`, 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        resizeImage(e.target.result, 800, (resizedDataUrl) => {
          draft.images.push(resizedDataUrl);
          markChanged();
          renderImages();
        });
      };
      reader.readAsDataURL(file);
    });
  }

  function resizeImage(dataUrl, maxWidth, callback) {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      callback(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.src = dataUrl;
  }

  /* ========== Save ========== */

  async function saveProperty() {
    // FIX: Manually read all current form values into draft before saving
    // This ensures even fields the user didn't trigger 'input' on are captured
    draft.name = document.getElementById('propName').value.trim();
    if (!draft.wifi) draft.wifi = {};
    draft.wifi.name = document.getElementById('wifiName').value.trim();
    draft.wifi.password = document.getElementById('wifiPassword').value.trim();
    draft.address = document.getElementById('address').value.trim();
    if (!draft.checkin) draft.checkin = {};
    draft.checkin.checkinTime = document.getElementById('checkinTime').value.trim();
    draft.checkin.checkoutTime = document.getElementById('checkoutTime').value.trim();
    draft.checkin.instructions = document.getElementById('checkinInstructions').value.trim();
    draft.houseRules = document.getElementById('houseRules').value.trim();

    if (!draft.name) {
      GuidebookUI.showToast('Please enter a property name.', 'error');
      document.getElementById('propName').focus();
      return;
    }

    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.querySelector('.label').textContent = 'Saving…';
    }

    try {
      // FIX: Wait for Firebase db to be ready with a retry loop (up to 3s)
      let attempts = 0;
      while (!window.db && attempts < 30) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
      }

      if (!window.db) {
        GuidebookUI.showToast('Firebase not ready. Please refresh and try again.', 'error');
        return;
      }

      // FIX: Also save directly to Firestore here as a safety net,
      // in case GuidebookData.updateProperty doesn't use Firestore
      const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js");
      await setDoc(doc(window.db, "guidebook", draft.id || "default"), {
        name: draft.name,
        wifi: draft.wifi || {},
        address: draft.address || '',
        checkin: draft.checkin || {},
        houseRules: draft.houseRules || '',
        emergency: draft.emergency || [],
        amenities: draft.amenities || [],
        faqs: draft.faqs || [],
        tips: draft.tips || [],
        updatedAt: new Date().toISOString()
      });

      // Also update via GuidebookData for local state consistency
      try {
        await GuidebookData.updateProperty(draft.id, draft);
      } catch (e) {
        // Non-fatal: Firestore save already succeeded above
      }

      hasChanges = false;
      updateSaveBarState();
      await loadPropertySelector();
      GuidebookUI.showToast('Property saved successfully!', 'success');
      const brandSpan = document.querySelector('.nav-brand span');
      if (brandSpan) brandSpan.textContent = draft.name;

    } catch (e) {
      console.error('Save error:', e);
      GuidebookUI.showToast(e.message || 'Failed to save. Check console for details.', 'error');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.querySelector('.label').textContent = 'Save';
        saveBtn.style.opacity = hasChanges ? '1' : '0.7';
      }
    }
  }

  /* ========== QR Code ========== */

  function showQRModal() {
    const modal = document.getElementById('qrModalOverlay');
    const qrContainer = document.getElementById('qrcode');
    const qrLink = document.getElementById('qrLink');

    const baseUrl = window.location.href.replace(/admin\.html.*$/, '');
    const guestUrl = baseUrl + 'index.html';

    qrContainer.innerHTML = '';
    qrLink.textContent = guestUrl;

    if (typeof QRCode !== 'undefined') {
      new QRCode(qrContainer, {
        text: guestUrl,
        width: 200,
        height: 200,
        colorDark: '#2D2D2D',
        colorLight: '#FFFFFF',
        correctLevel: QRCode.CorrectLevel.M
      });
    } else {
      qrContainer.innerHTML = '<p style="color:var(--color-text-muted);font-size:14px;">QR code library not loaded.<br>Link: ' + GuidebookUI.escapeHtml(guestUrl) + '</p>';
    }

    modal.classList.add('active');
  }

  function closeQRModal() {
    document.getElementById('qrModalOverlay').classList.remove('active');
  }

  return {
    init,
    updateEmergency,
    removeEmergency,
    removeAmenity,
    updateFaq,
    removeFaq,
    removeTip,
    removeImage
  };
})();

document.addEventListener('DOMContentLoaded', AdminPage.init);
