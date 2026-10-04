import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initializeWebPush } from '../src/lib/webPush.mjs';

function browserFixture(pathname = '/', origin = 'https://satyajaytimes.com') {
  const scripts = [];
  return {
    location: { origin, pathname }, navigator: { serviceWorker: {} }, Notification: {},
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
    await browser.OneSignalDeferred[0]({ init: async (options) => { config = options; } });
    assert.deepEqual(config, { appId: '7ab19ac7-8162-4b4a-af66-4d82a5f53c40' });
  }
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
