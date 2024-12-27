'use client'
import { useState, useEffect } from 'react'
import { loginApi } from '../../../_api/login/action'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'

export default function Home() {
  const [email, setEmail] = useState<any>('')
  const [password, setPassword] = useState<any>('')
  const [buttonStatus, setButtonStatus] = useState({ loading: false, disabled: true })
  const router = useRouter()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  const handleOnSubmit = async (event: any) => {
    event.preventDefault()
    if (email != '' && password != '') {
      setButtonStatus({ loading: true, disabled: true })
      const response = await loginApi(email.trim(), password.trim())
      setButtonStatus({ loading: false, disabled: false })
      if (response?.status_code == 200) {
        router.replace(appUrl+'dashboard')
        localStorage.setItem('token', response.token);
        localStorage.setItem('userId', response.userId);
      } else {
        toast.error(response.message)
      }
    }

  }

  const handleEmailOnChange = (event: any) => {
    setEmail(event.target.value.trim())
    blankValidation(event.target.value.trim(), password)
  }

  const handlePasswordOnChange = (event: any) => {
    setPassword(event.target.value.trim())
    blankValidation(email, event.target.value.trim())
  }

  const blankValidation = (email: any, password: any) => {
    if (email == '' || password == '') {
      setButtonStatus({ ...buttonStatus, disabled: true })
    } else {
      setButtonStatus({ ...buttonStatus, disabled: false })
    }
  }

  return (
    <>
      <form onSubmit={handleOnSubmit}>
        <div className='container'>
          <div className="mb-3">
            <label className="form-label">Email address</label>
            <input type="text" required className="form-control" value={email} onChange={handleEmailOnChange} />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input type="password" required className="form-control" value={password} onChange={handlePasswordOnChange} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={buttonStatus.disabled}>
            {buttonStatus.loading ?
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              : 'Submit'}
          </button>
        </div>
      </form>
    </>
  )
}