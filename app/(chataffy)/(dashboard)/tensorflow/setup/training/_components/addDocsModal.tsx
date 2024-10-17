'use client'

import { useState } from 'react'
import { Modal } from 'react-bootstrap'
import { tensorflowCreateSnippet } from '../../../../../../_api/dashboard/action'
import { ToastContainer, toast } from 'react-toastify'
import Image from 'next/image'
import { basePath } from '../../../../../../../next.config'

export default function Home(Props: any) {
  const [toggle, setToggle] = useState(true)
  // const [url, setUrl] = useState('')
  // const [urls, setUrls] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [buttonLoading, setButtonLoading] = useState(false)

  const handleButtonOnClick = async () => {
    
    if (title.trim().length == 0) {
      toast.error("Enter Title")
      return false
    }

    if (content.trim().length == 0) {
      toast.error("Enter Content")
      return false
    }

    setButtonLoading(true)
    const response: any = await tensorflowCreateSnippet(title, content)
    setButtonLoading(false)
    Props.onHide()
    toast.success(response.message)
    // if (response == 'error')
    // router.push('/login')
  }

  return (<>

    <Modal show={Props.showModal} onHide={Props.onHide} size='sm' centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title as='h1'>Add New Doc/Snippets</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="new-webPage-modalArea">
        {!toggle &&
          <div className="dragUpload-area">
            <div className="upload-fileIcon"><Image src={`${basePath}/images/file-upload.svg`} alt="" width={65} height={65} /></div>
            <div className="upload-fileHeading">Drop your image here, or browse</div>
            <div className="upload-filePera">Only EXCEL, PDF files with max size 15 MB.</div>
          </div>}

          <div className="snippetsAdd-area">
            {/* <div className="specific-urlHeading">
              <h4>You can also provide Snippets</h4>
              <label className="toggle">
                <input className="toggle-checkbox" type="checkbox" checked={toggle} onChange={() => { setToggle(!toggle) }} />
                <div className="toggle-switch"></div>
              </label>
            </div> */}

            {toggle &&
              <>
                <div className="input-box">
                  <input type="text" placeholder="Enter a title" className="form-control" value={title} onChange={(event) => {
              setTitle(event.target.value)
            }}  />
                </div>

                <div className="specific-urlBox mt-20">
                  <textarea className="form-control" placeholder="Start writing your content..." value={content} onChange={(event) => {
              setContent(event.target.value)
            }}></textarea>
                  <div className="characterCountbox">1000</div>
                </div>
              </>
            }
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer className="flex justify-content-space-between">
        <button type="button" className="custom-btn default-btn" onClick={() => {
          Props.onHide()
        }}>Cancel</button>
        <button type="button" className="custom-btn" onClick={handleButtonOnClick} disabled={buttonLoading}>
          {buttonLoading ?
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            : 'Save'}
        </button>
      </Modal.Footer>
    </Modal>
  </>)
}