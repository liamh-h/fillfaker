/**
 * FillFaker — Main content script
 * One-click fake data form filler with React/Vue/Angular compatibility
 */
(function () {
  'use strict';

  const MAX_FREE_USES = 5;
  const generator = new FakeDataGenerator();
  const extpay = typeof ExtPay !== 'undefined' ? ExtPay('fillfaker') : null;
  let onlyFillEmpty = false;

  // Track which elements we filled (for accurate clearAll)
  const filledElements = new WeakSet();

  // ── Init ──────────────────────────────────────────────────────────────
  async function init() {
    // Register message listener IMMEDIATELY — never block on network
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      // getStatus is async — handle separately and return true to keep channel open
      if (msg.action === 'getStatus') {
        chrome.storage.local.get(['fillfaker_uses', 'fillfaker_paid']).then(s => {
          sendResponse({
            useCount: s.fillfaker_uses || 0,
            isPaid: s.fillfaker_paid || false,
            onlyFillEmpty
          });
        });
        return true;
      }

      // All other actions are sync (fire-and-forget)
      switch (msg.action) {
        case 'fill':        fillAll(); break;
        case 'fillForm':    fillCurrentForm(); break;
        case 'regenerate':  regenerateAndFill(); break;
        case 'clear':       clearAll(); break;
        case 'fillSingle':  fillSingle(msg.fieldType); break;
        case 'setOnlyEmpty':
          onlyFillEmpty = msg.value;
          chrome.storage.local.set({ fillfaker_only_empty: msg.value });
          break;
      }
      sendResponse({ success: true });
      return false;
    });

    // Load settings (non-blocking — listener is already active above)
    const stored = await chrome.storage.local.get(['fillfaker_only_empty']);
    onlyFillEmpty = stored.fillfaker_only_empty || false;

    // Sync ExtPay payment status to local storage (background, non-blocking)
    try {
      if (extpay) {
        const user = await extpay.getUser();
        if (user.paid) {
          await chrome.storage.local.set({ fillfaker_paid: true });
        }
      }
    } catch (_) { /* ExtPay unavailable or network error */ }
  }

  // ── Read latest paywall state from storage (prevents multi-tab bypass) ─
  async function getPaywallState() {
    const stored = await chrome.storage.local.get(['fillfaker_uses', 'fillfaker_paid']);
    return {
      useCount: stored.fillfaker_uses || 0,
      isPaid: stored.fillfaker_paid || false
    };
  }

  async function incrementUseCount() {
    const latest = await chrome.storage.local.get(['fillfaker_uses']);
    const newCount = (latest.fillfaker_uses || 0) + 1;
    await chrome.storage.local.set({ fillfaker_uses: newCount });
  }

  // ── Framework-safe value setter ───────────────────────────────────────
  function setNativeValue(element, value) {
    const nativeInputSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    )?.set;
    const nativeTextareaSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, 'value'
    )?.set;

    if (element.tagName === 'TEXTAREA' && nativeTextareaSetter) {
      nativeTextareaSetter.call(element, value);
    } else if (nativeInputSetter) {
      nativeInputSetter.call(element, value);
    } else {
      element.value = value;
    }
  }

  function setInputValue(element, value) {
    if (element.tagName === 'SELECT') {
      element.value = value;
      element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      return;
    }

    setNativeValue(element, value);

    // Full event chain with composed:true for Shadow DOM compatibility
    element.dispatchEvent(new Event('focus', { bubbles: true, composed: true }));
    element.dispatchEvent(new InputEvent('input', {
      bubbles: true, composed: true, inputType: 'insertText', data: value
    }));
    element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true, composed: true }));
  }

  // Lighter clear — no focus/blur to avoid triggering SPA validation errors
  function clearInputValue(element) {
    if (element.tagName === 'SELECT') {
      element.selectedIndex = 0;
      element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      return;
    }

    setNativeValue(element, '');
    element.dispatchEvent(new InputEvent('input', {
      bubbles: true, composed: true, inputType: 'deleteContentBackward', data: ''
    }));
    element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  // ── Fill logic ────────────────────────────────────────────────────────
  async function fillFields(root = document, skipGenerate = false) {
    const { useCount, isPaid } = await getPaywallState();
    if (!isPaid && useCount >= MAX_FREE_USES) {
      showPaywall(useCount);
      return;
    }

    if (!skipGenerate) generator.generateIdentity();
    const fields = FieldDetector.scanFields(root);

    if (fields.length === 0) {
      showNotification('No form fields found on this page', 'warning');
      return;
    }

    const radioGroups = new Set();
    let filledCount = 0;

    for (const { element, type } of fields) {
      // "Only fill empty" mode
      if (onlyFillEmpty) {
        if (element.tagName === 'SELECT' && element.selectedIndex > 0) continue;
        if (element.type === 'checkbox' && element.checked) continue;
        if (element.type === 'radio' && element.checked) continue;
        if (element.getAttribute('contenteditable') === 'true' &&
            element.innerText.trim() !== '') continue;
        if (element.value && element.value.trim() !== '') continue;
      }

      // contenteditable
      if (element.getAttribute('contenteditable') === 'true') {
        const value = generator.getValueForType(type);
        element.innerText = value;
        element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        highlightField(element);
        filledElements.add(element);
        filledCount++;
        continue;
      }

      // select
      if (element.tagName === 'SELECT') {
        fillSelect(element);
        highlightField(element);
        filledElements.add(element);
        filledCount++;
        continue;
      }

      // checkbox
      if (element.type === 'checkbox') {
        element.checked = Math.random() > 0.5;
        element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        filledElements.add(element);
        filledCount++;
        continue;
      }

      // radio — deduplicate by (form + name) to handle multiple forms with same group name
      if (element.type === 'radio') {
        const formId = element.form ? (element.form.id || element.form.name || 'form') : 'root';
        const groupKey = `${formId}::${element.name}`;
        if (element.name && radioGroups.has(groupKey)) continue;
        if (element.name) radioGroups.add(groupKey);
        fillRadio(element);
        filledElements.add(element);
        filledCount++;
        continue;
      }

      // Standard input / textarea
      const value = generator.getValueForType(type);
      if (value) {
        setInputValue(element, value);
        highlightField(element);
        filledElements.add(element);
        filledCount++;
      }
    }

    // Increment usage counter
    if (!isPaid && filledCount > 0) {
      await incrementUseCount();
    }

    showNotification(`Filled ${filledCount} fields`, 'success');
    try {
      chrome.runtime.sendMessage({ action: 'updateBadge', count: filledCount });
    } catch (_) { /* service worker idle */ }
  }

  function fillAll() {
    fillFields(document);
  }

  // Smarter container detection instead of falling back to entire document
  function fillCurrentForm() {
    const active = document.activeElement;
    if (!active) { fillFields(document); return; }

    const form = active.closest('form');
    if (form) { fillFields(form); return; }

    const container = active.closest(
      'fieldset, [role="form"], section, .form, .form-group'
    );
    if (container) { fillFields(container); return; }

    fillFields(document);
  }

  function regenerateAndFill() {
    clearAll(true);
    generator.regenerate();
    fillFields(document, true);
  }

  function clearAll(silent = false) {
    const fields = FieldDetector.scanFields(document);
    for (const { element } of fields) {
      // Only clear elements we actually filled
      if (!filledElements.has(element)) continue;

      if (element.getAttribute('contenteditable') === 'true') {
        element.innerText = '';
        element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      } else if (element.type === 'checkbox' || element.type === 'radio') {
        element.checked = false;
        element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      } else {
        clearInputValue(element);
      }
    }
    if (!silent) showNotification('Cleared all fields', 'info');
  }

  function fillSelect(element) {
    const options = Array.from(element.options).filter(o => o.value && o.value !== '');
    if (options.length > 0) {
      const chosen = options[Math.floor(Math.random() * options.length)];
      element.value = chosen.value;
      element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    }
  }

  // Use getRootNode() for Shadow DOM radio groups
  function fillRadio(element) {
    if (!element.name) return;
    const root = element.getRootNode();
    const group = root.querySelectorAll(
      `input[type="radio"][name="${CSS.escape(element.name)}"]`
    );
    if (group.length > 0) {
      const chosen = group[Math.floor(Math.random() * group.length)];
      chosen.checked = true;
      chosen.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    }
  }

  // fillSingle checks paywall and increments counter
  async function fillSingle(fieldType) {
    const { useCount, isPaid } = await getPaywallState();
    if (!isPaid && useCount >= MAX_FREE_USES) {
      showPaywall(useCount);
      return;
    }

    const active = document.activeElement;
    if (!active) return;
    if (!generator.currentIdentity) generator.generateIdentity();
    const value = generator.getValueForType(fieldType);

    if (active.getAttribute('contenteditable') === 'true') {
      active.innerText = value;
      active.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    } else if (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') {
      setInputValue(active, value);
    }
    highlightField(active);

    if (!isPaid) {
      await incrementUseCount();
    }
  }

  // ── Visual feedback ───────────────────────────────────────────────────
  function highlightField(element) {
    element.classList.add('fillfaker-filled');
    setTimeout(() => element.classList.remove('fillfaker-filled'), 1500);
  }

  function showNotification(text, type = 'info') {
    const existing = document.querySelector('.fillfaker-notification');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.className = `fillfaker-notification fillfaker-notification-${type}`;
    div.textContent = text;
    document.body.appendChild(div);

    setTimeout(() => {
      div.classList.add('fillfaker-notification-hide');
      setTimeout(() => div.remove(), 300);
    }, 2000);
  }

  // ── Paywall (built imperatively — no innerHTML with user data) ─────────
  function showPaywall(useCount) {
    const existing = document.querySelector('.fillfaker-paywall');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'fillfaker-paywall';

    const box = document.createElement('div');
    box.className = 'fillfaker-paywall-box';

    const closeBtn = document.createElement('div');
    closeBtn.className = 'fillfaker-paywall-close';
    closeBtn.textContent = '\u00D7';
    closeBtn.onclick = () => overlay.remove();

    const icon = document.createElement('div');
    icon.className = 'fillfaker-paywall-icon';
    icon.textContent = '\u26A1';

    const h2 = document.createElement('h2');
    h2.textContent = `You've used FillFaker ${Number(useCount)} times!`;

    const p1 = document.createElement('p');
    p1.textContent = 'Unlock unlimited form filling + multi-language data + custom templates for just ';
    const strong = document.createElement('strong');
    strong.textContent = '$1.99';
    p1.appendChild(strong);
    p1.append(' (one-time).');

    const p2 = document.createElement('p');
    p2.style.cssText = 'color:#888; font-size: 13px;';
    p2.textContent = "That's less than the time you'd spend manually filling 10 forms.";

    const buyBtn = document.createElement('button');
    buyBtn.className = 'fillfaker-paywall-btn';
    buyBtn.textContent = 'Unlock Now \u2014 $1.99';
    buyBtn.onclick = () => {
      try {
        if (extpay) {
          extpay.openPaymentPage();
        } else {
          window.open('https://extensionpay.com/extension/fillfaker', '_blank');
        }
      } catch (_) {
        window.open('https://extensionpay.com/extension/fillfaker', '_blank');
      }
    };

    const laterBtn = document.createElement('button');
    laterBtn.className = 'fillfaker-paywall-later';
    laterBtn.textContent = 'Maybe later';
    laterBtn.onclick = () => overlay.remove();

    box.append(closeBtn, icon, h2, p1, p2, buyBtn, laterBtn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  // ── Start ─────────────────────────────────────────────────────────────
  init();
})();
