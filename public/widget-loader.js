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

  // ── Create the iframe ─────────────────────────────────────────────────────
  // The iframe is full-viewport so the widget can position itself at any
  // corner.  pointer-events:none on the iframe lets the parent page stay
  // fully interactive; the widget page sets pointer-events:auto on its own
  // elements so clicks on the chat button / panel still work.
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
    'overflow:hidden'
  ].join(';');

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
