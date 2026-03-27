// FillFaker Popup Logic
const MAX_FREE_USES = 5;

document.addEventListener('DOMContentLoaded', async () => {
  const status = document.getElementById('status');

  // Get paid status from ExtPay (live, not cached)
  let paid = false;
  try {
    const extpay = ExtPay('fillfaker');
    const user = await extpay.getUser();
    paid = user.paid;
    if (paid) {
      await chrome.storage.local.set({ fillfaker_paid: true });
    }
  } catch (_) {
    // ExtPay unavailable — fall back to cached storage
    const stored = await chrome.storage.local.get(['fillfaker_paid']);
    paid = stored.fillfaker_paid || false;
  }

  const stored = await chrome.storage.local.get(['fillfaker_uses', 'fillfaker_only_empty']);
  const uses = stored.fillfaker_uses || 0;
  const onlyEmpty = stored.fillfaker_only_empty || false;

  if (paid) {
    status.innerHTML = '<strong>PRO</strong> \u2014 Unlimited fills';
  } else {
    const remaining = Math.max(0, MAX_FREE_USES - uses);
    status.innerHTML = `Used <strong>${uses}/${MAX_FREE_USES}</strong> free fills \u00B7 ${remaining} remaining`;
  }

  // "Only fill empty" toggle
  const onlyEmptyCheck = document.getElementById('onlyEmptyCheck');
  onlyEmptyCheck.checked = onlyEmpty;
  onlyEmptyCheck.addEventListener('change', async () => {
    await chrome.storage.local.set({ fillfaker_only_empty: onlyEmptyCheck.checked });
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'setOnlyEmpty', value: onlyEmptyCheck.checked
      }).catch(() => {});
    }
  });

  // Send action to content script
  async function sendAction(action) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      status.innerHTML = '<span style="color:#ff6b6b">Cannot fill on this page</span>';
      return;
    }
    try {
      await chrome.tabs.sendMessage(tab.id, { action });
      window.close();
    } catch (e) {
      status.innerHTML = '<span style="color:#ff6b6b">Cannot fill on this page</span>';
    }
  }

  document.getElementById('fillBtn').addEventListener('click', () => sendAction('fill'));
  document.getElementById('fillFormBtn').addEventListener('click', () => sendAction('fillForm'));
  document.getElementById('regenBtn').addEventListener('click', () => sendAction('regenerate'));
  document.getElementById('clearBtn').addEventListener('click', () => sendAction('clear'));
});
