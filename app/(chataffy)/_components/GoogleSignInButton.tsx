'use client'

import { useGoogleLogin } from '@react-oauth/google'

const buttonClassName =
  'w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50'

export function GoogleSignInButton({
  onSuccess,
  onError,
  loading = false,
  label = 'Continue with Google',
}: {
  onSuccess: (accessToken: string) => void
  onError?: () => void
  loading?: boolean
  label?: string
}) {
  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      if (tokenResponse?.access_token) {
        onSuccess(tokenResponse.access_token)
        return
      }
      onError?.()
    },
    onError: () => onError?.(),
    scope: 'openid email profile',
    flow: 'implicit',
  })

  return (
    <button
      type="button"
      onClick={() => {
        if (!loading) googleLogin()
      }}
      className={buttonClassName}
      disabled={loading}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12   c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C33.64,6.053,29.082,4,24,4C12.955,4,4,12.955,4,24   c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,16.108,18.961,13,24,13c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657   C33.64,6.053,29.082,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.164,0,9.86-1.977,13.409-5.197l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946   l-6.522,5.026C9.5,39.556,16.227,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.793,2.238-2.231,4.166-4.094,5.565c0,0,0.001,0,0.001,0l6.19,5.238   c-0.438,0.4,6.6-4.826,6.6-14.803C44,22.659,43.862,21.35,43.611,20.083z" />
      </svg>
      {loading ? 'Connecting…' : label}
    </button>
  )
}

export function GoogleSignInUnavailableButton({
  onClick,
}: {
  onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} className={buttonClassName}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12   c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C33.64,6.053,29.082,4,24,4C12.955,4,4,12.955,4,24   c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,16.108,18.961,13,24,13c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657   C33.64,6.053,29.082,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.164,0,9.86-1.977,13.409-5.197l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946   l-6.522,5.026C9.5,39.556,16.227,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.793,2.238-2.231,4.166-4.094,5.565c0,0,0.001,0,0.001,0l6.19,5.238   c-0.438,0.4,6.6-4.826,6.6-14.803C44,22.659,43.862,21.35,43.611,20.083z" />
      </svg>
      Continue with Google
    </button>
  )
}
