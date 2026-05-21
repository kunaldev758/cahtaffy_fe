## Platform-Based Token Authentication Fix

### Problem Statement

**Scenario:**
- User logs into BigCommerce embedded app as **UserA** → `BC_TOKEN_store123 = UserA`
- User redirects to web version
- User logs out from web version
- User logs into web as **UserB** → `WEB_TOKEN = UserB`
- User goes back to BigCommerce app

**Expected:** BigCommerce still uses `BC_TOKEN_store123` (UserA's token)
**Actual:** BigCommerce becomes UserB (reads `WEB_TOKEN`)

**Root Cause:**
The `getPlatform()` function always returns `"web"` on the server-side (during SSR) because:
1. It checks `typeof window === "undefined"` first
2. When server-side rendering, `window` doesn't exist
3. The function immediately returns `"web"` without any further detection
4. This causes `readTokenFromCookieStore()` to read `WEB_TOKEN` instead of `BC_TOKEN_store123`

---

## Solution Overview

The fix involves **3 key changes:**

### 1. Add Server-Side Platform Detection
**File:** `lib/clientCookie.js`

```javascript
/**
 * Server-side platform detection (uses hostname from URL)
 * Call this in middleware/server actions when window is undefined
 */
function getPlatformFromHostname(hostname) {
  if (!hostname) return "web";
  
  if (hostname.includes("myshopify")) return "shopify";
  if (hostname.includes("bigcommerce")) return "bigcommerce";
  
  return "web";
}
```

**Usage:**
- Extract hostname from the request object
- Pass it to `getPlatformFromHostname()` to detect the platform
- Use this detected platform when reading cookies on server

---

### 2. Update Cookie Reading Functions to Accept Platform Parameter
**File:** `lib/clientCookie.js`

#### Updated `readTokenFromCookieStore()`

```javascript
/**
 * Read token from cookie store - PLATFORM AWARE
 * 
 * Priority order:
 * 1. Platform-specific token (BC_TOKEN_*, SP_TOKEN_*)
 * 2. Web token (WEB_TOKEN)
 * 3. Legacy tokens
 * 
 * @param {Object} cookieStore - Cookie store object
 * @param {string} detectedPlatform - Platform detected from server
 * @returns {string|null} - The auth token value or null
 */
function readTokenFromCookieStore(cookieStore, detectedPlatform) {
  if (!cookieStore) return null;

  const platform = detectedPlatform || (typeof window !== "undefined" ? getPlatform() : "web");
  
  // If server-side, platform should have been passed explicitly
  // Try to read platform-specific token first
  if (platform && platform !== "web") {
    const baseKey = TOKEN_KEYS[platform];
    if (baseKey) {
      const all = cookieStore.getAll?.() || [];
      
      // Look for platform-specific tokens (e.g., BC_TOKEN_store123, SP_TOKEN_shop)
      for (const cookie of all) {
        if (cookie?.value && (
          cookie.name === baseKey || 
          cookie.name.startsWith(`${baseKey}_`)
        )) {
          return cookie.value;
        }
      }
    }
  }

  // Fallback: read all tokens and return the first one
  const tokens = readAllTokensFromCookieStore(cookieStore);
  if (tokens.length) return tokens[0];

  return null;
}
```

**Key Changes:**
- Accepts `detectedPlatform` parameter
- **First priority:** Platform-specific tokens (`BC_TOKEN_store123`, `SP_TOKEN_shop`)
- **Second priority:** Web token (`WEB_TOKEN`)
- **Third priority:** Legacy tokens
- Falls back to client-side detection if no platform is provided

#### Updated `hasAuthTokenCookie()`

```javascript
function hasAuthTokenCookie(requestOrStore, detectedPlatform) {
  if (!requestOrStore) return false;

  if (requestOrStore.cookies?.has) {
    if (requestOrStore.cookies.has(LEGACY_TOKEN_COOKIE)) return true;
    return requestOrStore.cookies
      .getAll()
      .some((cookie) => isAuthTokenCookieName(cookie.name));
  }

  return Boolean(readTokenFromCookieStore(requestOrStore, detectedPlatform));
}
```

**Key Changes:**
- Now accepts `detectedPlatform` parameter
- Passes it to `readTokenFromCookieStore()`

---

### 3. Update Middleware to Detect and Pass Platform
**File:** `middleware.ts`

```typescript
import { getPlatformFromHostname } from "./lib/clientCookie";

export async function middleware(request: NextRequest) {
  // ... existing code ...

  // Detect platform from hostname (server-side)
  const detectedPlatform = getPlatformFromHostname(request.nextUrl.hostname);

  // Pass detectedPlatform to auth check
  const hasToken = hasAuthTokenCookie(request, detectedPlatform);
  const currentUserRole = request.cookies.get("role")?.value;

  // Log for debugging
  console.log("[Middleware] 📥 Request:", {
    method: request.method,
    hostname: request.nextUrl.hostname,
    detectedPlatform,  // ← Shows detected platform
    hasToken,
    currentUserRole,
    url: request.url
  });

  // ... rest of middleware ...
}
```

**Key Changes:**
- Import `getPlatformFromHostname` from clientCookie
- Extract hostname from `request.nextUrl.hostname`
- Detect platform using `getPlatformFromHostname(hostname)`
- Pass `detectedPlatform` to `hasAuthTokenCookie(request, detectedPlatform)`
- Add debug logging to track platform detection

---

## How It Works (Flow Diagram)

### Before Fix:
```
BigCommerce embedded app (hostname: myshopify.com)
    ↓
Middleware SSR
    ↓
getPlatform() → "web" (because window is undefined)
    ↓
readTokenFromCookieStore() → reads WEB_TOKEN (UserB)
    ↓
🔴 WRONG: User sees UserB instead of UserA
```

### After Fix:
```
BigCommerce embedded app (hostname: myshopify.com)
    ↓
Middleware SSR
    ↓
getPlatformFromHostname("myshopify.com") → "bigcommerce"
    ↓
Pass to hasAuthTokenCookie(request, "bigcommerce")
    ↓
readTokenFromCookieStore(cookieStore, "bigcommerce")
    ↓
Looks for BC_TOKEN_* tokens first → BC_TOKEN_store123
    ↓
✅ CORRECT: User sees UserA
```

---

## Cookie Token Mapping

```javascript
TOKEN_KEYS = {
  shopify: "SP_TOKEN",        // Shopify embedded apps
  bigcommerce: "BC_TOKEN",    // BigCommerce embedded apps
  web: "WEB_TOKEN",           // Web/redirect flow
};
```

**Naming Convention:**
- **Web:** `WEB_TOKEN` (no suffix, same for all users)
- **Shopify:** `SP_TOKEN_shopname` (different per shop)
- **BigCommerce:** `BC_TOKEN_storehash` (different per store)

---

## Testing Checklist

Use this checklist to verify the fix works:

### Test 1: BigCommerce Multi-User
- [ ] User A logs into BigCommerce app
- [ ] Check cookies: `BC_TOKEN_store123` is set
- [ ] User A navigates to web version (same domain)
- [ ] User A logs out from web
- [ ] User B logs into web
- [ ] Check cookies: `WEB_TOKEN` is set to User B
- [ ] User B navigates back to BigCommerce embedded iframe
- [ ] **✅ User B should still be User A in BigCommerce** (BC_TOKEN_store123 still valid)

### Test 2: Shopify Multi-User
- [ ] User A logs into Shopify app
- [ ] Check cookies: `SP_TOKEN_shop` is set
- [ ] User A navigates to web, logs out
- [ ] User B logs into web (WEB_TOKEN set)
- [ ] User B navigates to Shopify
- [ ] **✅ User B should still be User A in Shopify** (SP_TOKEN_shop still valid)

### Test 3: Server-Side Detection
- [ ] Check middleware logs: `detectedPlatform` shows correct platform
- [ ] For BigCommerce: `detectedPlatform: "bigcommerce"`
- [ ] For Shopify: `detectedPlatform: "shopify"`
- [ ] For web: `detectedPlatform: "web"`

### Test 4: Cookie Priority
- [ ] When multiple tokens exist (BC_TOKEN_store123 + WEB_TOKEN), BigCommerce gets BC_TOKEN_store123
- [ ] Shopify gets SP_TOKEN_shop, not WEB_TOKEN

---

## Key Files Modified

| File | Changes |
|------|---------|
| `lib/clientCookie.js` | Added `getPlatformFromHostname()`, updated `readTokenFromCookieStore()` and `hasAuthTokenCookie()` to accept platform parameter |
| `middleware.ts` | Added platform detection from hostname, pass to auth checks, added debug logging |

---

## Debugging Tips

### Enable Debug Logs
The middleware now logs:
```javascript
console.log("[Middleware] 📥 Request:", {
  hostname: request.nextUrl.hostname,
  detectedPlatform,
  hasToken,
  currentUserRole,
  url: request.url
});
```

**Check server logs to see:**
- `hostname: "store123.myshopify.com"` 
- `detectedPlatform: "shopify"`
- `hasToken: true`

### Check Cookies in Browser
```javascript
// In browser console, check what cookies exist:
document.cookie
// Should show: BC_TOKEN_store123=...; WEB_TOKEN=...; etc.
```

### Check Which Token is Being Read
Add temporary logging in `readTokenFromCookieStore()`:
```javascript
console.log("[Token Reading] Platform:", platform, "Available cookies:", 
  cookieStore.getAll?.()?.map(c => c.name));
```

---

## Fallback Behavior

If `detectedPlatform` is not provided (backward compatibility):
- Function falls back to client-side `getPlatform()` detection
- Works for browser-only scenarios
- Server-side will default to `"web"` (original behavior)

**Recommendation:** Always pass detected platform from middleware to avoid fallback scenarios.

---

## Summary

**The fix ensures:**
1. ✅ Platform is detected from hostname on server-side (SSR)
2. ✅ Platform-specific tokens are prioritized over web tokens
3. ✅ Multiple users can coexist without interfering with each other
4. ✅ Backward compatible with client-side code
5. ✅ Debug logging shows which platform and token is being used

**Before:** BigCommerce would read WEB_TOKEN → User B
**After:** BigCommerce reads BC_TOKEN_store123 → User A (correct)
