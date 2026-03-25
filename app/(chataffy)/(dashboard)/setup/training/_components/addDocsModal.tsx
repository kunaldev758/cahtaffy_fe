'use client';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FileUpload } from './fileUpload';
import { openaiCreateSnippet } from '@/app/_api/dashboard/action';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Image from 'next/image';

export default function AddContentModal({ showModal, onHide, agentId, onBack }: any) {
  const [toggle, setToggle] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [buttonLoading, setButtonLoading] = useState(false);

  const handleButtonOnClick = async () => {
    if (toggle && title.trim().length === 0) {
      toast.error("Enter Title");
      return false;
    }

    if (toggle && content.trim().length === 0) {
      toast.error("Enter Content");
      return false;
    }

    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    if (toggle) {
      formData.append('title', title);
      formData.append('content', content);
    }

    setButtonLoading(true);
    const response: any = await openaiCreateSnippet(formData, agentId ?? undefined)
    setButtonLoading(false)
    onHide()
    toast.success(response.message)
  };

  return (
    <Dialog
      open={showModal}
      onOpenChange={(open) => {
        if (!open) onHide()
      }}
    >
      <DialogContent className="w-full max-w-[600px] p-0 overflow-hidden border border-[#E2E8F0] bg-white">
        <div className="bg-[#F9FBFD] px-[20px] py-[15px] border-b border-[#E5E5E5] flex items-center gap-2">
          <span
            className="material-symbols-outlined !text-[20px] cursor-pointer"
            onClick={() => {
              if (onBack) onBack()
              else onHide()
            }}
          >
            arrow_back
          </span>
          <h1 className="text-sm font-semibold text-[#111827]">Add New Doc/Snippets</h1>
        </div>

        <div>
          <div className="flex flex-col gap-[20px] px-[20px]">
            <FileUpload onFileChange={setFile} />

            <div className="bg-[#F9FBFD] rounded-[20px] border border-[#E8E8E8]">
              <div className="flex items-center justify-between gap-1 py-[20px] px-[20px]">
                <div className='flex flex-col gap-1'>
                  <h3 className='text-sm font-semibold text-[#111827]'>You can also provide Snippets</h3>
                  <p className='text-[12px] font-normal text-[#64748B]'>You can also provide Snippets</p>
                </div>
                <label className="toggle">
                  <input className="toggle-checkbox" type="checkbox" checked={toggle} onChange={() => setToggle(!toggle)} />
                  <div className="toggle-switch"></div>
                </label>
              </div>
              {toggle && (
                <>
                  <div className='flex flex-col gap-[20px] p-[20px] border-t border-[#E8E8E8]'>
                    <div className='flex flex-col'>
                      <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">Title</label>
                      <input type="text" placeholder="Enter a title" className="h-[40px] w-full rounded-[8px] border bg-white px-[14px] text-[13px] text-[#111827] outline-none placeholder:text-[#94A3B8] focus:border-[#4686FE] border-[#E2E8F0]" value={title} onChange={(event) => setTitle(event.target.value)} />
                    </div>

                    <div className='flex flex-col'>
                      <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">Content</label>
                      <textarea className="w-full resize-none rounded-[8px] border border-[#E2E8F0] bg-white px-[14px] py-3 text-[13px] text-[#111827] outline-none placeholder:text-[#94A3B8] focus:border-[#4686FE]" placeholder="Start writing your content..." value={content} onChange={(event) => setContent(event.target.value)}></textarea>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="px-[20px] py-[20px] border-t border-[#E5E5E5] flex justify-between items-center bg-[#F9FBFD]">
          <button type="button" className="text-sm font-bold text-[#64748B] hover:text-[#111827] cursor-pointer" onClick={onHide}>
            Cancel
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 h-10 px-4 bg-[#111827] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1f2937] disabled:bg-[#CBD5E1] disabled:text-[#64748B] disabled:cursor-not-allowed transition-colors"
            onClick={handleButtonOnClick}
            disabled={buttonLoading}
          >
            <Image src="/images/new/sparkle-icon.svg" alt="Sparkle" width={18} height={18} />
            Start Training
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
