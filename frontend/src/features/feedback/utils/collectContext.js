/**
 * Detects browser name and version from navigator user agent
 */
function detectBrowser() {
  const ua = navigator.userAgent;
  if (/Edg\/([0-9.]+)/.test(ua)) {
    return `Edge ${RegExp.$1}`;
  }
  if (/Chrome\/([0-9.]+)/.test(ua)) {
    return `Chrome ${RegExp.$1.split('.')[0]}`;
  }
  if (/Firefox\/([0-9.]+)/.test(ua)) {
    return `Firefox ${RegExp.$1}`;
  }
  if (/Safari\/([0-9.]+)/.test(ua) && !/Chrome/.test(ua)) {
    return `Safari ${RegExp.$1}`;
  }
  return 'Modern Browser';
}

/**
 * Detects operating system
 */
function detectOS() {
  const ua = navigator.userAgent;
  if (/Windows NT 10.0/.test(ua)) return 'Windows 10/11';
  if (/Windows NT 6.3/.test(ua)) return 'Windows 8.1';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Mac OS X ([0-9_]+)/.test(ua)) return `macOS ${RegExp.$1.replace(/_/g, '.')}`;
  if (/Android ([0-9.]+)/.test(ua)) return `Android ${RegExp.$1}`;
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Unknown OS';
}

/**
 * Collects safe technical diagnostic context.
 * Strict privacy rule: NEVER collects passwords, tokens, cookies, or form inputs.
 */
export function collectContext() {
  try {
    const context = {
      pageUrl: window.location.href,
      pageTitle: document.title || 'Untitled Page',
      browser: detectBrowser(),
      os: detectOS(),
      screenResolution: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
      viewport: `${window.innerWidth || 0}x${window.innerHeight || 0}`,
      environment: import.meta.env?.MODE || 'production',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      timestamp: new Date().toISOString(),
    };
    return context;
  } catch (err) {
    console.warn('[collectContext] Error gathering environment context:', err);
    return {
      pageUrl: window.location.href || '',
      pageTitle: document.title || '',
      browser: 'Unknown',
      os: 'Unknown',
      timestamp: new Date().toISOString(),
    };
  }
}

export default collectContext;
