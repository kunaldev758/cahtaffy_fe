
// Login Component
'use client'
import { useState, useEffect } from 'react'
import { loginApi } from '../../../_api/login/action'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { useSocket } from "../../../socketContext";
import { EyeIcon, EyeOffIcon } from 'lucide-react'


export function LoginForm() {
  const { socket } = useSocket();
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [buttonStatus, setButtonStatus] = useState({ loading: false, disabled: true })
  const router = useRouter()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  const handleOnSubmit = async (event:any) => {
    event.preventDefault()
    if (email !== '' && password !== '') {
      setButtonStatus({ loading: true, disabled: true })
      const response = await loginApi(email.trim(), password.trim())
      setButtonStatus({ loading: false, disabled: false })
      if (response?.status_code == 200) {
        router.replace(appUrl + 'dashboard')
        localStorage.setItem('token', response.token);
        localStorage.setItem('userId', response.userId);
        handleSocketEvent(response.userId)
      } else {
        toast.error(response.message)
      }
    }
  }

  const handleSocketEvent = (userId:any) => {
    if (socket) {
      socket.on('user-logged-in', () => {
        socket.emit('join', userId);
      });
    }
  }

  const handleEmailOnChange = (event:any) => {
    setEmail(event.target.value.trim())
    blankValidation(event.target.value.trim(), password)
  }

  const handlePasswordOnChange = (event:any) => {
    setPassword(event.target.value.trim())
    blankValidation(email, event.target.value.trim())
  }

  const blankValidation = (email:any, password:any) => {
    if (email === '' || password === '') {
      setButtonStatus({ ...buttonStatus, disabled: true })
    } else {
      setButtonStatus({ ...buttonStatus, disabled: false })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Welcome back</h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
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
                  value={password}
                  onChange={handlePasswordOnChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-900 placeholder-gray-500"
                  placeholder="Enter your password"
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
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>

            {/* Additional Links */}
            <div className="flex items-center justify-center">
            
              <div className="text-sm">
                <span className="text-gray-600">Don't have an account? </span>
                <a href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign up
                </a>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}