"use client"

import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import React, { useState } from 'react'
import PhoneInput from 'react-phone-number-input'
import type { Value } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

const WidgetSetup = () => {
    const embedScript = `<script src="https://chataffy.com/chataffy/chataffy_fe/openai/widget/6936601ef"></script>`
    const [isCopied, setIsCopied] = useState(false)
    const [isLiveChatEnabled, setIsLiveChatEnabled] = useState(true)
    const checkboxUiClass =
        "h-[20px] w-[20px] rounded-[8px] border border-[#CBD5E1] shadow-none data-[state=checked]:border-[#4686FE] data-[state=checked]:bg-[#4686FE] data-[state=checked]:text-white [&_svg]:h-[14px] [&_svg]:w-[14px]"

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(embedScript)
            setIsCopied(true)
            window.setTimeout(() => setIsCopied(false), 1500)
        } catch (error) {
            setIsCopied(false)
        }
    }

    const [value, setValue] = useState<Value | undefined>(undefined)

    return (
        <>
            <div className='flex gap-[20px]'>
                <div className='flex flex-col gap-[20px] flex-1'>
                    <div className='rounded-[20px] bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.02)] flex-1 p-[20px]'>
                        <div className='flex flex-col gap-[20px]'>
                            <div className='flex flex-col'>
                                <h2 className='text-sm font-bold text-[#111827]'>Widget Embed Code</h2>
                                <p className='text-[13px] text-[#64748B]'>
                                    Add this script to your website's <Badge className="ml-auto rounded-[6px] bg-[#FAF5FF] text-[10px] font-semibold text-[#A855F7] shadow-none hover:bg-[#F1F5F9] h-[17px] border border-[#A855F7] px-[7px]">
                                        &#60;Footer&#62;
                                    </Badge> section to activate the chatbot.
                                </p>
                            </div>

                            <div className='flex items-center gap-3'>
                                <input
                                    value={embedScript}
                                    readOnly
                                    className='h-[44px] flex-1 rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] px-[14px] text-[13px] text-[#111827] outline-none'
                                />
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    className='inline-flex h-[44px] min-w-[125px] items-center justify-center gap-2 rounded-[12px] bg-[#111827] px-4 text-[14px] font-semibold text-white transition-colors duration-200 hover:bg-[#1f2937]'
                                >
                                    <span className="material-symbols-outlined !text-[18px]">
                                        content_copy
                                    </span>
                                    <span>{isCopied ? "Copied" : "Copy"}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className='rounded-[20px] bg-white shadow-[0px_4px_20px_0px_rgba(0,0,0,0.02)] flex-1 p-[20px]'>
                        <div className='flex flex-col gap-4'>
                            <div className='flex gap-4'>
                                <div className='relative h-[70px] w-[70px] rounded-full border border-[#D9DFE8] bg-[#F8FAFC] flex items-center justify-center shrink-0'>
                                    <span className='text-[38px] font-bold text-[#3B82F6] leading-none'>C</span>
                                    <div className='absolute top-1 right-1 h-5 w-5 rounded-full bg-[#4686FE] text-white flex items-center justify-center'>
                                        <span className="material-symbols-outlined !text-[12px]">image</span>
                                    </div>
                                </div>

                                <div className='flex-1'>
                                    <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">
                                        Agent Name
                                    </label>
                                    <input
                                        type="text"
                                        defaultValue="Chataffy Agent"
                                        className="h-[40px] w-full rounded-[8px] border border-[#E2E8F0] bg-white px-[14px] text-[13px] leading-5 text-[#111827] outline-none placeholder:text-[#94A3B8]"
                                        placeholder="Enter agent name"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">
                                    Greeting Message
                                </label>
                                <textarea
                                    rows={3}
                                    defaultValue="👋 Hi! I'm your Chataffy assistant. How can I help you today?"
                                    className="h-[78px] w-full resize-none rounded-[8px] border border-[#E2E8F0] bg-white px-[14px] py-3 text-[13px] leading-5 text-[#111827] outline-none placeholder:text-[#94A3B8]"
                                    placeholder="Enter greeting message"
                                />
                            </div>

                            <div className='grid gap-3 md:grid-cols-2'>
                                <div>
                                    <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">
                                        Email
                                    </label>
                                    <div className='h-[40px] w-full rounded-[8px] border border-[#E2E8F0] bg-white px-[14px] flex items-center gap-2'>
                                        <span className="material-symbols-outlined !text-[18px] text-[#94A3B8]">
                                            alternate_email
                                        </span>
                                        <input
                                            type="email"
                                            defaultValue="test@gmail.com"
                                            className="w-full text-[13px] leading-5 text-[#111827] outline-none placeholder:text-[#94A3B8]"
                                            placeholder="Enter email"
                                        />
                                    </div>
                                </div>

                                <div className='country-select-container'>
                                    <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">
                                        Phone Number
                                    </label>
                                    <PhoneInput
                                        international
                                        defaultCountry="US"
                                        value={value}
                                        onChange={(nextValue) => setValue(nextValue)}
                                        className='h-[40px] w-full rounded-[8px] border border-[#E2E8F0] bg-white px-[14px] flex items-center gap-2 '
                                    />
                                </div>
                            </div>

                            <div className='flex items-center gap-[12px]'>
                                <Checkbox
                                    id="live-chat-enabled"
                                    className={checkboxUiClass}
                                    checked={isLiveChatEnabled}
                                    onCheckedChange={(checked) => setIsLiveChatEnabled(checked === true)}
                                />
                                <label
                                    htmlFor="live-chat-enabled"
                                    className='cursor-pointer text-[13px] leading-5 text-[#111827]'
                                    id='live-chat-enabled-label'
                                >
                                    Visitors can request live chat with chat agents
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='w-[358px]'>
                    caca
                </div>
            </div>
        </>
    )
}

export default WidgetSetup