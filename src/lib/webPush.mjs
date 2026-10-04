export async function requestNativePushPermission(OneSignal, browser = window) {
  if (browser.Notification.permission !== 'default'
    || !OneSignal.Notifications.isPushSupported()
    || /^\/(admin|login)(\/|$)/.test(browser.location.pathname)) return;

  // Respect dismissal: do not ask again on every article or reload in this tab.
  const key = 'sjt_native_push_requested';
  try {
    if (browser.sessionStorage.getItem(key)) return;
    browser.sessionStorage.setItem(key, '1');
  } catch {
    // Storage can be unavailable; initialization still limits this to once per load.
  }
  await OneSignal.Notifications.requestPermission();
}

export function initializeWebPush(browser = window, document = browser.document) {
  // Keep production subscriptions out of previews, local development and admin pages.
  if (browser.location.origin !== 'https://satyajaytimes.com'
    || /^\/(admin|login)(\/|$)/.test(browser.location.pathname)
    || !('serviceWorker' in browser.navigator)
    || !('Notification' in browser)
    || document.getElementById('sjt-onesignal-sdk')) return;

  browser.OneSignalDeferred = browser.OneSignalDeferred || [];
  browser.OneSignalDeferred.push(async (OneSignal) => {
    try {
      await OneSignal.init({ appId: '7ab19ac7-8162-4b4a-af66-4d82a5f53c40' });
      await requestNativePushPermission(OneSignal, browser);
    } catch (error) {
      console.warn('News notifications could not initialize.', error);
    }
  });

  const script = document.createElement('script');
  script.id = 'sjt-onesignal-sdk';
  script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
  script.defer = true;
  script.onerror = () => console.warn('News notifications are unavailable; the website will continue normally.');
  document.head.appendChild(script);
}
