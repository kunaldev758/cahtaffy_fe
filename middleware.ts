import { NextRequest, NextResponse } from "next/server";

import { continueWithOptionalShopifyHeader } from "./lib/shopifyEmbed";

import {

  respondWidgetEmbedResolve,

  respondWidgetEmbedScript,

} from "./app/_api/widget-embed/action.js";

import {

  AGENT_TOKEN,

  CLIENT_TOKEN,

  LEGACY_TOKEN,

} from "./lib/authCookies";

import {

  absolutePortalUrl,

  getDashboardUrl,

  getMarketingUrl,

  getPortalFromHost,

  isAgentPath,

  isMarketingOnlyPath,

  isProductionPortalRouting,

  LEGACY_BASE_PATH,

  stripLegacyBasePath,

  type Portal,

} from "./lib/portalUrls";



function portalForPath(pathname: string): Portal {

  if (isAgentPath(pathname)) return "agent";

  if (isMarketingOnlyPath(pathname)) return "marketing";

  return "dashboard";

}



function clientSessionToken(request: NextRequest): string | undefined {

  const platform = request.cookies.get("platform")?.value;

  console.log("client session token check, platform cookie value: ", platform);

  if (platform === "shopify") {

    return request.cookies.get("sf_token")?.value;

  }

  if (platform === "bigcommerce") {

    return request.cookies.get("bc_token")?.value;

  }

  return (

    request.cookies.get(CLIENT_TOKEN)?.value ||

    request.cookies.get(LEGACY_TOKEN)?.value

  );

}



function agentSessionToken(request: NextRequest): string | undefined {

  return (

    request.cookies.get(AGENT_TOKEN)?.value ||

    request.cookies.get(LEGACY_TOKEN)?.value

  );

}



function sessionTokenForRequest(

  request: NextRequest,

  portal: Portal | "all",

  pathname: string,

): string | undefined {

  if (portal === "agent") return agentSessionToken(request);

  if (portal === "dashboard") return clientSessionToken(request);

  if (portal === "marketing") return undefined;

  return isAgentPath(pathname)

    ? agentSessionToken(request)

    : clientSessionToken(request);

}



