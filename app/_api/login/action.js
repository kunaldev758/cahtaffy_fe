'use server'



import { cookies } from 'next/headers'

import {

  AGENT_TOKEN,

  CLIENT_TOKEN,

  LEGACY_TOKEN,

  serverAuthCookieOpts,

} from '@/lib/authCookies'



const cookieOpts = () => serverAuthCookieOpts();



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

    headers: { 'Content-Type': 'application/json' },

    body: JSON.stringify({ email, password }),

  })



  const result = await response.json()

  if (result.message === 'Login successful' && result.token) {

    cookies().set({ name: AGENT_TOKEN, value: result.token, ...cookieOpts() })

  }

  return result

}



export async function loginApi(email, password) {

  const response = await fetch(`${process.env.API_HOST}login`, {

    method: 'POST',

    cache: 'no-cache',

    headers: { 'Content-Type': 'application/json' },

    body: JSON.stringify({ email, password }),

  })



  const result = await response.json()

  if (result.status_code == 200 && result.token) {

    cookies().set({ name: CLIENT_TOKEN, value: result.token, ...cookieOpts() })

    cookies().set({ name: 'platform', value: 'local', ...cookieOpts() })

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

    cookies().set({ name: CLIENT_TOKEN, value: result.token, ...cookieOpts() })

    cookies().set({ name: 'platform', value: 'local', ...cookieOpts() })

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

    cookies().set({ name: CLIENT_TOKEN, value: result.token, ...cookieOpts() })

    cookies().set({ name: 'platform', value: 'local', ...cookieOpts() })

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



export async function setClientSessionCookies(token) {

  cookies().set({ name: CLIENT_TOKEN, value: token, ...cookieOpts() })

  cookies().set({ name: 'platform', value: 'local', ...cookieOpts() })

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
  const token = response.headers.get('set-cookie')?.split(';')[0].split('=')[1]
  console.log(token, "this is the token bigcommerce!");
  if(result.status) {
    cookies().set({ name: 'platform', value: 'bigcommerce', ...cookieOpts() })
    cookies().set({ name: 'bc_token', value: token, ...cookieOpts() })
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
//  getting the token from set-cookie   `Set-Cookie` header
  const token = response.headers.get('set-cookie')?.split(';')[0].split('=')[1]
  if(result.status) {
    cookies().set({ name: 'platform', value: 'shopify', ...cookieOpts() })
    cookies().set({ name: 'sf_token', value: token, ...cookieOpts() })
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
  if(result.status) {
    cookies().set({ name: 'platform', value: 'local', ...cookieOpts() })
    cookies().set({ name: 'CLIENT_TOKEN', value: token, ...cookieOpts() })
  }
  return result;

}
