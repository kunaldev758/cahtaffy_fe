'use client'

import { useState, useEffect } from 'react'
import { Modal } from 'react-bootstrap'
import Image from 'next/image'
import { basePath } from '@/next.config'

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
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setCurrentAgentId(localStorage.getItem('currentAgentId'))
    const handleAgentChanged = (e: CustomEvent) => {
      const id = (e as CustomEvent).detail?.agentId ?? localStorage.getItem('currentAgentId')
      setCurrentAgentId(id)
    }
    window.addEventListener('agent-changed', handleAgentChanged as EventListener)
    return () => window.removeEventListener('agent-changed', handleAgentChanged as EventListener)
  }, [])

  return (<>
    <AddwebPageModal
      showModal={webPageShowModal}
      onHide={() => { setWebPageShowModal(false) }}
      onBack={() => {
        setWebPageShowModal(false)
        Props.onShow?.()
      }}
      agentId={currentAgentId}
    />
    <AddDocModal
      showModal={docShowModal}
      onHide={() => { setDocShowModal(false) }}
      onBack={() => {
        setDocShowModal(false)
        Props.onShow?.()
      }}
      agentId={currentAgentId}
    />
    <AddFaqModal
      showModal={faqShowModal}
      onHide={() => { setFaqShowModal(false) }}
      onBack={() => {
        setFaqShowModal(false)
        Props.onShow?.()
      }}
      agentId={currentAgentId}
    />

    <Modal show={Props.showModal} onHide={Props.onHide} size='lg' centered>
      <Modal.Header closeButton>
        <Modal.Title as='h1'>Add New Content Source</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="new-content-modal">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-[20px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.02)] border-2 border-slate-100 text-center flex flex-col items-center justify-center gap-[20px] p-[20px] cursor-pointer hover:shadow-[0px_4px_20px_0px_rgba(0,0,0,0.04)] hover:border-slate-200 transition-all duration-300" onClick={() => {
              Props.onHide()
              setWebPageShowModal(true)
            }}>
              <div className="w-[44px] h-[44px] max-w-[44px] max-h-[44px] rounded-lg flex items-center justify-center bg-[#EEF2FF]">
                <span className="material-symbols-outlined text-[#4F46E5] !text-[20px]">language</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-1.5">
                <h3 className='text-gray-900 text-base font-bold'>Web Pages</h3>
                <p className='w-44 justify-center text-slate-500 text-[13px] font-normal capitalize leading-5'>Crawl your website for knowledge</p>
              </div>
            </div>

            <div className="bg-white rounded-[20px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.02)] border-2 border-slate-100 text-center flex flex-col items-center justify-center gap-[20px] p-[20px] cursor-pointer hover:shadow-[0px_4px_20px_0px_rgba(0,0,0,0.04)] hover:border-slate-200 transition-all duration-300" onClick={() => {
              Props.onHide()
              setDocShowModal(true)
            }}>
              <div className="w-[44px] h-[44px] max-w-[44px] max-h-[44px] rounded-lg flex items-center justify-center bg-[#EAFFEA]">
                <span className="material-symbols-outlined text-[#399E39] !text-[20px]">description</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-1.5">
                <h3 className='text-gray-900 text-base font-bold'>Doc/Snippets</h3>
                <p className='w-44 justify-center text-slate-500 text-[13px] font-normal capitalize leading-5'>Upload PDF, TXT, or Docx files</p>
              </div>
            </div>

            <div className="bg-white rounded-[20px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.02)] border-2 border-slate-100 text-center flex flex-col items-center justify-center gap-[20px] p-[20px] cursor-pointer hover:shadow-[0px_4px_20px_0px_rgba(0,0,0,0.04)] hover:border-slate-200 transition-all duration-300" onClick={() => {
              Props.onHide()
              setFaqShowModal(true)
            }}>
              <div className="w-[44px] h-[44px] max-w-[44px] max-h-[44px] rounded-lg flex items-center justify-center bg-[#FFF1F2]">
                <span className="material-symbols-outlined text-[#F43F5E] !text-[20px]">quiz</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-1.5">
                <h3 className='text-gray-900 text-base font-bold'>FAQs</h3>
                <p className='w-44 justify-center text-slate-500 text-[13px] font-normal capitalize leading-5'>Manually add question-answer pairs</p>
              </div>
            </div>
          </div>
          <div className="text-slate-500 text-[13px] font-normal capitalize leading-5 text-center mt-[20px]">By creating content here, you agree to send that content to OpenAI for data processing, as detailed in the</div>
        </div>
      </Modal.Body>
    </Modal>
  </>)
}