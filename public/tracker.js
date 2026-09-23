(function() {
  'use strict';

  // 1. Locate current script tag and configuration
  var currentScript = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].src && scripts[i].src.indexOf('tracker.js') !== -1) {
        return scripts[i];
      }
    }
    return null;
  })();

  if (!currentScript) return;

  var siteId = currentScript.getAttribute('data-site-id');
  var endpoint = currentScript.getAttribute('data-endpoint');

  if (!endpoint) {
    // Derive endpoint from script source origin or current origin
    try {
      var scriptUrl = new URL(currentScript.src, window.location.href);
      endpoint = scriptUrl.origin + '/api/collect';
    } catch (e) {
      endpoint = '/api/collect';
    }
  }

  if (!siteId) {
    console.warn('[Analytics Tracker] Missing data-site-id on tracker script tag.');
    return;
  }

  // 2. Manage Visitor ID and Session ID
  function getUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function getStorage(type, key) {
    try {
      return window[type].getItem(key);
    } catch (e) {
      return null;
    }
  }

  function setStorage(type, key, value) {
    try {
      window[type].setItem(key, value);
    } catch (e) {}
  }

  var visitorId = getStorage('localStorage', '_va_vid');
  if (!visitorId) {
    visitorId = getUUID();
    setStorage('localStorage', '_va_vid', visitorId);
  }

  var sessionId = getStorage('sessionStorage', '_va_sid');
  if (!sessionId) {
    sessionId = getUUID();
    setStorage('sessionStorage', '_va_sid', sessionId);
  }

  var lastTrackedPath = '';

  // 3. Track Pageview
  function track(customPath) {
    var path = customPath || window.location.pathname || '/';
    if (lastTrackedPath === path) return; // avoid duplicate tracking
    lastTrackedPath = path;

    var payload = {
      site_id: siteId,
      url: window.location.href,
      path: path,
      referrer: document.referrer || '',
      visitor_id: visitorId,
      session_id: sessionId,
      screen_size: window.screen ? window.screen.width + 'x' + window.screen.height : '',
      language: navigator.language || (navigator.languages && navigator.languages[0]) || ''
    };

    var payloadStr = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      var blob = new Blob([payloadStr], { type: 'application/json' });
      navigator.sendBeacon(endpoint, blob);
    } else {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payloadStr,
        keepalive: true
      }).catch(function() {});
    }
  }

  // 4. Initial trigger
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    track();
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      track();
    });
  }

  // 5. SPA History and Navigation Listeners
  var pushState = history.pushState;
  if (pushState) {
    history.pushState = function() {
      pushState.apply(this, arguments);
      setTimeout(function() { track(); }, 50);
    };
  }

  var replaceState = history.replaceState;
  if (replaceState) {
    history.replaceState = function() {
      replaceState.apply(this, arguments);
      setTimeout(function() { track(); }, 50);
    };
  }

  window.addEventListener('popstate', function() {
    track();
  });

  // Expose global for manual event/page triggers if needed
  window.__analytics = {
    track: track,
    siteId: siteId
  };
})();
