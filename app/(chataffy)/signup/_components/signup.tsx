// Registration Component
'use client'
import { useState } from 'react';
import { registrationApi } from '../../../_api/login/action'
import { toast } from 'react-toastify'
import Link from 'next/link'

import { CheckCircleIcon, EyeIcon, EyeOffIcon, ScanEyeIcon, XCircleIcon } from 'lucide-react'

export function RegistrationForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [buttonStatus, setButtonStatus] = useState({ loading: false, disabled: true })
  const [passwordMatch, setPasswordMatch] = useState(true)

  const handleOnSubmit = async (event:any) => {
    event.preventDefault()
    if (email !== '' && password !== '' && confirmPassword !== '') {
      if (password === confirmPassword) {
        setButtonStatus({ loading: true, disabled: true })
        const response = await registrationApi(email, password)
        setButtonStatus({ loading: false, disabled: false })
        if(response?.status_code == 200){
        toast.success(response.message)
        }else{
        toast.error(response.message)
        }
      }
    }
  }

  const handleEmailOnChange = (event:any) => {
    const email = event.target.value.trim()
    setEmail(email)
    blankValidation(email, password, confirmPassword)
  }

  const handlePasswordOnChange = (event:any) => {
    const password = event.target.value.trim()
    setPassword(password)
    blankValidation(email, password, confirmPassword)
    passwordMatchValidation(password, confirmPassword)
  }

  const handleConfirmPasswordOnChange = (event:any) => {
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

  const passwordMatchValidation = (password:any, confirmPassword:any) => {
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

  const getPasswordStrength = (password:any) => {
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
                        className={`h-2 w-full rounded-full ${
                          level <= passwordStrength
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
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 transition-colors duration-200 text-gray-900 placeholder-gray-500 ${
                    confirmPassword === '' 
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