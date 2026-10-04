import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initializeWebPush, requestNativePushPermission } from '../src/lib/webPush.mjs';

function browserFixture(pathname = '/', origin = 'https://satyajaytimes.com') {
  const scripts = [];
  const storage = new Map();
  return {
    location: { origin, pathname }, navigator: { serviceWorker: {} }, Notification: { permission: 'default' },
    sessionStorage: { getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    document: {
      getElementById: (id) => scripts.find((script) => script.id === id),
      createElement: () => ({}),
      head: { appendChild: (script) => scripts.push(script) },
    },
    scripts,
  };
}

test('initializes once on homepage and direct article pages with dashboard configuration', async () => {
  for (const path of ['/', '/article/test', '/category/haryana']) {
    const browser = browserFixture(path);
    initializeWebPush(browser);
    initializeWebPush(browser);
    assert.equal(browser.scripts.length, 1);
    assert.equal(browser.OneSignalDeferred.length, 1);
    assert.equal(browser.scripts[0].src, 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js');
    let config;
    let requests = 0;
    await browser.OneSignalDeferred[0]({
      init: async (options) => { config = options; },
      Notifications: { isPushSupported: () => true, requestPermission: async () => { requests++; } },
    });
    assert.equal(requests, 1);
    assert.deepEqual(config, { appId: '7ab19ac7-8162-4b4a-af66-4d82a5f53c40' });
  }
});

test('native requests respect allowed, blocked, unsupported and dismissed states', async () => {
  for (const permission of ['granted', 'denied']) {
    const browser = browserFixture();
    browser.Notification.permission = permission;
    await requestNativePushPermission({ Notifications: { isPushSupported: () => true, requestPermission: () => assert.fail('must not ask') } }, browser);
  }
  const browser = browserFixture();
  let requests = 0;
  const sdk = { Notifications: { isPushSupported: () => false, requestPermission: async () => { requests++; } } };
  await requestNativePushPermission(sdk, browser);
  assert.equal(requests, 0);
  sdk.Notifications.isPushSupported = () => true;
  await requestNativePushPermission(sdk, browser);
  await requestNativePushPermission(sdk, browser);
  assert.equal(requests, 1, 'Dismissal is not followed by repeated prompts');
});

test('storage restrictions do not prevent a native request', async () => {
  const browser = browserFixture();
  browser.sessionStorage.getItem = () => { throw new Error('Storage unavailable'); };
  let requested = false;
  await requestNativePushPermission({ Notifications: { isPushSupported: () => true, requestPermission: async () => { requested = true; } } }, browser);
  assert.equal(requested, true);
});

test('does not load on admin, login, previews, or unsupported browsers', () => {
  const browsers = [browserFixture('/admin'), browserFixture('/login'), browserFixture('/', 'http://localhost:5173'), browserFixture('/', 'https://preview.pages.dev')];
  const unsupported = browserFixture();
  delete unsupported.navigator.serviceWorker;
  browsers.push(unsupported);
  for (const browser of browsers) {
    initializeWebPush(browser);
    assert.equal(browser.scripts.length, 0);
  }
});

test('SDK errors do not break the page', async (t) => {
  const warnings = t.mock.method(console, 'warn', () => {});
  const browser = browserFixture();
  initializeWebPush(browser);
  await browser.OneSignalDeferred[0]({ init: async () => { throw new Error('blocked'); } });
  browser.scripts[0].onerror();
  assert.equal(warnings.mock.callCount(), 2);
});

test('public service worker imports the supplied v16 SDK', () => {
  assert.equal(readFileSync(new URL('../public/OneSignalSDKWorker.js', import.meta.url), 'utf8').trim(),
    'importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");');
});
