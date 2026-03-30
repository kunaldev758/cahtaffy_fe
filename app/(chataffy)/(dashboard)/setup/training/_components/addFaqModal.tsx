'use client'

import { useState } from 'react'
import { openaiCreateFaq } from '@/app/_api/dashboard/action'
import { toast } from 'react-toastify'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import Image from 'next/image'
import { publicAsset } from '@/lib/publicAsset'

interface FaqItem {
  id: number
  question: string
  answer: string
}

export default function Home(Props: any) {
  const { showModal, onHide, agentId, onBack } = Props
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
      const response: any = await openaiCreateFaq(faqs, agentId ?? undefined)
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
      onHide()
      setFaqs([{ id: 1, question: '', answer: '' }])
    } else {
      toast.error("Failed to add FAQs. Please try again.")
    }
  }

  const handleCancel = () => {
    onHide()
    setFaqs([{ id: 1, question: '', answer: '' }])
  }

  return (
    <Dialog
      open={showModal}
      onOpenChange={(open) => {
        if (!open) handleCancel()
      }}
    >
      <DialogContent className="w-full max-w-[600px] p-0 overflow-hidden border border-[#E2E8F0] bg-white">
        <div className="bg-[#F9FBFD] px-[20px] py-[15px] border-b border-[#E5E5E5] flex items-center gap-2">
          <span
            className="material-symbols-outlined !text-[20px] cursor-pointer"
            onClick={() => {
              if (onBack) {
                onBack()
                setFaqs([{ id: 1, question: '', answer: '' }])
              } else {
                handleCancel()
              }
            }}
          >
            arrow_back
          </span>
          <h1 className="text-sm font-semibold text-[#111827]">Add New FAQs</h1>
        </div>

        <div className="px-[20px]">
          <div className="new-webPage-modalArea">
            <div className="snippetsAdd-area Add-FAQsList mt-0">
              <div className="FAQ-modalScroll custom-scrollbar">
                <div className="FAQs-addArea">
                  {faqs.map((faq, index) => (
                    <div
                      key={faq.id}
                      className={index === 0 ? '' : 'FAQs-addBox'}
                      style={{ marginBottom: '15px', position: 'relative' }}
                    >
                      <div className="w-full">
                        <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">Question</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            placeholder="e.g. What is your shipping rates?"
                            value={faq.question}
                            onChange={(event) => updateFaq(faq.id, 'question', event.target.value)}
                            className="h-[40px] flex-1 w-full rounded-[8px] border border-[#E2E8F0] bg-white px-[14px] text-[13px] leading-5 text-[#111827] outline-none placeholder:text-[#94A3B8]"
                          />

                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => removeFaq(faq.id)}
                              className="w-10 h-10 bg-white rounded-lg outline outline-1 outline-offset-[-1px] outline-gray-200 inline-flex justify-center items-center"
                              title="Remove FAQ"
                            >
                              <span className="material-symbols-outlined !text-[20px] text-[#FF6D6D]">delete</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="w-full mt-[12px]">
                        <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">Answer</label>
                        <textarea
                          rows={4}
                          placeholder="Enter the answer to this question..."
                          value={faq.answer}
                          onChange={(event) => updateFaq(faq.id, 'answer', event.target.value)}
                          className="h-[100px] w-full resize-none rounded-[8px] border border-[#E2E8F0] bg-white px-[14px] py-3 text-[13px] leading-5 text-[#111827] outline-none placeholder:text-[#94A3B8]"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addNewFaq}
                    className="inline-flex items-center justify-center gap-2 h-10 px-4 bg-[#111827] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1f2937] disabled:bg-[#CBD5E1] disabled:text-[#64748B] disabled:cursor-not-allowed transition-colors text-center w-full"
                  >
                    <span className="material-symbols-outlined !text-[20px]">
                      add
                    </span>
                     Add Another FAQs
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-[20px] py-[20px] border-t border-[#E5E5E5] flex justify-between items-center bg-[#F9FBFD]">
          <button type="button" className="text-sm font-bold text-[#64748B] hover:text-[#111827] cursor-pointer" onClick={handleCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 h-10 px-4 bg-[#111827] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1f2937] disabled:bg-[#CBD5E1] disabled:text-[#64748B] disabled:cursor-not-allowed transition-colors"
            onClick={handleButtonOnClick}
            disabled={buttonLoading}
          >
            <Image src={publicAsset('/images/new/sparkle-icon.svg')} alt="Sparkle" width={18} height={18} />
            {`Start ${faqs.length} FAQs Training${faqs.length > 1 ? 's' : ''}`}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}