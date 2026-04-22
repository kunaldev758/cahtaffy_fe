'use server'

import { cookies } from 'next/headers'

const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60;
export async function loginAgentApi(email, password) {
  const response = await fetch(`${process.env.API_HOST}agents/login`, {
    method: 'POST',
    cache:'no-cache',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email,
      password: password,
    })
  })

  const result = await response.json()
  if (result.message === "Login successful") {
    cookies().set({ name: 'token', value: result.token, httpOnly: true, maxAge: SEVEN_DAYS_IN_SECONDS})
    cookies().set({ name: 'role', value: 'agent', httpOnly: true, maxAge: SEVEN_DAYS_IN_SECONDS})
  }
  return result
}


export async function loginApi(email, password) {
  const response = await fetch(`${process.env.API_HOST}login`, {
    method: 'POST',
    cache:'no-cache',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email,
      password: password,
    })
  })

  const result = await response.json()
  if (result.status_code==200) {
    cookies().set({ name: 'token', value: result.token, httpOnly: true, maxAge: SEVEN_DAYS_IN_SECONDS})
    cookies().set({name:"role",value:"client",httpOnly: true, maxAge: SEVEN_DAYS_IN_SECONDS})
  }
  return result
}

export async function registrationApi(email, password, role = 'client') {
  const response = await fetch(`${process.env.API_HOST}createUser`, {
    method: 'POST',
    cache:'no-cache',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      "email": email,
      "password": password,
      "role": role
    })
  })

  const result = await response.json()
  return result
}


export async function googleOAuthExchange(googleToken) {
  const response = await fetch(`${process.env.API_HOST}oauth/google`, {
    method: 'POST',
    cache: 'no-cache',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: googleToken })
  })

  const result = await response.json()
  if (result?.status_code === 200 && result?.token) {
    cookies().set({ name: 'token', value: result.token, httpOnly: true, maxAge: SEVEN_DAYS_IN_SECONDS})
    cookies().set({ name: 'role', value: "client", httpOnly: true, maxAge: SEVEN_DAYS_IN_SECONDS})
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

/** Call from client only (e.g. after verify-email). Cookies cannot be set when other server actions run during RSC render. */
export async function setClientSessionCookies(token) {
  cookies().set({ name: 'token', value: token, httpOnly: true })
  cookies().set({ name: 'role', value: 'client', httpOnly: true })
}

export async function getAgentsApi() {
  const token = cookies().get('token')?.value
  if (!token) return { status: false, agents: [] }

  const response = await fetch(`${process.env.API_HOST}ai-agents`, {
    method: 'GET',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    }
  })
  const result = await response.json()
  return result
}

export async function createAIAgentApi() {
  const token = cookies().get('token')?.value
  if (!token) return { status: false, message: 'Not authenticated' }

  const response = await fetch(`${process.env.API_HOST}ai-agents`, {
    method: 'POST',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    body: JSON.stringify({}),
  })
  const result = await response.json()
  return result
}

export async function deleteAIAgentApi(agentId) {
  const token = cookies().get('token')?.value
  if (!token) return { status: false, message: 'Not authenticated' }

  const response = await fetch(`${process.env.API_HOST}ai-agents/delete/${agentId}`, {
    method: 'POST',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    body: JSON.stringify({}),
  })
  const result = await response.json()
  return result
}

export async function completeOnboardingApi() {
  const token = cookies().get('token')?.value
  if (!token) return { status: false }

  const response = await fetch(`${process.env.API_HOST}complete-onboarding`, {
    method: 'POST',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    }
  })
  const result = await response.json()
  return result
}
