'use server'

import { cookies } from 'next/headers'

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
  if (result.message=="Login successful") {
    console.log(result.token,"this is token")
    cookies().set({ name: 'token', value: result.token, httpOnly: true})
    cookies().set({name:"role",value:"agent",httpOnly: true})
  }
  console.log(result,"the result")
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
    cookies().set({ name: 'token', value: result.token, httpOnly: true})
    cookies().set({name:"role",value:"client",httpOnly: true})
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





export async function verifyEmailApi(token) {
  const response = await fetch(`${process.env.API_HOST}verifyEmail`, {
    method: 'POST',
    cache:'no-cache',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({token:token})
  })
  const result = await response.json()
  return result
}




