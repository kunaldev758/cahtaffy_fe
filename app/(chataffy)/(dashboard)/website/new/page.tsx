'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { publicAsset } from '@/lib/publicAsset'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { Spinner } from '@/components/ui/spinner'
import TrainSetup from '../../../onboarding/components/train-setup'
import WidgetSetup from '../../../onboarding/components/widget-setup'
import { getSitemapUrlsApi, startSitemapScrapingApi, openaiCreateSnippet, openaiCreateFaq, updateAgentSettingsApi, updateOnboardingStepApi } from '@/app/_api/dashboard/action'
import { deleteAIAgentApi } from '@/app/_api/login/action'

type SetupTab = 'web' | 'docs' | 'faqs'
type SetupStep = 'source' | 'train' | 'widget'

export default function NewAgentOnboardingPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<SetupTab>('web')
  const [currentStep, setCurrentStep] = useState<SetupStep>('source')
  const [isCardVisible, setIsCardVisible] = useState(true)
  const [isSwitchingCard, setIsSwitchingCard] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isSnippetsEnabled, setIsSnippetsEnabled] = useState(false)
  const [snippetTitle, setSnippetTitle] = useState('')
  const [snippetContent, setSnippetContent] = useState('')
  const [faqItems, setFaqItems] = useState<Array<{ id: number; question: string; answer: string }>>([
    { id: 1, question: '', answer: '' }
  ])
  const [isCancelling, setIsCancelling] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isIntentionalExit = useRef(false)

  const [websiteUrl, setWebsiteUrl] = useState('')
  const [extractedUrls, setExtractedUrls] = useState<string[]>([])
  const [fetchStep, setFetchStep] = useState<'idle' | 'logo' | 'colors' | 'links' | 'done' | 'error'>('idle')
  const [isFetchingUrls, setIsFetchingUrls] = useState(false)
  const [isTrainingUrls, setIsTrainingUrls] = useState(false)
  const [isDocsTraining, setIsDocsTraining] = useState(false)
  const [isFaqTraining, setIsFaqTraining] = useState(false)

  const [agentId, setAgentId] = useState<string | null>(null)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = localStorage.getItem('currentAgentId')
      if (!id) {
        // No agent in progress — go back to website list
        router.replace('/website')
        return
      }
      setAgentId(id)
    }
  }, [router])

  const removeAgentFromStorage = (deletedId: string | null, prevAgentId: string | null) => {
    if (deletedId) {
      try {
        const existing = JSON.parse(localStorage.getItem('agents') || '[]')
        localStorage.setItem('agents', JSON.stringify(existing.filter((a: any) => a._id !== deletedId)))
      } catch { /* keep array as-is */ }
    }
    if (prevAgentId) {
      localStorage.setItem('currentAgentId', prevAgentId)
    } else {
      localStorage.removeItem('currentAgentId')
    }
    localStorage.removeItem('previousAgentId')
    window.dispatchEvent(new CustomEvent('agent-changed', { detail: { agentId: prevAgentId ?? null } }))
  }

  // Auto-delete agent if user navigates away mid-flow without finishing
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isIntentionalExit.current) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (!isIntentionalExit.current) {
        const newAgentId = localStorage.getItem('currentAgentId')
        const prevAgentId = localStorage.getItem('previousAgentId')
        if (newAgentId) {
          deleteAIAgentApi(newAgentId).catch(() => {})
        }
        removeAgentFromStorage(newAgentId, prevAgentId)
      }
    }
  }, [])

  const isDocSnippets = activeTab === 'docs'
  const isFaqs = activeTab === 'faqs'
  const isWidgetStep = currentStep === 'widget'

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploadedFileName(files[0].name)
    setUploadedFile(files[0])
  }

  const handleAddFaq = () => {
    setFaqItems((prev) => [...prev, { id: Date.now(), question: '', answer: '' }])
  }

  const handleRemoveFaq = (id: number) => {
    setFaqItems((prev) => prev.filter((item) => item.id !== id))
  }

  const updateFaq = (id: number, field: 'question' | 'answer', value: string) => {
    setFaqItems((prev) => prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)))
  }

  const transitionToStep = (nextStep: SetupStep) => {
    if (isSwitchingCard || currentStep === nextStep) return
    setIsSwitchingCard(true)
    setIsCardVisible(false)
    window.setTimeout(() => {
      setCurrentStep(nextStep)
      window.requestAnimationFrame(() => setIsCardVisible(true))
      setIsSwitchingCard(false)
    }, 220)
  }

  // Cancel: delete the newly created agent and restore previous
  const handleCancel = async () => {
    if (isCancelling) return
    isIntentionalExit.current = true
    setIsCancelling(true)
    try {
      const newAgentId = localStorage.getItem('currentAgentId')
      const prevAgentId = localStorage.getItem('previousAgentId')
      if (newAgentId) {
        await deleteAIAgentApi(newAgentId)
      }
      removeAgentFromStorage(newAgentId, prevAgentId)
      router.replace('/website')
    } catch {
      toast.error('Failed to cancel. Please try again.')
      setIsCancelling(false)
    }
  }

  // Complete: clear previousAgentId, stay with new agent, go to website
  const handleFinish = () => {
    isIntentionalExit.current = true
    const confirmedAgentId = localStorage.getItem('currentAgentId')
    localStorage.removeItem('previousAgentId')
    window.dispatchEvent(new CustomEvent('agent-changed', { detail: { agentId: confirmedAgentId } }))
    router.replace('/website')
  }

  const extractAgentNameFromUrl = (url: string): string => {
    try {
      const hostname = new URL(url).hostname
      const withoutWww = hostname.replace(/^www\./, '')
      const domain = withoutWww.split('.')[0]
      return domain.charAt(0).toUpperCase() + domain.slice(1)
    } catch {
      return ''
    }
  }

  const handleWebContinue = async () => {
    const url = websiteUrl.trim()
    if (!url) { toast.error('Please enter a website URL'); return }
    if (!agentId) { toast.error('Session expired. Please log in again.'); return }
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`
    setIsFetchingUrls(true)
    setFetchStep('logo')
    const stepInterval = setInterval(() => {
      setFetchStep((s) => {
        if (s === 'logo') return 'colors'
        if (s === 'colors') return 'links'
        return s
      })
    }, 800)
    try {
      const res = await getSitemapUrlsApi(normalizedUrl, agentId)
      clearInterval(stepInterval)
      if (res?.success && Array.isArray(res.urls)) {
        setExtractedUrls(res.urls)
        setFetchStep('done')
        const agentName = extractAgentNameFromUrl(normalizedUrl)
        if (agentName && agentId) {
          updateAgentSettingsApi({ agentId, agentName }).catch(() => {})
        }
        if (res.urls.length > 0) {
          updateOnboardingStepApi(agentId, 'train', normalizedUrl, res.urls).catch(() => {})
          transitionToStep('train')
        } else {
          toast.error('No URLs found. Please try a different website.')
        }
      } else {
        setFetchStep('error')
        toast.error(res?.error || res?.message || 'Failed to extract URLs')
      }
    } catch (err) {
      clearInterval(stepInterval)
      setFetchStep('error')
      toast.error(err instanceof Error ? err.message : 'Failed to extract URLs')
    } finally {
      setIsFetchingUrls(false)
    }
  }

  const handleTrainContinue = async (selectedUrls: string[]) => {
    if (!agentId) { toast.error('Session expired. Please log in again.'); return }
    setIsTrainingUrls(true)
    try {
      const res = await startSitemapScrapingApi(agentId, selectedUrls)
      if (res?.success) {
        toast.success('Training started successfully')
        updateOnboardingStepApi(agentId, 'widget').catch(() => {})
        transitionToStep('widget')
      } else {
        toast.error(res?.error || res?.message || 'Failed to start training')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start training')
    } finally {
      setIsTrainingUrls(false)
    }
  }

  const handleDocsTrain = async () => {
    if (!agentId) { toast.error('Session expired. Please log in again.'); return }
    const formData = new FormData()
    if (uploadedFile) formData.append('file', uploadedFile)
    if (isSnippetsEnabled) {
      if (!snippetTitle.trim()) { toast.error('Enter a title for the snippet'); return }
      if (!snippetContent.trim()) { toast.error('Enter content for the snippet'); return }
      formData.append('title', snippetTitle)
      formData.append('content', snippetContent)
    }
    if (!uploadedFile && !isSnippetsEnabled) { toast.error('Please upload a file or add a snippet'); return }
    setIsDocsTraining(true)
    try {
      const res = await openaiCreateSnippet(formData, agentId)
      if (res?.status !== false && !res?.errorCode) {
        toast.success(res?.message || 'Document added successfully')
        updateOnboardingStepApi(agentId, 'widget').catch(() => {})
        transitionToStep('widget')
      } else {
        toast.error(res?.error || res?.message || 'Failed to add document')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add document')
    } finally {
      setIsDocsTraining(false)
    }
  }

  const handleFaqTrain = async () => {
    if (!agentId) { toast.error('Session expired. Please log in again.'); return }
    const validFaqs = faqItems
      .filter((f) => f.question.trim() && f.answer.trim())
      .map((f) => ({ question: f.question.trim(), answer: f.answer.trim(), id: f.id }))
    if (validFaqs.length === 0) { toast.error('Add at least one FAQ with question and answer'); return }
    setIsFaqTraining(true)
    try {
      const res = await openaiCreateFaq(validFaqs, agentId)
      if (res?.status !== false && !res?.errorCode) {
        toast.success('FAQs added successfully')
        updateOnboardingStepApi(agentId, 'widget').catch(() => {})
        transitionToStep('widget')
      } else {
        toast.error(res?.message || res?.error || 'Failed to add FAQs')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add FAQs')
    } finally {
      setIsFaqTraining(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-6">
      {/* Header row with title + cancel */}
      <div className="flex items-center justify-between mb-6 max-w-[1106px] mx-auto">
        <div>
          <h1 className="text-xl font-bold text-[#111827]">New AI Agent Setup</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Train your agent with your content to get started.</p>
        </div>
        <button
          onClick={handleCancel}
          disabled={isCancelling}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#64748B] rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-60"
          title="Cancel and discard this agent"
        >
          {isCancelling ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <X className="w-4 h-4" />
          )}
          {isCancelling ? 'Cancelling...' : 'Cancel'}
        </button>
      </div>

      <div
        className={`mx-auto mt-6 w-full transition-all duration-300 ease-out will-change-transform ${
          isWidgetStep
            ? 'max-w-[1106px]'
            : 'max-w-[900px] overflow-hidden rounded-[20px] bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.02)]'
        } ${isCardVisible ? 'opacity-100 translate-y-0 scale-100' : 'pointer-events-none opacity-0 translate-y-1 scale-[0.985]'}`}
      >
        {currentStep === 'train' ? (
          <TrainSetup
            urls={extractedUrls}
            sourceDomain={(() => {
              try {
                return websiteUrl
                  ? new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`).hostname
                  : undefined
              } catch {
                return undefined
              }
            })()}
            onContinue={handleTrainContinue}
            isTraining={isTrainingUrls}
          />
        ) : currentStep === 'widget' ? (
          <WidgetSetup onFinish={handleFinish} />
        ) : (
          <>
            {isDocSnippets ? (
              <div>
                <div className="flex flex-col items-center gap-6 py-[30px]">
                  <div className="flex h-[70px] w-[70px] items-center justify-center rounded-full bg-[#EAFFEA]">
                    <span className="material-symbols-outlined !text-[35px] text-[#399E39]">description</span>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <h1 className="mt-6 text-[22px] font-bold leading-8 text-[#111827] md:text-2xl">
                      Let&apos;s Start With Documents
                    </h1>
                    <p className="text-sm font-medium leading-6 text-[#64748B] text-center max-w-full md:max-w-[522px]">
                      Upload your documents, and our AI will extract the information to build a personalized knowledge base in seconds.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 w-full md:max-w-[560px]">
                    <div className="flex flex-col">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => fileInputRef.current?.click()}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click() } }}
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFileSelect(e.dataTransfer.files) }}
                        className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors duration-200 ${isDragOver ? 'border-[#4686FE] bg-[#EEF2FF]' : 'border-[#E5E5E5] bg-[#fff]'}`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".doc,.docx,.pdf,.txt"
                          className="hidden"
                          onChange={(e) => handleFileSelect(e.target.files)}
                        />
                        <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center">
                          <Image src={publicAsset('/images/new/upload-icon.svg')} alt="Upload" width={64} height={64} />
                        </div>
                        <p className="text-[14px] font-semibold leading-5 text-[#111827]">Drop your file here, or browse</p>
                        <p className="mt-2 text-[13px] font-normal leading-5 text-[#64748B]">Only DOC, DOCX, PDF, TXT files are allowed.</p>
                        {uploadedFileName && (
                          <p className="mt-3 text-[13px] font-medium leading-5 text-[#111827]">Selected: {uploadedFileName}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col overflow-hidden rounded-xl border border-[rgb(232,232,232)] bg-[#F8FAFC]">
                      <div className="flex items-center justify-between gap-3 border-b border-[#E8E8E8] px-3 py-3">
                        <div className="flex flex-col gap-1">
                          <h2 className="text-[14px] font-semibold leading-5 text-[#111827]">You can also provide Snippets</h2>
                          <p className="text-[13px] leading-5 text-[#64748B]">Share Reusable Code Blocks And Examples</p>
                        </div>
                        <button
                          type="button"
                          aria-label="Enable snippets"
                          aria-pressed={isSnippetsEnabled}
                          onClick={() => setIsSnippetsEnabled((prev) => !prev)}
                          className={`relative h-[28px] w-[52px] rounded-[6px] transition-colors duration-200 ${isSnippetsEnabled ? 'bg-[#34D399]' : 'bg-[#D1D5DB]'}`}
                        >
                          <span className={`absolute top-[6.5px] flex h-[15px] w-[15px] items-center justify-center rounded-[4px] transition-all duration-200 bg-white ${isSnippetsEnabled ? 'right-[6px]' : 'left-[6px]'}`} />
                        </button>
                      </div>
                      {isSnippetsEnabled && (
                        <div className="flex flex-col gap-3 px-3 py-3">
                          <div>
                            <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">Title</label>
                            <input
                              type="text"
                              placeholder="Enter a title"
                              value={snippetTitle}
                              onChange={(e) => setSnippetTitle(e.target.value)}
                              className="h-[40px] w-full rounded-[8px] border border-[#E2E8F0] bg-white px-[14px] text-[13px] leading-5 text-[#111827] outline-none placeholder:text-[#94A3B8]"
                            />
                          </div>
                          <div>
                            <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">Content</label>
                            <textarea
                              rows={6}
                              placeholder="Start writing your content"
                              value={snippetContent}
                              onChange={(e) => setSnippetContent(e.target.value)}
                              className="h-[134px] w-full resize-none rounded-[8px] border border-[#E2E8F0] bg-white px-[14px] py-3 text-[13px] leading-5 text-[#111827] outline-none placeholder:text-[#94A3B8]"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="w-full">
                      <button
                        type="button"
                        onClick={handleDocsTrain}
                        disabled={isDocsTraining}
                        className="inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-lg bg-[#111827] px-[20px] text-center text-[14px] leading-5 text-white transition-colors duration-200 hover:bg-[#1f2937] font-semibold disabled:bg-[#CBD5E1] disabled:text-[#64748B] disabled:cursor-not-allowed disabled:hover:bg-[#CBD5E1]"
                      >
                        {isDocsTraining ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                            Training...
                          </>
                        ) : (
                          <>
                            <span>Train & Continue</span>
                            <Image src={publicAsset('/images/new/sparkle-icon.svg')} alt="Sparkle" width={18} height={18} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : isFaqs ? (
              <div className="flex flex-col items-center gap-6 py-[30px]">
                <div className="flex h-[70px] w-[70px] items-center justify-center rounded-full bg-[#FFF1F2]">
                  <span className="material-symbols-outlined !text-[35px] text-[#F43F5E]">quiz</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <h1 className="mt-6 text-[22px] font-bold leading-8 text-[#111827] md:text-2xl">Let&apos;s Start With FAQs</h1>
                  <p className="text-sm font-medium leading-6 text-[#64748B] text-center max-w-full md:max-w-[522px]">
                    Add frequently asked questions and answers so your assistant can respond with accurate, ready-to-use replies.
                  </p>
                </div>

                <div className="flex flex-col gap-3 w-full md:max-w-[560px]">
                  {faqItems.map((item) => (
                    <div key={item.id} className="flex flex-col overflow-hidden rounded-xl border border-[rgb(232,232,232)] bg-[#F8FAFC]">
                      <div className="flex flex-col gap-3 px-3 py-3">
                        <div>
                          <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">Question</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              placeholder="e.g. What is your shipping rates?"
                              value={item.question}
                              onChange={(e) => updateFaq(item.id, 'question', e.target.value)}
                              className="h-[40px] w-full rounded-[8px] border border-[#E2E8F0] bg-white px-[14px] text-[13px] leading-5 text-[#111827] outline-none placeholder:text-[#94A3B8]"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveFaq(item.id)}
                              disabled={faqItems.length === 1}
                              className="w-10 h-10 bg-white rounded-lg outline outline-1 outline-offset-[-1px] outline-gray-200 inline-flex justify-center items-center disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined !text-[20px] text-[#FF6D6D]">delete</span>
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">Answer</label>
                          <textarea
                            rows={4}
                            placeholder="Enter the answer to this question..."
                            value={item.answer}
                            onChange={(e) => updateFaq(item.id, 'answer', e.target.value)}
                            className="h-[100px] w-full resize-none rounded-[8px] border border-[#E2E8F0] bg-white px-[14px] py-3 text-[13px] leading-5 text-[#111827] outline-none placeholder:text-[#94A3B8]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleAddFaq}
                      className="inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-7 text-center text-[14px] leading-5 text-[#111827] transition-colors duration-200 hover:bg-[#1f2937] border border-[#E8E8E8] font-semibold"
                    >
                      <span>Add Another FAQs</span>
                      <span className="material-symbols-outlined !text-[18px]">add</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleFaqTrain}
                      disabled={isFaqTraining}
                      className="inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-lg bg-[#111827] px-[20px] text-center text-[14px] leading-5 text-white transition-colors duration-200 hover:bg-[#1f2937] font-semibold disabled:bg-[#CBD5E1] disabled:text-[#64748B] disabled:cursor-not-allowed disabled:hover:bg-[#CBD5E1]"
                    >
                      {isFaqTraining ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                          Training...
                        </>
                      ) : (
                        <>
                          <span>Train & Continue</span>
                          <Image src={publicAsset('/images/new/sparkle-icon.svg')} alt="Sparkle" width={18} height={18} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Web tab */
              <div className="flex flex-col items-center gap-6 py-[30px]">
                <div className="flex h-[70px] w-[70px] items-center justify-center rounded-full bg-[#EEF2FF]">
                  <span className="material-symbols-outlined !text-[35px] text-[#4B56F2]">language</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <h1 className="mt-6 text-[22px] font-bold leading-8 text-[#111827] md:text-2xl">Let&apos;s Start With A Link</h1>
                  <p className="text-sm font-medium leading-6 text-[#64748B] text-center max-w-full md:max-w-[522px]">
                    Enter your website URL, and our AI will crawl your pages to build a personalized knowledge base in seconds.
                  </p>
                </div>

                <div className="flex w-full max-w-[561px] flex-col gap-3 rounded-[12px] border border-[#E2E8F0] bg-white p-2 sm:flex-row sm:items-center sm:gap-0 sm:p-1.5">
                  <div className="flex min-h-[47px] flex-1 items-center gap-3 rounded-[10px] pl-2">
                    <span className="material-symbols-outlined !text-[20px] text-[#4B56F2]">language</span>
                    <input
                      type="url"
                      placeholder="Yourwebsite.Com"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      disabled={isFetchingUrls}
                      className="h-full w-full border-none bg-transparent text-[14px] font-normal leading-5 text-[#111827] outline-none placeholder:text-[#64748B]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleWebContinue}
                    disabled={isFetchingUrls}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#111827] px-[20px] text-center text-[14px] leading-5 text-white transition-colors duration-200 hover:bg-[#1f2937] font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isFetchingUrls ? (
                      <>
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        Fetching...
                      </>
                    ) : (
                      <>
                        <span>Continue</span>
                        <span className="material-symbols-outlined !text-[18px]">arrow_forward</span>
                      </>
                    )}
                  </button>
                </div>

                {(isFetchingUrls || fetchStep === 'done' || fetchStep === 'error') && (
                  <div className="flex flex-col gap-3">
                    <div className="w-full md:max-w-[546px] mx-auto">
                      <div className="relative mb-4 items-center justify-between flex">
                        <span className="absolute left-0 w-full top-1/2 -translate-y-1/2 border-t border-[#D9DFE8]" />
                        <span className={`absolute left-0 top-1/2 -translate-y-1/2 border-t ${fetchStep !== 'error' ? 'border-[#34D399]' : 'border-[#EF4444]'} ${fetchStep === 'done' ? 'w-full' : fetchStep === 'logo' ? 'w-0' : fetchStep === 'colors' ? 'w-1/3' : 'w-2/3'}`} />
                        <div className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border ${['logo','colors','links','done'].includes(fetchStep) ? '!border-[#34D399] bg-[#D1FAE5]' : 'border-[#D9DFE8] bg-[#F1F5F9]'}`}>
                          <span className="material-symbols-outlined !text-[20px] text-[#059669]">image</span>
                          {isFetchingUrls && fetchStep === 'logo' && <Spinner className="size-12 absolute text-[#34D399]" />}
                        </div>
                        <div className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border ${['colors','links','done'].includes(fetchStep) ? '!border-[#34D399] bg-[#D1FAE5]' : 'border-[#D9DFE8] bg-[#F1F5F9]'}`}>
                          <span className="material-symbols-outlined !text-[20px] text-[#6B7280]">palette</span>
                          {isFetchingUrls && fetchStep === 'colors' && <Spinner className="size-12 absolute text-[#34D399]" />}
                        </div>
                        <div className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border ${['links','done'].includes(fetchStep) ? '!border-[#34D399] bg-[#D1FAE5]' : 'border-[#D9DFE8] bg-[#F1F5F9]'}`}>
                          <span className="material-symbols-outlined !text-[20px] text-[#9CA3AF]">language</span>
                          {isFetchingUrls && fetchStep === 'links' && <Spinner className="size-12 absolute text-[#34D399]" />}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-12 md:grid-cols-3 w-full md:max-w-[686px]">
                      <div className="rounded-2xl border border-[#D9DFE8] bg-white px-4 py-3 relative">
                        <p className="text-center text-[12px] font-semibold text-[#64748B]">Step 1</p>
                        <p className="mt-1 mb-3 text-center text-sm font-semibold text-[#111827]">Fetching Logo</p>
                        <div className="absolute bottom-[-10px] translate-x-1/2 right-1/2 flex justify-center">
                          <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold h-[22px] ${['logo','colors','links','done'].includes(fetchStep) ? 'border-[#34D399] bg-[#ECFDF5] text-[#059669]' : 'border-[#CBD5E1] bg-[#F1F5F9] text-[#94A3B8]'}`}>
                            {['logo','colors','links','done'].includes(fetchStep) ? <span className="material-symbols-outlined !text-[13px]">check_circle</span> : <span className="material-symbols-outlined !text-[13px]">schedule</span>}
                            {['logo','colors','links','done'].includes(fetchStep) ? 'Completed' : 'Waiting'}
                          </span>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-[#D9DFE8] bg-white px-4 py-3 relative">
                        <p className="text-center text-[12px] font-semibold text-[#64748B]">Step 2</p>
                        <p className="mt-1 text-center text-sm font-semibold text-[#111827]">Fetching Brand Color</p>
                        <div className="absolute bottom-[-10px] translate-x-1/2 right-1/2 flex justify-center">
                          <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold h-[22px] ${['colors','links','done'].includes(fetchStep) ? 'border-[#34D399] bg-[#ECFDF5] text-[#059669]' : fetchStep === 'logo' ? 'border-[#F59E0B] bg-[#FFFBEB] text-[#D97706]' : 'border-[#CBD5E1] bg-[#F1F5F9] text-[#94A3B8]'}`}>
                            {['colors','links','done'].includes(fetchStep) ? <span className="material-symbols-outlined !text-[13px]">check_circle</span> : fetchStep === 'logo' ? <span className="material-symbols-outlined !text-[13px]">fiber_manual_record</span> : <span className="material-symbols-outlined !text-[13px]">schedule</span>}
                            {['colors','links','done'].includes(fetchStep) ? 'Completed' : fetchStep === 'logo' ? 'In Progress' : 'Waiting'}
                          </span>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-[#D9DFE8] bg-white px-4 py-3 relative">
                        <p className="text-center text-[12px] font-semibold text-[#64748B]">Step 3</p>
                        <p className="mt-1 text-center text-sm font-semibold text-[#111827]">Fetching Links</p>
                        <div className="absolute bottom-[-10px] translate-x-1/2 right-1/2 flex justify-center">
                          <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold h-[22px] ${['links','done'].includes(fetchStep) ? 'border-[#34D399] bg-[#ECFDF5] text-[#059669]' : ['logo','colors'].includes(fetchStep) ? 'border-[#F59E0B] bg-[#FFFBEB] text-[#D97706]' : 'border-[#CBD5E1] bg-[#F1F5F9] text-[#94A3B8]'}`}>
                            {['links','done'].includes(fetchStep) ? <span className="material-symbols-outlined !text-[13px]">check_circle</span> : ['logo','colors'].includes(fetchStep) ? <span className="material-symbols-outlined !text-[13px]">fiber_manual_record</span> : <span className="material-symbols-outlined !text-[13px]">schedule</span>}
                            {['links','done'].includes(fetchStep) ? 'Completed' : ['logo','colors'].includes(fetchStep) ? 'In Progress' : 'Waiting'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Other sources tabs */}
            <div>
              <div className="relative mx-auto mb-6 flex w-full items-center justify-center">
                <span className="absolute top-1/2 h-[1px] bg-[#E2E8F0] w-full" />
                <span className="relative bg-white px-4 text-center text-[12px] font-bold uppercase leading-6 text-[#4686FE]">
                  Other Sources
                </span>
              </div>
              <div className="grid gap-4 px-10 pb-8 md:grid-cols-3 md:gap-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('web')}
                  className={`rounded-[12px] border-2 px-3 py-3.5 text-left backdrop-blur-[20px] transition-colors duration-200 ${activeTab === 'web' ? 'border-[#4686FE] bg-[#F8FAFC]' : 'border-[#F8FAFC] bg-[#F8FAFC]'}`}
                >
                  <div className="flex items-center gap-[14px]">
                    <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[8px] bg-[#EEF2FF]">
                      <span className="material-symbols-outlined !text-[20px] text-[#4B56F2]">language</span>
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-[14px] font-semibold leading-[20px] text-[#111827]">Web Pages</h2>
                      <p className="mt-0.5 text-[13px] font-normal capitalize leading-5 text-[#64748B]">Specific URLs</p>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('docs')}
                  className={`rounded-[12px] border-2 px-3 py-3.5 text-left backdrop-blur-[20px] transition-colors duration-200 ${activeTab === 'docs' ? 'border-[#4686FE] bg-[#F8FAFC]' : 'border-[#F8FAFC] bg-[#F8FAFC]'}`}
                >
                  <div className="flex items-center gap-[14px]">
                    <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[8px] bg-[#EAFFEA]">
                      <span className="material-symbols-outlined !text-[20px] text-[#399E39]">description</span>
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-[14px] font-semibold leading-[20px] text-[#111827]">Doc/Snippets</h2>
                      <p className="mt-0.5 text-[13px] font-normal capitalize leading-5 text-[#64748B]">PDF, TXT, Raw</p>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('faqs')}
                  className={`rounded-[12px] border-2 px-3 py-3.5 text-left backdrop-blur-[20px] transition-colors duration-200 ${activeTab === 'faqs' ? 'border-[#4686FE] bg-[#F8FAFC]' : 'border-[#F8FAFC] bg-[#F8FAFC]'}`}
                >
                  <div className="flex items-center gap-[14px]">
                    <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[8px] bg-[#FFF1F2]">
                      <span className="material-symbols-outlined !text-[20px] text-[#F43F5E]">quiz</span>
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-[14px] font-semibold leading-[20px] text-[#111827]">FAQs</h2>
                      <p className="mt-0.5 text-[13px] font-normal capitalize leading-5 text-[#64748B]">Q&amp;A Pairs</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
