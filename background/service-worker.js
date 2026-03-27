// FillFaker Service Worker

// ── Context menus ───────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'fillfaker-parent',
    title: 'FillFaker',
    contexts: ['editable']
  });

  const items = [
    { id: 'fill-name',     title: 'Fill Fake Name' },
    { id: 'fill-email',    title: 'Fill Fake Email' },
    { id: 'fill-phone',    title: 'Fill Fake Phone' },
    { id: 'fill-address',  title: 'Fill Fake Address' },
    { id: 'fill-password', title: 'Fill Strong Password' },
    { id: 'fill-text',     title: 'Fill Random Text' },
    { id: 'fill-number',   title: 'Fill Random Number' },
  ];

  for (const item of items) {
    chrome.contextMenus.create({
      id: item.id,
      parentId: 'fillfaker-parent',
      title: item.title,
      contexts: ['editable']
    });
  }
});

// ── Context menu click handler ──────────────────────────────────────────
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const typeMap = {
    'fill-name':     'fullName',
    'fill-email':    'email',
    'fill-phone':    'phone',
    'fill-address':  'address',
    'fill-password': 'password',
    'fill-text':     'bio',
    'fill-number':   'number',
  };

  const fieldType = typeMap[info.menuItemId];
  if (fieldType && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { action: 'fillSingle', fieldType });
  }
});

// ── Keyboard shortcuts ─────────────────────────────────────────────────
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  const actionMap = {
    'fill-all':   'fill',
    'fill-form':  'fillForm',
    'regenerate': 'regenerate',
    'clear-all':  'clear'
  };

  const action = actionMap[command];
  if (action) {
    chrome.tabs.sendMessage(tab.id, { action });
  }
});

// ── Badge updates ───────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'updateBadge') {
    chrome.action.setBadgeText({ text: `${msg.count}` });
    chrome.action.setBadgeBackgroundColor({ color: '#4ecdc4' });
    setTimeout(() => chrome.action.setBadgeText({ text: '' }), 3000);
  }
  return false; // sync, no response needed
});
