'use client'

import {  useState } from 'react';
import {registrationApi} from '../../../_api/login/action'
import {toast} from 'react-toastify'

export default function Home() {
  const [email, setEmail] = useState<any>('')
  const [password, setPassword] = useState<any>('')
  const [confirmPassword, setConfirmPassword] = useState<any>('')
  const [buttonStatus, setButtonStatus] = useState({ loading: false, disabled: true })
  const [message, setMessage] = useState('')


  const handleOnSubmit = async(event:any) => {
    event.preventDefault()
    if (email != '' && password != '' && confirmPassword != '') {
      if (password == confirmPassword) {
        setButtonStatus({ loading: true, disabled: true })
        const response = await registrationApi(email,password)
        setButtonStatus({ loading: false, disabled: false })
        toast.error(response.message)
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
    passwordMatch(password, confirmPassword)
  }

  const handleConfirmPasswordOnChange = (event: any) => {
    const confirmPassword = event.target.value.trim()
    setConfirmPassword(confirmPassword)
    blankValidation(email, password, confirmPassword)
    passwordMatch(password, confirmPassword)
  }

  const blankValidation = (email: any, password: any, confirmPassword: any) => {
    if (email == '' || password == '' || confirmPassword == '') {
      setButtonStatus({ ...buttonStatus, disabled: true })
    } else {
      setButtonStatus({ ...buttonStatus, disabled: false })
    }
  }

  const passwordMatch = (password: any, confirmPassword: any) => {
    if (password == confirmPassword) {
      setMessage('')
      setButtonStatus({ ...buttonStatus, disabled: false })
    } else {
      setMessage('Password and confirmpassword Does not match')
      setButtonStatus({ ...buttonStatus, disabled: true })
    }
  }

  return (
    <>
      <div className='container'>{message}</div>
      <form onSubmit={handleOnSubmit}>
        <div className='container'>
          <div className="mb-3">
            <label className="form-label">Email address</label>
            <input type="email" required className="form-control" autoComplete='off' onChange={handleEmailOnChange} value={email} />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input type="password" required className="form-control" autoComplete='off' onChange={handlePasswordOnChange} value={password} />
          </div>
          <div className="mb-3">
            <label className="form-label">Confirm Password</label>
            <input type="password" required className="form-control" autoComplete='off' onChange={handleConfirmPasswordOnChange} value={confirmPassword} />
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