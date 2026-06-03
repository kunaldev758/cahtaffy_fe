'use server'



import { cookies, headers } from 'next/headers'

import {

  AGENT_TOKEN,

  AUTH_SURFACE_COOKIE,

  VIEW_MODE_COOKIE,

  BC_TOKEN,

  CLIENT_TOKEN,

  EMBEDDED_PROVIDER_COOKIE,

  LEGACY_TOKEN,

  SF_TOKEN,

  serverAuthCookieOpts,

} from '@/lib/authCookies'

import { resolveClientSessionToken } from '@/lib/clientAuthContext'



const cookieOpts = () => serverAuthCookieOpts();

/** Readable from JS so embedded tabs can set surface before async auth sync. */
const authSurfaceCookieOpts = () => ({ ...cookieOpts(), httpOnly: false });



function extractCookieFromSetCookieHeader(setCookieHeader, cookieName) {
  if (!setCookieHeader) return null
  const match = setCookieHeader.match(
    new RegExp(`(?:^|,\\s*)${cookieName}=([^;]+)`),
  )
  return match?.[1] || null
}



function setWebSessionCookies(token) {
  const opts = cookieOpts()
  cookies().set({ name: CLIENT_TOKEN, value: token, ...opts })
  cookies().set({ name: 'platform', value: 'local', ...opts })
  cookies().set({ name: AUTH_SURFACE_COOKIE, value: 'web', ...authSurfaceCookieOpts() })
  cookies().set({ name: VIEW_MODE_COOKIE, value: 'standalone', ...authSurfaceCookieOpts() })
}



function setEmbeddedSessionCookies(surface, token) {
  const opts = cookieOpts()
  if (surface === 'shopify') {
    cookies().set({ name: 'platform', value: 'shopify', ...opts })
    cookies().set({ name: SF_TOKEN, value: token, ...opts })
    cookies().set({ name: EMBEDDED_PROVIDER_COOKIE, value: 'shopify', ...opts })
    cookies().set({ name: AUTH_SURFACE_COOKIE, value: 'shopify', ...authSurfaceCookieOpts() })
    cookies().set({ name: VIEW_MODE_COOKIE, value: 'embedded', ...authSurfaceCookieOpts() })
  } else if (surface === 'bigcommerce') {
    cookies().set({ name: 'platform', value: 'bigcommerce', ...opts })
    cookies().set({ name: BC_TOKEN, value: token, ...opts })
    cookies().set({ name: EMBEDDED_PROVIDER_COOKIE, value: 'bigcommerce', ...opts })
    cookies().set({ name: AUTH_SURFACE_COOKIE, value: 'bigcommerce', ...authSurfaceCookieOpts() })
    cookies().set({ name: VIEW_MODE_COOKIE, value: 'embedded', ...authSurfaceCookieOpts() })
  }
}



/** Client session token (local / Shopify / BigCommerce). */
function getClientSessionToken() {
  return (
    resolveClientSessionToken({
      cookies: cookies(),
      referer: headers().get('referer'),
      secFetchDest: headers().get('sec-fetch-dest'),
    }) ?? null
  )
}



/** Server Action: set active auth surface before embedded session sync. */
export async function setAuthSurface(surface) {
  if (surface !== 'web' && surface !== 'shopify' && surface !== 'bigcommerce') {
    return { status: false }
  }
  cookies().set({ name: AUTH_SURFACE_COOKIE, value: surface, ...authSurfaceCookieOpts() })
  return { status: true }
}



export async function loginAgentApi(email, password) {

  const response = await fetch(`${process.env.API_HOST}agents/login`, {

    method: 'POST',

    cache: 'no-cache',

    headers: { 'Content-Type': 'application/json' },

    body: JSON.stringify({ email, password }),

  })



  const result = await response.json()

  if (result.message === 'Login successful' && result.token) {

    cookies().set({ name: AGENT_TOKEN, value: result.token, ...cookieOpts() })

  }

  return result

}


export async function loginApi(email, password, resendVerification = false) {
  const response = await fetch(`${process.env.API_HOST}login`, {

    method: 'POST',

    cache: 'no-cache',

    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email,
      password: password,
      ...(resendVerification ? { resendVerification: true } : {}),
    })
  })



  const result = await response.json()

  if (result.status_code == 200 && result.token) {
    setWebSessionCookies(result.token)
  }

  return result

}



export async function directClientLoginApi(token) {

  const response = await fetch(

    `${process.env.API_HOST}direct-client-login/${encodeURIComponent(token)}`,

    { method: 'GET', cache: 'no-cache' },

  )



  const result = await response.json()

  if (result?.status_code === 200 && result?.token) {
    setWebSessionCookies(result.token)
  }

  return result

}



export async function registrationApi(email, password, role = 'client') {

  const response = await fetch(`${process.env.API_HOST}createUser`, {

    method: 'POST',

    cache: 'no-cache',

    headers: { 'Content-Type': 'application/json' },

    body: JSON.stringify({ email, password, role }),

  })



  return await response.json()

}



