'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Spinner } from "@/components/ui/spinner"
import TrainSetup from './components/train-setup'
import WidgetSetup from './components/widget-setup'
//i need global.css for this page
import '../globals.css'

type SetupTab = 'web' | 'docs' | 'faqs'
type SetupStep = 'source' | 'train' | 'widget'

export default function SetupPage() {
    const [activeTab, setActiveTab] = useState<SetupTab>('web')
    const [currentStep, setCurrentStep] = useState<SetupStep>('source')
    const [isCardVisible, setIsCardVisible] = useState(true)
    const [isSwitchingCard, setIsSwitchingCard] = useState(false)
    const [isDragOver, setIsDragOver] = useState(false)
    const [uploadedFileName, setUploadedFileName] = useState('')
    const [isSnippetsEnabled, setIsSnippetsEnabled] = useState(false)
    const [faqItems, setFaqItems] = useState<Array<{ id: number }>>([])
    const fileInputRef = useRef<HTMLInputElement>(null)
    const isDocSnippets = activeTab === 'docs'
    const isFaqs = activeTab === 'faqs'
    const isWidgetStep = currentStep === 'widget'

    const handleFileSelect = (files: FileList | null) => {
        if (!files || files.length === 0) return
        setUploadedFileName(files[0].name)
    }

    const handleAddFaq = () => {
        const newId = Date.now()
        setFaqItems((prev) => [...prev, { id: newId }])
    }

    const handleRemoveFaq = (id: number) => {
        setFaqItems((prev) => prev.filter((item) => item.id !== id))
    }

    const transitionToStep = (nextStep: SetupStep) => {
        if (isSwitchingCard || currentStep === nextStep) return

        setIsSwitchingCard(true)
        setIsCardVisible(false)

        window.setTimeout(() => {
            setCurrentStep(nextStep)
            window.requestAnimationFrame(() => {
                setIsCardVisible(true)
            })
            setIsSwitchingCard(false)
        }, 220)
    }

    return (
        <div className="min-h-screen bg-[#F3F4F6] p-6">
            <div className="mx-auto flex justify-center mb-6">
                <Image src="/images/new/logo.svg" alt="Chataffy logo" width={142} height={51} priority />
            </div>

            <div
                className={`mx-auto mt-6 w-full transition-all duration-300 ease-out will-change-transform ${isWidgetStep
                    ? "max-w-[1106px]"
                    : "max-w-[900px] overflow-hidden rounded-[20px] bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.02)]"
                    } ${isCardVisible ? 'opacity-100 translate-y-0 scale-100' : 'pointer-events-none opacity-0 translate-y-1 scale-[0.985]'}`}
            >
                {currentStep === 'train' ? (
                    <TrainSetup onContinue={() => transitionToStep('widget')} />
                ) : currentStep === 'widget' ? (
                    <WidgetSetup />
                ) : (
                    <>
                    {isDocSnippets ? (
                    <div className=''>
                        <div className="flex flex-col items-center gap-6 py-[30px]">
                            <div className="flex h-[70px] w-[70px] items-center justify-center rounded-full bg-[#EAFFEA]">
                                <span className="material-symbols-outlined !text-[35px] text-[#399E39]">
                                    description
                                </span>
                            </div>

                            <div className='flex flex-col items-center gap-3'>
                                <h1 className="mt-6 text-[22px] font-bold leading-8 text-[#111827] md:text-2xl">
                                    Let&apos;s Start With Documents
                                </h1>

                                <p className="text-sm font-medium leading-6 text-[#64748B] text-center max-w-full md:max-w-[522px]">
                                    Upload your documents, and our AI will extract the information to build a personalized
                                    knowledge base in seconds.
                                </p>
                            </div>

                            <div className='flex flex-col gap-3 w-full md:max-w-[560px]'>
                                <div className="flex flex-col">
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => fileInputRef.current?.click()}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault()
                                                fileInputRef.current?.click()
                                            }
                                        }}
                                        onDragOver={(event) => {
                                            event.preventDefault()
                                            setIsDragOver(true)
                                        }}
                                        onDragLeave={() => setIsDragOver(false)}
                                        onDrop={(event) => {
                                            event.preventDefault()
                                            setIsDragOver(false)
                                            handleFileSelect(event.dataTransfer.files)
                                        }}
                                        className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors duration-200 ${isDragOver
                                            ? 'border-[#4686FE] bg-[#EEF2FF]'
                                            : 'border-[#E5E5E5] bg-[#fff]'
                                            }`}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".doc,.docx,.pdf,.txt"
                                            className="hidden"
                                            onChange={(event) => handleFileSelect(event.target.files)}
                                        />

                                        <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center">
                                            <Image src="/images/new/upload-icon.svg" alt="Upload" width={64} height={64} />
                                        </div>

                                        <p className="text-[14px] font-semibold leading-5 text-[#111827]">
                                            Drop your file here, or browse
                                        </p>
                                        <p className="mt-2 text-[13px] font-normal leading-5 text-[#64748B]">
                                            Only DOC, DOCX, PDF, TXT files are allowed.
                                        </p>

                                        {uploadedFileName && (
                                            <p className="mt-3 text-[13px] font-medium leading-5 text-[#111827]">
                                                Selected: {uploadedFileName}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col overflow-hidden rounded-xl border border-[rgb(232,232,232)] bg-[#F8FAFC]">
                                    <div className="flex items-center justify-between gap-3 border-b border-[#E8E8E8] px-3 py-3">
                                        <div className='flex flex-col gap-1'>
                                            <h2 className="text-[14px] font-semibold leading-5 text-[#111827]">
                                                You can also provide Snippets
                                            </h2>
                                            <p className="text-[13px] leading-5 text-[#64748B]">
                                                Share Reusable Code Blocks And Examples
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            aria-label="Enable snippets"
                                            aria-pressed={isSnippetsEnabled}
                                            onClick={() => setIsSnippetsEnabled((prev) => !prev)}
                                            className={`relative h-[28px] w-[52px] rounded-[6px] transition-colors duration-200 ${isSnippetsEnabled ? 'bg-[#34D399]' : 'bg-[#D1D5DB]'
                                                }`}
                                        >
                                            <span
                                                className={`absolute top-[6.5px] flex h-[15px] w-[15px] items-center justify-center rounded-[4px] transition-all duration-200 bg-white ${isSnippetsEnabled
                                                    ? 'right-[6px]'
                                                    : 'left-[6px]'
                                                    }`}
                                            >
                                            </span>
                                        </button>
                                    </div>

                                    {isSnippetsEnabled && (
                                        <div className="flex flex-col gap-3 px-3 py-3">
                                            <div>
                                                <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">
                                                    Title
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter a title"
                                                    className="h-[40px] w-full rounded-[8px] border border-[#E2E8F0] bg-white px-[14px] text-[13px] leading-5 text-[#111827] outline-none placeholder:text-[#94A3B8]"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">
                                                    Content
                                                </label>
                                                <textarea
                                                    rows={6}
                                                    placeholder="Start writing your content"
                                                    className="h-[134px] w-full resize-none rounded-[8px] border border-[#E2E8F0] bg-white px-[14px] py-3 text-[13px] leading-5 text-[#111827] outline-none placeholder:text-[#94A3B8]"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className='w-full'>
                                    <button type="button" className="inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-lg bg-[#111827] px-[20px] text-center text-[14px] leading-5 text-white transition-colors duration-200 hover:bg-[#1f2937] font-semibold">
                                        <span>Train & Continue</span>
                                        <Image src="/images/new/sparkle-icon.svg" alt="Arrow Forward" width={18} height={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : isFaqs ? (
                    <div className="flex flex-col items-center gap-6 py-[30px]">
                        <div className="flex h-[70px] w-[70px] items-center justify-center rounded-full bg-[#FFF1F2]">
                            <span className="material-symbols-outlined !text-[35px] text-[#F43F5E]">
                                quiz
                            </span>
                        </div>

                        <div className="flex flex-col items-center gap-3">
                            <h1 className="mt-6 text-[22px] font-bold leading-8 text-[#111827] md:text-2xl">
                                Let&apos;s Start With FAQs
                            </h1>

                            <p className="text-sm font-medium leading-6 text-[#64748B] text-center max-w-full md:max-w-[522px]">
                                Add frequently asked questions and answers so your assistant can respond with
                                accurate, ready-to-use replies.
                            </p>
                        </div>

                        <div className='flex flex-col gap-3 w-full md:max-w-[560px]'>
                            <div className="flex flex-col gap-3">
                                <div>
                                    <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">
                                        Question
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. What is your shipping rates?"
                                        className="h-[40px] w-full rounded-[8px] border border-[#E2E8F0] bg-white px-[14px] text-[13px] leading-5 text-[#111827] outline-none placeholder:text-[#94A3B8]"
                                    />
                                </div>

                                <div>
                                    <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">
                                        Answer
                                    </label>
                                    <textarea
                                        rows={6}
                                        placeholder="Enter the question for this question..."
                                        className="h-[134px] w-full resize-none rounded-[8px] border border-[#E2E8F0] bg-white px-[14px] py-3 text-[13px] leading-5 text-[#111827] outline-none placeholder:text-[#94A3B8]"
                                    />
                                </div>
                            </div>

                            {faqItems.map((item) => (
                                <div key={item.id} className='flex flex-col overflow-hidden rounded-xl border border-[rgb(232,232,232)] bg-[#F8FAFC]'>
                                    <div className="flex flex-col gap-3 px-3 py-3">
                                        <div>
                                            <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">
                                                Question
                                            </label>
                                            <div className='flex items-center gap-3'>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. What is your shipping rates?"
                                                    className="h-[40px] w-full rounded-[8px] border border-[#E2E8F0] bg-white px-[14px] text-[13px] leading-5 text-[#111827] outline-none placeholder:text-[#94A3B8]"
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveFaq(item.id)}
                                                    className="w-10 h-10 bg-white rounded-lg outline outline-1 outline-offset-[-1px] outline-gray-200 inline-flex justify-center items-center"
                                                >
                                                    <span className="material-symbols-outlined !text-[20px] text-[#FF6D6D]">
                                                        delete
                                                    </span>
                                                </button>

                                            </div>
                                        </div>

                                        <div>
                                            <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">
                                                Answer
                                            </label>
                                            <textarea
                                                rows={6}
                                                placeholder="Enter the question for this question..."
                                                className="h-[134px] w-full resize-none rounded-[8px] border border-[#E2E8F0] bg-white px-[14px] py-3 text-[13px] leading-5 text-[#111827] outline-none placeholder:text-[#94A3B8]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className='flex gap-3'>
                                <button
                                    type="button"
                                    onClick={handleAddFaq}
                                    className="inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-7 text-center text-[14px] leading-5 text-[#111827] transition-colors duration-200 hover:bg-[#1f2937] border border-[#E8E8E8] font-semibold"
                                >
                                    <span>Add Another FAQs</span>
                                    <span className="material-symbols-outlined !text-[18px]">
                                        add
                                    </span>
                                </button>

                                <button type="button" className="inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-lg bg-[#111827] px-[20px] text-center text-[14px] leading-5 text-white transition-colors duration-200 hover:bg-[#1f2937] font-semibold">
                                    <span>Train & Continue</span>
                                    <Image src="/images/new/sparkle-icon.svg" alt="Arrow Forward" width={18} height={18} />
                                </button>
                            </div>
                        </div>


                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-6 py-[30px]">
                        <div className="flex h-[70px] w-[70px] items-center justify-center rounded-full bg-[#EEF2FF]">
                            <span className="material-symbols-outlined !text-[35px] text-[#4B56F2]">
                                language
                            </span>
                        </div>

                        <div className='flex flex-col items-center gap-3'>
                            <h1 className="mt-6 text-[22px] font-bold leading-8 text-[#111827] md:text-2xl">
                                Let&apos;s Start With A Link
                            </h1>

                            <p className="text-sm font-medium leading-6 text-[#64748B] text-center max-w-full md:max-w-[522px]">
                                Enter your website URL, and our AI will crawl your pages to build a personalized
                                knowledge base in seconds.
                            </p>
                        </div>

                        <div className="flex w-full max-w-[561px] flex-col gap-3 rounded-[12px] border border-[#E2E8F0] bg-white p-2 sm:flex-row sm:items-center sm:gap-0 sm:p-1.5">
                            <div className="flex min-h-[47px] flex-1 items-center gap-3 rounded-[10px] pl-2">
                                <span className="material-symbols-outlined !text-[20px] text-[#4B56F2]">
                                    language
                                </span>
                                <input
                                    type="url"
                                    placeholder="Yourwebsite.Com"
                                    className="h-full w-full border-none bg-transparent text-[14px] font-normal capitalize leading-5 text-[#111827] outline-none placeholder:text-[#64748B]"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => transitionToStep('train')}
                                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#111827] px-[20px] text-center text-[14px] leading-5 text-white transition-colors duration-200 hover:bg-[#1f2937] font-semibold"
                            >
                                <span>Continue</span>
                                <span className="material-symbols-outlined !text-[18px]">
                                    arrow_forward
                                </span>
                            </button>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className='w-full md:max-w-[546px] mx-auto'>
                                <div className="relative mb-4 items-center justify-between flex">
                                    <span className="absolute left-0 w-full top-1/2 -translate-y-1/2 border-t border-[#D9DFE8]" />
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 border-t border-[#34D399] w-1/2" />

                                    <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border !border-[#34D399] bg-[#D1FAE5]">
                                        <span className="material-symbols-outlined !text-[20px] text-[#059669]">image</span>
                                    </div>

                                    <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-[#D9DFE8] bg-[#F1F5F9]">
                                        <span className="material-symbols-outlined !text-[20px] text-[#6B7280]">palette</span>
                                        <Spinner className='size-12 absolute text-[#34D399]' />
                                    </div>

                                    <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-[#D9DFE8] bg-[#F1F5F9]">
                                        <span className="material-symbols-outlined !text-[20px] text-[#9CA3AF]">language</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-12 md:grid-cols-3 w-full md:max-w-[686px]">
                                <div className="rounded-2xl border border-[#D9DFE8] bg-white px-4 py-3 relative">
                                    <p className="text-center text-[12px] font-semibold text-[#64748B]">Step 1</p>
                                    <p className="mt-1 mb-3 text-center text-sm font-semibold text-[#111827]">Fetching Logo</p>
                                    <div className="absolute bottom-[-10px] translate-x-1/2 right-1/2 flex justify-center">
                                        <span className="inline-flex items-center gap-1 rounded-md border border-[#34D399] bg-[#ECFDF5] px-2 py-0.5 text-[11px] font-semibold text-[#059669] h-[22px]">
                                            <span className="material-symbols-outlined !text-[13px]">
                                                check_circle
                                            </span>
                                            Completed
                                        </span>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-[#D9DFE8] bg-white px-4 py-3 relative">
                                    <p className="text-center text-[12px] font-semibold text-[#64748B]">Step 2</p>
                                    <p className="mt-1 text-center text-sm font-semibold text-[#111827]">Fetching Brand Color</p>
                                    <div className="absolute bottom-[-10px] translate-x-1/2 right-1/2 flex justify-center">
                                        <span className="inline-flex items-center gap-1 rounded-md border border-[#F59E0B] bg-[#FFFBEB] px-2 py-0.5 text-[11px] font-semibold text-[#D97706] h-[22px]">
                                            <span className="material-symbols-outlined !text-[13px]">
                                                fiber_manual_record
                                            </span>
                                            In Progress
                                        </span>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-[#D9DFE8] bg-white px-4 py-3 relative">
                                    <p className="text-center text-[12px] font-semibold text-[#64748B]">Step 3</p>
                                    <p className="mt-1 text-center text-sm font-semibold text-[#111827]">Fetching Links</p>
                                    <div className="absolute bottom-[-10px] translate-x-1/2 right-1/2 flex justify-center">
                                        <span className="inline-flex items-center gap-1 rounded-md border border-[#CBD5E1] bg-[#F1F5F9] px-2 py-0.5 text-[11px] font-semibold text-[#94A3B8] h-[22px]">
                                            <span className="material-symbols-outlined !text-[13px]">schedule</span>
                                            Waiting
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="">
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
                            className={`rounded-[12px] border-2 px-3 py-3.5 text-left backdrop-blur-[20px] transition-colors duration-200 ${activeTab === 'web'
                                ? 'border-[#4686FE] bg-[#F8FAFC]'
                                : 'border-[#F8FAFC] bg-[#F8FAFC]'
                                }`}
                        >
                            <div className="flex items-center gap-[14px]">
                                <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[8px] bg-[#EEF2FF]">
                                    <span className="material-symbols-outlined !text-[20px] text-[#4B56F2]">
                                        language
                                    </span>
                                </div>

                                <div className="min-w-0">
                                    <h2 className="text-[14px] font-semibold leading-[20px] text-[#111827]">
                                        Web Pages
                                    </h2>
                                    <p className="mt-0.5 text-[13px] font-normal capitalize leading-5 text-[#64748B]">
                                        Specific URLs
                                    </p>
                                </div>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('docs')}
                            className={`rounded-[12px] border-2 px-3 py-3.5 text-left backdrop-blur-[20px] transition-colors duration-200 ${activeTab === 'docs'
                                ? 'border-[#4686FE] bg-[#F8FAFC]'
                                : 'border-[#F8FAFC] bg-[#F8FAFC]'
                                }`}
                        >
                            <div className="flex items-center gap-[14px]">
                                <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[8px] bg-[#EAFFEA]">
                                    <span className="material-symbols-outlined !text-[20px] text-[#399E39]">
                                        description
                                    </span>
                                </div>

                                <div className="min-w-0">
                                    <h2 className="text-[14px] font-semibold leading-[20px] text-[#111827]">
                                        Doc/Snippets
                                    </h2>
                                    <p className="mt-0.5 text-[13px] font-normal capitalize leading-5 text-[#64748B]">
                                        PDF, TXT, Raw
                                    </p>
                                </div>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('faqs')}
                            className={`rounded-[12px] border-2 px-3 py-3.5 text-left backdrop-blur-[20px] transition-colors duration-200 ${activeTab === 'faqs'
                                ? 'border-[#4686FE] bg-[#F8FAFC]'
                                : 'border-[#F8FAFC] bg-[#F8FAFC]'
                                }`}
                        >
                            <div className="flex items-center gap-[14px]">
                                <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[8px] bg-[#FFF1F2]">
                                    <span className="material-symbols-outlined !text-[20px] text-[#F43F5E]">
                                        quiz
                                    </span>
                                </div>

                                <div className="min-w-0">
                                    <h2 className="text-[14px] font-semibold leading-[20px] text-[#111827]">
                                        FAQs
                                    </h2>
                                    <p className="mt-0.5 text-[13px] font-normal capitalize leading-5 text-[#64748B]">
                                        Q&amp;A Pairs
                                    </p>
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

function PlusIcon({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
            <path d="M12 5V19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M5 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    )
}

function TrashIcon({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
            <path d="M8 9V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M12 9V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M16 9V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M5 6H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M9 6V4.75C9 4.33579 9.33579 4 9.75 4H14.25C14.6642 4 15 4.33579 15 4.75V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M7 6L7.6 18.2C7.63925 18.9981 8.29781 19.625 9.09688 19.625H14.9031C15.7022 19.625 16.3608 18.9981 16.4 18.2L17 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

