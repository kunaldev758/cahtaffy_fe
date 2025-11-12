// Registration Component
'use client'
import { useState } from 'react';
// import { registrationApi } from '../../../_api/login/action'
import { registrationApi, googleOAuthExchange } from '../../../_api/login/action'
import { toast } from 'react-toastify'
import Link from 'next/link'

import { CheckCircleIcon, EyeIcon, EyeOffIcon, ScanEyeIcon, XCircleIcon } from 'lucide-react'
import { useGoogleLogin } from '@react-oauth/google'
import { useRouter } from 'next/navigation'
import { useSocket } from "../../../socketContext";

export function RegistrationForm() {
  const { socket } = useSocket();
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [buttonStatus, setButtonStatus] = useState({ loading: false, disabled: true })
  const [passwordMatch, setPasswordMatch] = useState(true)

  const router = useRouter()
  const appUrl: any = process.env.NEXT_PUBLIC_APP_URL

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleSocketEvent = (userId:any) => {
    if (socket) {
      socket.on('user-logged-in', () => {
        socket.emit('join', userId);
      });
    }
  }


  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse: any) => {
      try {
        setGoogleLoading(true)
        const response = await googleOAuthExchange(tokenResponse?.access_token)
        console.log(response,"This is signup response")
        setGoogleLoading(false)
        if (response?.status_code === 200) {
          toast.success('Signed up with Google')
          router.replace(appUrl + 'dashboard')

          if (response.token) {
            localStorage.setItem('token', response.token)
          }
          if (response.userId) {
            localStorage.setItem('userId', response.userId)
            handleSocketEvent(response.userId)
          }

        } else {
          toast.error(response?.message || 'Google signup failed')
        }
      } catch (e: any) {
        setGoogleLoading(false)
        toast.error('Google signup failed')
      }
    },
    onError: () => {
      setGoogleLoading(false)
      toast.error('Google sign-in was cancelled or failed')
    },
    scope: 'openid email profile'
  })

  const handleOnSubmit = async (event: any) => {
    event.preventDefault()
    if (email !== '' && password !== '' && confirmPassword !== '') {
      if (password === confirmPassword) {
        setButtonStatus({ loading: true, disabled: true })
        const response = await registrationApi(email, password)
        setButtonStatus({ loading: false, disabled: false })
        if (response?.status_code == 200) {
          toast.success(response.message)
        } else {
          toast.error(response.message)
        }
      }
    }
  }

  const handleEmailOnChange = (event: any) => {
    const email = event.target.value.trim()
    setEmail(email)
    blankValidation(email, password, confirmPassword)
  }

  const handlePasswordOnChange = (event: any) => {
    const password = event.target.value.trim()
    setPassword(password)
    blankValidation(email, password, confirmPassword)
    passwordMatchValidation(password, confirmPassword)
  }

  const handleConfirmPasswordOnChange = (event: any) => {
    const confirmPassword = event.target.value.trim()
    setConfirmPassword(confirmPassword)
    blankValidation(email, password, confirmPassword)
    passwordMatchValidation(password, confirmPassword)
  }

  const blankValidation = (email: string, password: string, confirmPassword: string): void => {
    if (email === '' || password === '' || confirmPassword === '') {
      setButtonStatus({ ...buttonStatus, disabled: true })
    } else if (password === confirmPassword) {
      setButtonStatus({ ...buttonStatus, disabled: false })
    }
  }

  const passwordMatchValidation = (password: any, confirmPassword: any) => {
    if (confirmPassword === '') {
      setPasswordMatch(true)
      return
    }

    if (password === confirmPassword) {
      setPasswordMatch(true)
      setButtonStatus({ ...buttonStatus, disabled: false })
    } else {
      setPasswordMatch(false)
      setButtonStatus({ ...buttonStatus, disabled: true })
    }
  }

  const getPasswordStrength = (password: any) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }

  const passwordStrength = getPasswordStrength(password)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Create account</h2>
          <p className="mt-2 text-sm text-gray-600">Join us today and get started</p>
        </div>

        {/* Form */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl">

          {/* Social auth */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => {
                if (!googleClientId) {
                  toast.error('Google Client ID not configured')
                  return
                }
                if (!googleLoading) googleLogin()
              }}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50"
              disabled={googleLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12   c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C33.64,6.053,29.082,4,24,4C12.955,4,4,12.955,4,24   c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,16.108,18.961,13,24,13c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657   C33.64,6.053,29.082,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                <path fill="#4CAF50" d="M24,44c5.164,0,9.86-1.977,13.409-5.197l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946   l-6.522,5.026C9.5,39.556,16.227,44,24,44z" />
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.793,2.238-2.231,4.166-4.094,5.565c0,0,0.001,0,0.001,0l6.19,5.238   c-0.438,0.4,6.6-4.826,6.6-14.803C44,22.659,43.862,21.35,43.611,20.083z" />
              </svg>
              {googleLoading ? 'Connecting…' : 'Continue with Google'}
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px bg-gray-200 w-full" />
              <span className="text-xs text-gray-500">or</span>
              <div className="h-px bg-gray-200 w-full" />
            </div>
          </div>
          <form onSubmit={handleOnSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="off"
                value={email}
                onChange={handleEmailOnChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-900 placeholder-gray-500"
                placeholder="Enter your email"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="off"
                  value={password}
                  onChange={handlePasswordOnChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-900 placeholder-gray-500"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex space-x-1 mb-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-2 w-full rounded-full ${level <= passwordStrength
                            ? passwordStrength <= 2
                              ? 'bg-red-400'
                              : passwordStrength <= 3
                                ? 'bg-yellow-400'
                                : 'bg-green-400'
                            : 'bg-gray-200'
                          }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-600">
                    Password strength: {
                      passwordStrength <= 2 ? 'Weak' :
                        passwordStrength <= 3 ? 'Medium' : 'Strong'
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  autoComplete="off"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordOnChange}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 transition-colors duration-200 text-gray-900 placeholder-gray-500 ${confirmPassword === ''
                      ? 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      : passwordMatch
                        ? 'border-green-300 focus:ring-blue-500 focus:border-blue-500'
                        : 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    }`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOffIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Password Match Indicator */}
              {confirmPassword && (
                <div className="mt-2 flex items-center">
                  {passwordMatch ? (
                    <>
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm text-green-600">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <XCircleIcon className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-sm text-red-600">Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={buttonStatus.disabled || buttonStatus.loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {buttonStatus.loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>

            {/* Additional Links */}
            <div className="text-center">
              <span className="text-sm text-gray-600">Already have an account? </span>
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}