export async function googleOAuthExchange(googleToken) {

  const response = await fetch(`${process.env.API_HOST}oauth/google`, {

    method: 'POST',

    cache: 'no-cache',

    headers: { 'Content-Type': 'application/json' },

    body: JSON.stringify({ token: googleToken }),

  })



  const result = await response.json()

  if (result?.status_code === 200 && result?.token) {
    setWebSessionCookies(result.token)
  }

  return result

}



export async function verifyEmailApi(token) {

  const response = await fetch(`${process.env.API_HOST}verifyEmail`, {

    method: 'POST',

    cache: 'no-store',

    headers: { 'Content-Type': 'application/json' },

    body: JSON.stringify({ token }),

  })

  const text = await response.text()

  try {

    return JSON.parse(text)

  } catch {

    return { status: false, status_code: 500, message: 'Email verification failed' }

  }

}

export async function forgotPasswordApi(email) {
  const response = await fetch(`${process.env.API_HOST}forgot-password`, {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    return { status: false, status_code: 500, message: 'Failed to send reset email' }
  }
}

export async function resetPasswordApi(token, newPassword, confirmPassword) {
  const response = await fetch(`${process.env.API_HOST}reset-password`, {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword, confirmPassword }),
  })
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    return { status: false, status_code: 500, message: 'Failed to reset password' }
  }
}

/** Call from client only (e.g. after verify-email). Cookies cannot be set when other server actions run during RSC render. */
export async function setClientSessionCookies(token) {
  setWebSessionCookies(token)
}



export async function getAgentsApi() {

  const token = getClientSessionToken()

  if (!token) return { status: false, agents: [] }



  const response = await fetch(`${process.env.API_HOST}ai-agents`, {

    method: 'GET',

    cache: 'no-cache',

    headers: {

      'Content-Type': 'application/json',

      Authorization: token,

    },

  })

  return await response.json()

}



export async function createAIAgentApi() {

  const token = getClientSessionToken()

  if (!token) return { status: false, message: 'Not authenticated' }



  const response = await fetch(`${process.env.API_HOST}ai-agents`, {

    method: 'POST',

    cache: 'no-cache',

    headers: {

      'Content-Type': 'application/json',

      Authorization: token,

    },

    body: JSON.stringify({}),

  })

  return await response.json()

}



export async function deleteAIAgentApi(agentId) {

  const token = getClientSessionToken()

  if (!token) return { status: false, message: 'Not authenticated' }



  const response = await fetch(

    `${process.env.API_HOST}ai-agents/delete/${agentId}`,

    {

      method: 'POST',

      cache: 'no-cache',

      headers: {

        'Content-Type': 'application/json',

        Authorization: token,

      },

      body: JSON.stringify({}),

    },

  )

  return await response.json()

}



export async function completeOnboardingApi() {

  const token = getClientSessionToken()

  if (!token) return { status: false }



  const response = await fetch(`${process.env.API_HOST}complete-onboarding`, {

    method: 'POST',

    cache: 'no-cache',

    headers: {

      'Content-Type': 'application/json',

      Authorization: token,

    },

  })

  return await response.json()

}

export async function bcAuthLoadApi(signedPayloadJwt) {

  const response = await fetch(`${process.env.API_HOST}bigcommerce/auth/load?signed_payload_jwt=${signedPayloadJwt}`, {

    method: 'GET',

    cache: 'no-cache',

    headers: {

      'Content-Type': 'application/json',

    },

  })

  const result = await response.json()
  const setCookieHeader = response.headers.get('set-cookie')
  const token =
    extractCookieFromSetCookieHeader(setCookieHeader, BC_TOKEN) ||
    extractCookieFromSetCookieHeader(setCookieHeader, 'bc_token')
  if (result.status && token) {
    setEmbeddedSessionCookies('bigcommerce', token)
  }
  return result;

}

export async function sfAuthLoadApi(params) {
  const response = await fetch(`${process.env.API_HOST}shopify/auth/load?${new URLSearchParams(params).toString()}`, {

    method: 'GET',

    cache: 'no-cache',

    headers: {

      'Content-Type': 'application/json',
    },

  })


  const result = await response.json()
  const setCookieHeader = response.headers.get('set-cookie')
  const token =
    extractCookieFromSetCookieHeader(setCookieHeader, SF_TOKEN) ||
    extractCookieFromSetCookieHeader(setCookieHeader, 'sf_token')
  if (result.status && token) {
    setEmbeddedSessionCookies('shopify', token)
  }
  return { ...result, httpStatus: response.status };

}

export async function setPlatformCookie() {
  const options = cookieOpts()
  cookies().set({ name: 'platform', value: 'local', ...options })
  return { status: true }
}

export async function platformRedirectionLogin(userId) {
  const response = await fetch(`${process.env.API_HOST}platform-redirection-login/${userId}`, {
    method: 'GET',
    cache: 'no-cache',
    headers: { 'Content-Type': 'application/json' },
  })

  const result = await response.json()
//  getting the token from set-cookie   `Set-Cookie` header
  const token = response.headers.get('set-cookie')?.split(';')[0].split('=')[1]
  if (result.status && token) {
    setWebSessionCookies(token)
  }
  return result;

}