export async function middleware(request: NextRequest) {

  const host = request.headers.get("host") || "";

  const portal = getPortalFromHost(host);

  console.log(`[Middleware] Incoming request for ${request.url} on portal "${portal}" with host "${host}"`);

  const rawPathname = new URL(request.url).pathname;

  let pathname = request.nextUrl.pathname;



  if (rawPathname.startsWith(LEGACY_BASE_PATH)) {

    const stripped = stripLegacyBasePath(rawPathname);

    const search = request.nextUrl.search;

    if (isProductionPortalRouting()) {

      const targetPortal = portalForPath(stripped);

      const dest = absolutePortalUrl(targetPortal, stripped, search);

      return NextResponse.redirect(dest, 301);

    }

    pathname = stripped;

  }



  if (

    pathname.startsWith("/_next") ||

    pathname.startsWith("/images") ||

    pathname.startsWith("/audio") ||

    pathname === "/favicon.ico"

  ) {

    return continueWithOptionalShopifyHeader(request);

  }



  if (

    request.method === "GET" &&

    (pathname === "/_api/widget-embed/resolve" ||

      pathname === "/_api/widget-embed/resolve/")

  ) {

    return await respondWidgetEmbedResolve(request.url);

  }



  const widEqPath = pathname.match(/^\/wid=([a-f0-9]{24})\/?$/i);

  if (request.method === "GET" && widEqPath) {

    return respondWidgetEmbedScript(widEqPath[1]);

  }



  const wShort = pathname.match(/^\/w\/([^/]+)\/?$/);

  if (request.method === "GET" && wShort) {

    return respondWidgetEmbedScript(wShort[1]);

  }



  const embedMatch = pathname.match(/^\/_api\/widget-embed\/([^/]+)\/?$/);

  if (request.method === "GET" && embedMatch) {

    return respondWidgetEmbedScript(embedMatch[1]);

  }



  if (portal !== "all") {

    const pathPortal = portalForPath(pathname);

    const visitorAllowedPrefix = "/openai/widget";

    const widgetAssetPaths =

      pathname.startsWith(visitorAllowedPrefix) ||

      pathname.startsWith("/_api/widget-embed") ||

      pathname.startsWith("/w/") ||

      pathname.match(/^\/wid=/);



    if (portal === "marketing") {

      if (!isMarketingOnlyPath(pathname) && !widgetAssetPaths) {

        const target: Portal = pathPortal;

        return NextResponse.redirect(

          absolutePortalUrl(target, pathname, request.nextUrl.search),

        );

      }

    } else if (portal === "dashboard") {

      if (isAgentPath(pathname)) {

        return NextResponse.redirect(

          absolutePortalUrl("agent", pathname, request.nextUrl.search),

        );

      }

      if (isMarketingOnlyPath(pathname)) {

        return NextResponse.redirect(getDashboardUrl());

      }

    } else if (portal === "agent") {

      if (!isAgentPath(pathname) && !widgetAssetPaths) {

        const dest = isAgentPath(pathname)

          ? pathname

          : "/agent-login";

        return NextResponse.redirect(

          absolutePortalUrl("agent", dest, request.nextUrl.search),

        );

      }

    }

  }



  const marketingUrl = getMarketingUrl();

  const dashboardUrl = getDashboardUrl();

  const effectivePortal =

    portal === "all" ? portalForPath(pathname) : portal;

  const hasToken = !!sessionTokenForRequest(request, portal, pathname);


  console.log(`[Middleware] Effective portal: "${effectivePortal}". Session token present: ${hasToken}`);


  const directClientLoginPrefix = "/direct-client-login";
  const publicRoutes = ["/login", "/signup", "/forget-password", "/reset-password", "/verify-email", "/agent-login", "/agent-accept-invite", "/load"];
  /** Logged-in clients may visit any route except these auth pages */
  const clientLoginSignupRoutes = ["/login", "/signup"];

  const agentRoutes = ["/agent-inbox", "/agent-login", "/agent-accept-invite"];

  const visitorAllowedPrefix = "/openai/widget";



  if (pathname === "/") {

    return continueWithOptionalShopifyHeader(request);

  }



  if (!hasToken) {

    if (

      publicRoutes.includes(pathname) ||

      pathname === directClientLoginPrefix ||

      pathname.startsWith(`${directClientLoginPrefix}/`) ||

      pathname.startsWith(visitorAllowedPrefix)

    ) {

      return continueWithOptionalShopifyHeader(request);

    }

    const fallback =

      effectivePortal === "agent"

        ? absolutePortalUrl("agent", "/agent-login")

        : effectivePortal === "dashboard"

          ? absolutePortalUrl("dashboard", "/login")

          : marketingUrl;

    return NextResponse.redirect(fallback);

  }



  if (

    hasToken &&

    effectivePortal === "agent" &&

    // If an agent is already logged in, send them to the inbox when they hit the agent login.
    // Critical: do NOT redirect when they're already on `/agent-inbox`, or the browser can get
    // stuck in a redirect loop.
    pathname === "/agent-login"

  ) {

    const inboxUrl =

      portal === "agent"

        ? new URL("/agent-inbox", request.url)

        : absolutePortalUrl("agent", "/agent-inbox");

    return NextResponse.redirect(inboxUrl);

  }



  if (

    hasToken &&

    effectivePortal === "dashboard" &&

    clientLoginSignupRoutes.includes(pathname)

  ) {

    const dash =

      portal === "dashboard"

        ? new URL("/dashboard", request.url)

        : absolutePortalUrl("dashboard", "/dashboard");

    return NextResponse.redirect(dash);

  }



  if (effectivePortal === "agent") {

    const pathnameWithoutQuery = pathname.split("?")[0].replace(/\/$/, "");

    const normalizedAgentRoutes = agentRoutes.map((route) =>

      route.replace(/\/$/, ""),

    );



    if (normalizedAgentRoutes.includes(pathnameWithoutQuery)) {

      return continueWithOptionalShopifyHeader(request);

    }



    const loginUrl =

      portal === "agent"

        ? new URL("/agent-login", request.url)

        : absolutePortalUrl("agent", "/agent-login");

    return NextResponse.redirect(loginUrl);

  }



  if (effectivePortal === "dashboard") {

    if (portal === "agent" && !pathname.startsWith(visitorAllowedPrefix)) {

      return NextResponse.redirect(dashboardUrl);

    }

    return continueWithOptionalShopifyHeader(request);

  }



  if (pathname.startsWith(visitorAllowedPrefix)) {

    return continueWithOptionalShopifyHeader(request);

  }

  // Agent and dashboard paths already returned above; only marketing remains.
  return NextResponse.redirect(marketingUrl);

}



export const config = {

  matcher: [

    "/((?!api|favicon.ico|verify-email|widget|openai/widget|tensorflow/widget|_next|images|audio|\\.well-known).*)",

  ],

};

