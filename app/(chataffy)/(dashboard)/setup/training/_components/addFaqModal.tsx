'use client'

import { useState } from 'react'
import { Modal } from 'react-bootstrap'
import { openaiCreateFaq } from '@/app/_api/dashboard/action'
import { toast } from 'react-toastify'

interface FaqItem {
  id: number
  question: string
  answer: string
}

export default function Home(Props: any) {
  const [faqs, setFaqs] = useState<FaqItem[]>([{ id: 1, question: '', answer: '' }])
  const [buttonLoading, setButtonLoading] = useState(false)

  const addNewFaq = () => {
    const newId = faqs.length > 0 ? Math.max(...faqs.map(f => f.id)) + 1 : 1
    setFaqs([...faqs, { id: newId, question: '', answer: '' }])
  }

  const removeFaq = (id: number) => {
    if (faqs.length > 1) {
      setFaqs(faqs.filter(faq => faq.id !== id))
    } else {
      toast.error("At least one FAQ entry is required")
    }
  }

  const updateFaq = (id: number, field: 'question' | 'answer', value: string) => {
    setFaqs(faqs.map(faq => 
      faq.id === id ? { ...faq, [field]: value } : faq
    ))
  }

  const handleButtonOnClick = async () => {
    // Validate all FAQs
    for (const faq of faqs) {
      if (faq.question.trim().length === 0) {
        toast.error("Enter Question for all FAQs")
        return false
      }
      if (faq.answer.trim().length === 0) {
        toast.error("Enter Answer for all FAQs")
        return false
      }
    }

    setButtonLoading(true)
    let successCount = 0
    let errorCount = 0

    // Save all FAQs
    // for (const faq of faqs) {
      try {
        const response: any = await openaiCreateFaq(faqs)
        if (response && response.message) {
          successCount++
        } else {
          errorCount++
        }
      } catch (error) {
        errorCount++
      }
    // }

    setButtonLoading(false)
    
    if (errorCount === 0) {
      // toast.success(`Successfully added ${successCount} FAQ${successCount > 1 ? 's' : ''}`)
      Props.onHide()
      setFaqs([{ id: 1, question: '', answer: '' }])
    } else if (successCount > 0) {
      // toast.warning(`Added ${successCount} FAQ${successCount > 1 ? 's' : ''}, but ${errorCount} failed`)
      Props.onHide()
      setFaqs([{ id: 1, question: '', answer: '' }])
    } else {
      toast.error("Failed to add FAQs. Please try again.")
    }
  }

  const handleCancel = () => {
    Props.onHide()
    setFaqs([{ id: 1, question: '', answer: '' }])
  }

  return (<>
    <Modal show={Props.showModal} onHide={handleCancel} size='lg' centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title as='h1'>Add New FAQs</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="new-webPage-modalArea">   
            <div className="snippetsAdd-area Add-FAQsList mt-0">
              <div className="FAQ-modalScroll custom-scrollbar">
                <div className="FAQs-addArea">
                  {faqs.map((faq, index) => (
                    <div key={faq.id} className="FAQs-addBox" style={{ marginBottom: '15px', position: 'relative' }}>
                      {faqs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFaq(faq.id)}
                          style={{
                            position: 'absolute',
                            top: '5px',
                            right: '5px',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '25px',
                            height: '25px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10
                          }}
                          title="Remove FAQ"
                        >
                          ×
                        </button>
                      )}
                      <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>
                        FAQ {index + 1}
                      </div>
                      <input 
                        placeholder="Enter Question..." 
                        type="text"  
                        className="form-control" 
                        value={faq.question} 
                        onChange={(event) => updateFaq(faq.id, 'question', event.target.value)}
                        style={{ marginBottom: '10px' }}
                      />
                      <textarea 
                        placeholder="Enter the answer to the question" 
                        className="form-control" 
                        value={faq.answer} 
                        onChange={(event) => updateFaq(faq.id, 'answer', event.target.value)}
                        rows={3}
                      ></textarea>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addNewFaq}
                    className="custom-btn default-btn"
                    style={{ 
                      width: '100%', 
                      marginTop: '10px',
                      background: '#f8f9fa',
                      border: '1px dashed #ccc'
                    }}
                  >
                    + Add Another FAQ
                  </button>
                </div>
            </div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer className="flex justify-content-space-between">
        <button type="button" className="custom-btn default-btn" onClick={handleCancel}>
          Cancel
        </button>
        <button type="button" className="custom-btn" onClick={handleButtonOnClick} disabled={buttonLoading}>
          {buttonLoading ?
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            : `Save ${faqs.length} FAQ${faqs.length > 1 ? 's' : ''}`}
        </button>
      </Modal.Footer>
    </Modal>
  </>)
}