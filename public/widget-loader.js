(function () {
  'use strict';

  // Locate this script's own tag so we can read its src and query params.
  // document.currentScript works in all modern browsers; the fallback
  // (last <script> in the DOM at execution time) covers legacy IE.
  var me = document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();

  if (!me) return;

  var fullSrc = me.getAttribute('src') || '';

  // ── Parse query string ────────────────────────────────────────────────────
  var qIndex = fullSrc.indexOf('?');
  var params = {};
  if (qIndex !== -1) {
    fullSrc.substring(qIndex + 1).split('&').forEach(function (pair) {
      var kv = pair.split('=');
      if (kv.length === 2) {
        params[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1]);
      }
    });
  }

  var wid   = params.wid;
  var token = params.token;
  var agent = params.agent;

  if (!wid || !token || !agent) {
    console.warn('[Chataffy] widget-loader: missing required params (wid, token, agent).');
    return;
  }

  // ── Derive base URL from this script's location ──────────────────────────
  // e.g. https://chataffy.com/chataffy/cahtaffy_fe/widget-loader.js?...
  //   -> https://chataffy.com/chataffy/cahtaffy_fe
  var scriptPath = fullSrc.split('?')[0];           // drop query string
  var base = scriptPath.replace(/\/widget-loader\.js$/, '');

  var widgetPageUrl = base + '/openai/widget/' + wid + '/' + token + '/' + agent;
  var widgetOrigin = '';
  try {
    widgetOrigin = new URL(widgetPageUrl, window.location.href).origin;
  } catch (e) {
    widgetOrigin = '';
  }

  // ── Create the iframe ─────────────────────────────────────────────────────
  // Keep the iframe "transparent" to pointer events by default, then
  // temporarily enable it only when the mouse/finger is over widget zones
  // reported by the widget page via postMessage.
  var iframe = document.createElement('iframe');
  iframe.id  = 'chataffy-widget-frame';
  iframe.src = widgetPageUrl;
  iframe.setAttribute('allowtransparency', 'true');
  iframe.setAttribute('frameborder', '0');
  iframe.setAttribute('scrolling', 'no');
  iframe.setAttribute('title', 'Chataffy Chat Widget');
  iframe.style.cssText = [
    'position:fixed',
    'top:0',
    'left:0',
    'width:100%',
    'height:100%',
    'border:none',
    'background:transparent',
    'z-index:2147483647',
    'overflow:hidden',
    'pointer-events:none'
  ].join(';');

  var interactiveZones = [];
  var lastPointerEvents = 'none';
  var lastPointerPosition = null;

  function setIframePointerEvents(value) {
    if (lastPointerEvents === value) return;
    lastPointerEvents = value;
    iframe.style.pointerEvents = value;
  }

  function isInsideZones(x, y) {
    for (var i = 0; i < interactiveZones.length; i++) {
      var z = interactiveZones[i];
      if (x >= z.left && x <= z.right && y >= z.top && y <= z.bottom) {
        return true;
      }
    }
    return false;
  }

  function handlePointerPosition(clientX, clientY) {
    lastPointerPosition = { x: clientX, y: clientY };

    if (!interactiveZones.length) {
      setIframePointerEvents('none');
      return;
    }

    if (isInsideZones(clientX, clientY)) {
      setIframePointerEvents('auto');
    } else {
      setIframePointerEvents('none');
    }
  }

  function onMouseMove(event) {
    handlePointerPosition(event.clientX, event.clientY);
  }

  function onTouchStart(event) {
    if (!event.touches || !event.touches.length) return;
    var touch = event.touches[0];
    handlePointerPosition(touch.clientX, touch.clientY);
  }

  function onTouchMove(event) {
    if (!event.touches || !event.touches.length) return;
    var touch = event.touches[0];
    handlePointerPosition(touch.clientX, touch.clientY);
  }

  window.addEventListener('mousemove', onMouseMove, true);
  window.addEventListener('touchstart', onTouchStart, true);
  window.addEventListener('touchmove', onTouchMove, true);

  window.addEventListener('message', function (event) {
    if (!iframe.contentWindow || event.source !== iframe.contentWindow) return;
    if (widgetOrigin && event.origin !== widgetOrigin) return;

    var payload = event.data || {};
    if (payload.type === 'chataffy-widget-pointer') {
      if (payload.inside === false) {
        setIframePointerEvents('none');
        return;
      }
      if (typeof payload.x === 'number' && typeof payload.y === 'number') {
        handlePointerPosition(payload.x, payload.y);
      }
      return;
    }
    if (payload.type !== 'chataffy-widget-zones') return;

    if (!Array.isArray(payload.zones)) {
      interactiveZones = [];
      setIframePointerEvents('none');
      return;
    }

    interactiveZones = payload.zones.filter(function (zone) {
      return zone &&
        typeof zone.left === 'number' &&
        typeof zone.top === 'number' &&
        typeof zone.right === 'number' &&
        typeof zone.bottom === 'number';
    });

    // Re-evaluate immediately after zone refresh using latest pointer position.
    if (lastPointerPosition) {
      handlePointerPosition(lastPointerPosition.x, lastPointerPosition.y);
    } else {
      setIframePointerEvents('none');
    }
  });

  function inject() {
    if (document.getElementById('chataffy-widget-frame')) return;
    document.body.appendChild(iframe);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
