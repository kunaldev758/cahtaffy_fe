'use client'

import { useState } from 'react'
import { Modal } from 'react-bootstrap'
import { openaiCreateFaq } from '@/app/_api/dashboard/action'
import { ToastContainer, toast } from 'react-toastify'
import Image from 'next/image'
import { basePath } from '@/next.config'

export default function Home(Props: any) {
  const [toggle, setToggle] = useState(true)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [buttonLoading, setButtonLoading] = useState(false)

  const handleButtonOnClick = async () => {
    
    if (title.trim().length == 0) {
      toast.error("Enter Question")
      return false
    }

    if (content.trim().length == 0) {
      toast.error("Enter Answer")
      return false
    }

    setButtonLoading(true)
    const response: any = await openaiCreateFaq(title, content)
    setButtonLoading(false)
    Props.onHide()
    toast.success(response.message)

  }

  return (<>

    <Modal show={Props.showModal} onHide={Props.onHide} size='sm' centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title as='h1'>Add New Faq</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="new-webPage-modalArea">   
            <div className="snippetsAdd-area Add-FAQsList mt-0">
              {/* <div class="specific-urlHeading align-item-center FAQsList-Head">
                  <h4 class="mb-0">Add Manually </h4>
                  <button type="button" class="custom-btn">Add New FAQ</button>
              </div> */}
              <div className="FAQ-modalScroll custom-scrollbar">
                <div className="FAQs-addArea">
                    <div className="FAQs-addBox">
                        <input placeholder="Enter Question..." type="text"  className="form-control" value={title} onChange={(event) => {
              setTitle(event.target.value)
            }} />
                        <textarea placeholder="Enter the answer to the question" className="form-control" value={content} onChange={(event) => {
              setContent(event.target.value)
            }}></textarea>
                    </div>
                </div>

                {/* <div className="FAQs-addArea newFAQ-add">
                    <div className="FAQs-addBox">
                        <button type="button" className="btn btn-light"><img src="images/delete-icon.svg" alt=""></button>
                        <input placeholder="Enter Question..." type="text"  className="form-control" />
                        <textarea placeholder="Enter the answer to the question" className="form-control"></textarea>
                    </div>
                </div> */}
            </div>
              {/* <div className="input-box">
                  <input type="text" placeholder="Enter question" className="form-control" value={title} onChange={(event) => {
              setTitle(event.target.value)
            }}  />
                </div>

                <div className="specific-urlBox mt-20">
                  <textarea className="form-control" placeholder="Start writing your answer..." value={content} onChange={(event) => {
              setContent(event.target.value)
            }}></textarea>
                  <div className="characterCountbox">1000</div>
                </div> */}
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