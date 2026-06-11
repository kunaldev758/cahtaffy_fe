'use server'



import { cookies, headers } from 'next/headers'

import {

  AGENT_TOKEN,

  CLIENT_TOKEN,

  LEGACY_TOKEN,

  serverAuthCookieOpts,

  serverPlatformCookieOpts,

} from '@/lib/authCookies'



const cookieOpts = () => serverAuthCookieOpts();

const platformCookieOpts = () => serverPlatformCookieOpts();

const getRequestMeta = () => {
  const h = headers();
  const userAgent = h.get("user-agent") || "unknown";
  const xff = h.get("x-forwarded-for") || h.get("x-client-ip") || h.get("x-real-ip") || "";
  const ip = xff ? xff.split(",").pop().trim() : "unknown";
  return { userAgent, ip };
};

const makeFetchHeaders = (overrides = {}) => {
  const { userAgent, ip } = getRequestMeta();
  return { 'Content-Type': 'application/json', 'User-Agent': userAgent, 'X-Client-IP': ip, ...overrides };
};



/** Client session token (local / Shopify / BigCommerce). */

function getClientSessionToken() {

  const platform = cookies().get('platform')?.value || 'local';

  if (platform === 'shopify') return cookies().get('sf_token')?.value || null;

  if (platform === 'bigcommerce') return cookies().get('bc_token')?.value || null;

  return (

    cookies().get(CLIENT_TOKEN)?.value ||

    cookies().get(LEGACY_TOKEN)?.value ||

    null

  );

}



export async function loginAgentApi(email, password) {

  const response = await fetch(`${process.env.API_HOST}agents/login`, {

    method: 'POST',

    cache: 'no-cache',

    headers: makeFetchHeaders(),

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

    headers: makeFetchHeaders(),
    body: JSON.stringify({
      email: email,
      password: password,
      ...(resendVerification ? { resendVerification: true } : {}),
    })
  })



  const result = await response.json()

  if (result.status_code == 200 && result.token) {

    cookies().set({ name: CLIENT_TOKEN, value: result.token, ...cookieOpts() })

    cookies().set({ name: 'platform', value: 'local', ...platformCookieOpts() })

  }

  return result

}



export async function directClientLoginApi(token) {

  const response = await fetch(

    `${process.env.API_HOST}direct-client-login/${encodeURIComponent(token)}`,

    { method: 'GET', cache: 'no-cache', headers: makeFetchHeaders() },

  )



  const result = await response.json()

  if (result?.status_code === 200 && result?.token) {

    cookies().set({ name: CLIENT_TOKEN, value: result.token, ...cookieOpts() })

    cookies().set({ name: 'platform', value: 'local', ...platformCookieOpts() })

  }

  return result

}



export async function registrationApi(email, password, role = 'client') {

  const response = await fetch(`${process.env.API_HOST}createUser`, {

    method: 'POST',

    cache: 'no-cache',

    headers: makeFetchHeaders(),

    body: JSON.stringify({ email, password, role }),

  })



  return await response.json()

}



export async function googleOAuthExchange(googleToken) {

  const response = await fetch(`${process.env.API_HOST}oauth/google`, {

    method: 'POST',

    cache: 'no-cache',

    headers: makeFetchHeaders(),

    body: JSON.stringify({ token: googleToken }),

  })



  const result = await response.json()

  if (result?.status_code === 200 && result?.token) {

    cookies().set({ name: CLIENT_TOKEN, value: result.token, ...cookieOpts() })

    cookies().set({ name: 'platform', value: 'local', ...platformCookieOpts() })

  }

  return result

}



export async function verifyEmailApi(token) {

  const response = await fetch(`${process.env.API_HOST}verifyEmail`, {

    method: 'POST',

    cache: 'no-store',

    headers: makeFetchHeaders(),

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
    headers: makeFetchHeaders(),
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
    headers: makeFetchHeaders(),
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

  cookies().set({ name: CLIENT_TOKEN, value: token, ...cookieOpts() })

  cookies().set({ name: 'platform', value: 'local', ...platformCookieOpts() })

}



export async function getAgentsApi() {

  const token = getClientSessionToken()

  if (!token) return { status: false, agents: [] }



  const response = await fetch(`${process.env.API_HOST}ai-agents`, {

    method: 'GET',

    cache: 'no-cache',

    headers: makeFetchHeaders({ Authorization: token }),

  })

  return await response.json()

}



export async function createAIAgentApi() {

  const token = getClientSessionToken()

  if (!token) return { status: false, message: 'Not authenticated' }



  const response = await fetch(`${process.env.API_HOST}ai-agents`, {

    method: 'POST',

    cache: 'no-cache',

    headers: makeFetchHeaders({ Authorization: token }),

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

      headers: makeFetchHeaders({ Authorization: token }),

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

    headers: makeFetchHeaders({ Authorization: token }),

  })
  

  return await response.json()

}

export async function bcAuthLoadApi(signedPayloadJwt) {


  const response = await fetch(`${process.env.API_HOST}bigcommerce/auth/load?signed_payload_jwt=${signedPayloadJwt}`, {

    method: 'GET',

    cache: 'no-cache',

    headers: makeFetchHeaders({ Authorization: `Bearer ${getClientSessionToken()}` }),

  })

  const result = await response.json()
  const token = response.headers.get('set-cookie')?.split(';')[0].split('=')[1]
  console.log(token, "this is the token bigcommerce!");
  if(result.status) {
    cookies().set({ name: 'platform', value: 'bigcommerce', ...platformCookieOpts() })
    cookies().set({ name: 'bc_token', value: token, ...cookieOpts() })
  }
  return { ...result, token };

}

export async function sfAuthLoadApi(params) {
  const response = await fetch(`${process.env.API_HOST}shopify/auth/load?${new URLSearchParams(params).toString()}`, {

    method: 'GET',

    cache: 'no-cache',

    headers: makeFetchHeaders({ Authorization: `Bearer ${getClientSessionToken()}` }),

  })


  const result = await response.json()
//  getting the token from set-cookie   `Set-Cookie` header
  const token = response.headers.get('set-cookie')?.split(';')[0].split('=')[1]
  if(result.status) {
    cookies().set({ name: 'platform', value: 'shopify', ...platformCookieOpts() })
    cookies().set({ name: 'sf_token', value: token, ...cookieOpts() })
  }
  return { ...result, httpStatus: response.status, token };

}

export async function setPlatformCookie() {
  const options = platformCookieOpts()
  cookies().set({ name: 'platform', value: 'local', ...options })
  return { status: true }
}

export async function platformRedirectionLogin(userId,shortLivedToken) {
  const response = await fetch(`${process.env.API_HOST}platform-redirection-login/${userId}/${shortLivedToken}`, {
    method: 'GET',
    cache: 'no-cache',
    headers: makeFetchHeaders(),
  })

  const result = await response.json()
//  getting the token from set-cookie   `Set-Cookie` header
  const token = response.headers.get('set-cookie')?.split(';')[0].split('=')[1]
  if(result.status) {
    cookies().set({ name: 'platform', value: 'local', ...platformCookieOpts() })
    cookies().set({ name: 'CLIENT_TOKEN', value: token, ...cookieOpts() })
  }
  return { ...result, token };

}






