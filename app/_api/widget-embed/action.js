const OBJECT_ID_HEX = /^[a-f0-9]{24}$/i

function backendOriginForServerFetch() {
  const raw =
    process.env.API_HOST ||
    process.env.NEXT_PUBLIC_API_HOST ||
    'http://127.0.0.1:9000/api/'
  let s = raw.trim()
  if (!s.includes('://')) {
    s = 'http://' + s
  }
  try {
    const parsed = new URL(s.endsWith('/') ? s : `${s}/`)
    const h =
      parsed.hostname === 'localhost' || parsed.hostname === '::1'
        ? '127.0.0.1'
        : parsed.hostname
    if (parsed.port) {
      return `${parsed.protocol}//${h}:${parsed.port}`
    }
    return `${parsed.protocol}//${h}`
  } catch {
    return 'http://127.0.0.1:9000'
  }
}

export async function respondWidgetEmbedResolve(requestUrl) {
  const url = new URL(requestUrl)
  const origin = url.searchParams.get('origin')
  const wid = url.searchParams.get('wid')
  const apiOrigin = backendOriginForServerFetch().replace(/\/$/, '')
  const u = new URL(`${apiOrigin}/api/widget/embed`)
  if (origin) u.searchParams.set('origin', origin)
  if (wid) u.searchParams.set('wid', wid)
  const target = u.toString()

  try {
    const res = await fetch(target, { cache: 'no-store' })
    const data = await res.json()
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    console.error('[widget-embed/resolve] backend fetch failed', { target, err })
    return new Response(
      JSON.stringify({
        status_code: 502,
        message:
          'Could not reach embed API. Confirm the Chataffy API is running (e.g. port in .env API_HOST) and restart Next.js.',
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
      },
    )
  }
}

function buildBootstrapJs(wid) {
  return `(function(){
  var W=${JSON.stringify(wid)};
  var me=document.currentScript||(function(){var a=document.getElementsByTagName('script');return a[a.length-1];})();
  if(!me)return;
  var src=me.getAttribute('src');if(!src)return;
  var u=new URL(src,window.location.href);
  var p=u.pathname;
  var prefix='';
  var i=p.lastIndexOf('/_api/widget-embed/');
  if(i>=0){prefix=p.slice(0,i);}else{
    i=p.lastIndexOf('/w/');
    if(i>=0){prefix=p.slice(0,i);}else{
      i=p.lastIndexOf('/wid=');
      if(i>=0){prefix=p.slice(0,i);}
    }
  }
  var loader=u.origin+prefix+'/widget-loader.js?wid='+encodeURIComponent(W);
  var s=document.createElement('script');
  s.src=loader;
  (document.head||document.documentElement).appendChild(s);
})();`
}

export function respondWidgetEmbedScript(wid) {
  const id = String(wid ?? '')
  if (!OBJECT_ID_HEX.test(id)) {
    return new Response('/* invalid widget id */\n', {
      status: 400,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  return new Response(buildBootstrapJs(id), {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
