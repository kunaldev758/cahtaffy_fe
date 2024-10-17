'use client'

import {  useState } from 'react'
import { Modal } from 'react-bootstrap'
import Image from 'next/image'
import { basePath } from '../../../../../../../next.config'

import webPageIconPic from '@/images/web-page-icon.svg'
import docSnippetsIconPic from '@/images/doc-snippets-icon.svg'
import faqIconPic from '@/images/faq-icon.svg'

import AddwebPageModal from './addWebPageModal'
import AddDocModal from './addDocsModal'
import AddFaqModal from './addFaqModal'

export default function Home(Props: any) {
  const [webPageShowModal, setWebPageShowModal] = useState(false)
  const [docShowModal, setDocShowModal] = useState(false)
  const [faqShowModal, setFaqShowModal] = useState(false)



  return (<>
    <AddwebPageModal showModal={webPageShowModal} onHide={() => { setWebPageShowModal(false) }} />
    <AddDocModal showModal={docShowModal} onHide={() => { setDocShowModal(false) }} />
    <AddFaqModal showModal={faqShowModal} onHide={() => { setFaqShowModal(false) }} />

    <Modal show={Props.showModal} onHide={Props.onHide} size='lg' centered>
      <Modal.Header closeButton>
        <Modal.Title as='h1'>Modal Title</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="new-content-modal">
          <div className="newContent-BoxArea">
            <div className="newContent-modalBox" onClick={()=>{
              Props.onHide()
              setWebPageShowModal(true)
            }}>
              <div className="newContent-Boximg"><Image src={webPageIconPic} alt="" width={24} height={24} /></div>
              <h4>Web Pages</h4>
              <p>Lorem ipsum is placeholder text commonly used in the graphi.</p>
            </div>

            <div className="newContent-modalBox" onClick={()=>{
              Props.onHide()
              setDocShowModal(true)
            }}>
              <div className="newContent-Boximg"><Image src={docSnippetsIconPic} alt="" width={24} height={24} /></div>
              <h4>Doc/Snippets</h4>
              <p>Lorem ipsum is placeholder text commonly used in the graphi.</p>
            </div>

            <div className="newContent-modalBox" onClick={()=>{
              Props.onHide()
              setFaqShowModal(true)
            }}>
              <div className="newContent-Boximg"><Image src={faqIconPic} alt="" width={24} height={24} /></div>
              <h4>FAQs</h4>
              <p>Lorem ipsum is placeholder text commonly used in the graphi.</p>
            </div>
          </div>
          <div className="content-modal-info">By creating content here, you agree to send that content to OpenAI for data processing, as detailed in the</div>
        </div>
      </Modal.Body>
    </Modal>
  </>)
}