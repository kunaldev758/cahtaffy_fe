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

  var widIn = params.wid;
  var tokenIn = params.token;
  var agentIn = params.agent;

  // ── Derive base URL from this script's location ──────────────────────────
  var scriptPath = fullSrc.split('?')[0];
  var base = scriptPath.replace(/\/widget-loader\.js$/, '');

  function startWithCredentials(wid, token, agent) {
    if (!wid || !token || !agent) {
      console.warn('[Chataffy] widget-loader: missing required params (wid, token, agent).');
      return;
    }

    var widgetPageUrl = base + '/openai/widget/' + wid + '/' + token + '/' + agent;
    var widgetOrigin = '';
    try {
      widgetOrigin = new URL(widgetPageUrl, window.location.href).origin;
    } catch (e) {
      widgetOrigin = '';
    }

    // ── Create the iframe ─────────────────────────────────────────────────────
    var iframe = document.createElement('iframe');
    iframe.id = 'chataffy-widget-frame';
    iframe.src = widgetPageUrl;
    // Cross-origin iframes need an explicit Permissions Policy grant for mic
    // (Web Speech API / getUserMedia). Without this, browsers return not-allowed.
    iframe.setAttribute('allow', 'microphone; autoplay');
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
      'pointer-events:none',
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
        return (
          zone &&
          typeof zone.left === 'number' &&
          typeof zone.top === 'number' &&
          typeof zone.right === 'number' &&
          typeof zone.bottom === 'number'
        );
      });

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
  }

  if (widIn && tokenIn && agentIn) {
    startWithCredentials(widIn, tokenIn, agentIn);
    return;
  }

  // Short embed: resolve wid/token/agent from the page's public origin (must match trained domain).
  var pageOrigin = '';
  try {
    pageOrigin = window.location.origin || '';
  } catch (e) {
    pageOrigin = '';
  }

  if (
    !pageOrigin ||
    pageOrigin === 'null' ||
    pageOrigin.indexOf('file:') === 0
  ) {
    console.warn(
      '[Chataffy] Short embed needs an http(s) page origin that matches your site domain (not file://). Use the full script with ?wid=&token=&agent= for local file tests.',
    );
    return;
  }

  var resolveUrl =
    base +
    '/_api/widget-embed/resolve?origin=' +
    encodeURIComponent(pageOrigin) +
    (widIn ? '&wid=' + encodeURIComponent(widIn) : '');

  fetch(resolveUrl, { credentials: 'omit' })
    .then(function (res) {
      return res.json();
    })
    .then(function (body) {
      var d = body && body.data;
      if (!d || !d.wid || !d.token || !d.agent) {
        console.warn(
          '[Chataffy] widget-loader: could not resolve embed.',
          body && (body.message || body),
        );
        console.warn(
          '[Chataffy] Fix: use the script tag from Chataffy Widget setup — it includes ?wid=.... Or append ?wid=YOUR_WIDGET_ID to this script URL.',
        );
        return;
      }
      startWithCredentials(d.wid, d.token, d.agent);
    })
    .catch(function (err) {
      console.warn('[Chataffy] widget-loader: embed resolve request failed', err);
    });
})();
