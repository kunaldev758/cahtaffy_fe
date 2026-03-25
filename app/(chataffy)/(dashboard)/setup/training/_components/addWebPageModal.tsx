'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { openaiWebPageScrapeApi } from '@/app/_api/dashboard/action'
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation'
import { getClientData } from '@/app/_api/dashboard/action'
import Image from 'next/image';

export default function Home(Props: any) {
  const { showModal, onHide, agentId, onBack } = Props
  const router = useRouter()
  const [toggle, setToggle] = useState(true)
  const [url, setUrl] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [urlTags, setUrlTags] = useState<string[]>([])
  const [buttonLoading, setButtonLoading] = useState(false)
  const [client, setClient] = useState(null) as any;

  const urlsForApi = urlTags.join(', ')

  const parseAndNormalizeUrls = (raw: string) => {
    // Comma/newline separated values support (e.g. "a,b" or "a, b , c" or lines).
    const parts = raw
      .split(/[\n,]+/)
      .map(v => v.trim())
      .filter(Boolean)

    return parts
  }

  const addUrlsFromInput = (raw: string) => {
    const nextUrls = parseAndNormalizeUrls(raw)
    if (nextUrls.length === 0) return

    setUrlTags(prev => {
      const merged = [...prev, ...nextUrls]
      // Dedupe while preserving order.
      const seen = new Set<string>()
      return merged.filter(u => {
        if (seen.has(u)) return false
        seen.add(u)
        return true
      })
    })
  }

  const handleUrlInputKeyDown = (e: any) => {
    // Enter adds URLs; Shift+Enter allows a newline (without adding).
    if (e.key !== 'Enter') return
    if (e.shiftKey) return
    e.preventDefault()
    addUrlsFromInput(urlInput)
    setUrlInput('')
  }

  const removeTagAtIndex = (idx: number) => {
    setUrlTags(prev => prev.filter((_, i) => i !== idx))
  }

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const clientData = await getClientData();
        if (clientData) {
          setClient(clientData.client);
        }
      } catch (error) {
        console.error("Error fetching client data:", error);
      }
    };
    fetchClientData();
  }, []);


  const handleButtonOnClick = async () => {
    let sitemap = (toggle == true ? urlsForApi : url)
    if (url.trim().length == 0 && toggle == false) {
      toast.error("Enter URL")
      return false
    }

    if (urlsForApi.trim().length == 0 && toggle == true) {
      toast.error("Enter URLs")
      return false
    }


    setButtonLoading(true)

    let response: any = null
    if (toggle == true) {
      response = await openaiWebPageScrapeApi(sitemap, true, agentId ?? undefined)
    } else {
      response = await openaiWebPageScrapeApi(sitemap, false, agentId ?? undefined)
    }
    // const response: any = await openaiWebPageScrapeApi(sitemap)
    if (response == null || response == 'error') {
      setButtonLoading(false)
      router.push('/login')
      return
    }
    setButtonLoading(false)
    setUrl('')
    setUrlInput('')
    setUrlTags([])
    onHide()
    toast.success(response.message)

  }

  return (<>

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
          <h1 className="text-sm font-semibold text-[#111827]">Add new Web Pages</h1>
        </div>

        <div className="px-[20px]">
          <div className="new-webPage-modalArea">
            {/* <h4>Enter the URL of your external support content</h4> */}
            {client && client?.isSitemapAdded <= 0 ? (
              <div>
                <h4>Enter the URL of your external support content</h4>
                <p>Top-level domains will give the best results (e.g. https://chataffy.com rather than https://chataffy.com/home)</p>
                <div className="input-box mt-20">
                  <input type="text" placeholder="https://chataffy.com" className="form-control" disabled={toggle} value={url} onChange={(event) => {
                    setUrl(event.target.value)
                  }} />
                </div>
              </div>
            ) : (
              <div className='bg-[#F7EADE] p-[20px] rounded-xl flex items-start gap-4'>
                <div className="mt-0.5 text-on-tertiary-fixed-variant">
                  <span className="material-symbols-outlined text-2xl" data-icon="warning">warning</span>
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-semibold text-[#111827] mb-0">Sitemap Limit Reached</h4>
                  <p className="text-[13px] font-normal text-[#111827] leading-relaxed">
                    One sitemap already added. You can't add another. Try adding URLs manually below.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-[26px]">
              <div className="flex items-center justify-between">
                <div className='flex flex-col gap-1'>
                  <h3 className='text-sm font-semibold text-[#111827]'>Manual URL Entry</h3>
                  <p className='text-[12px] font-normal text-[#64748B]'>You can also provide a list of specific URLs to add content from</p>
                </div>

                <label className="toggle">
                  <input className="toggle-checkbox" type="checkbox" checked={toggle} onChange={() => { setToggle(!toggle) }} />
                  <div className="toggle-switch"></div>
                </label>
              </div>

              {toggle &&
                <div className="specific-urlBox">
                  <div className="">
                    <textarea
                      className="w-full rounded-[8px] border border-[#E2E8F0] bg-white text-[13px] leading-5 text-[#111827] outline-none px-[14px] py-[10px] resize-none mb-1"
                      placeholder="https://chataffy.com (press Enter to add)"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={handleUrlInputKeyDown}
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      {urlTags.map((t, idx) => (
                        <span
                          key={`${t}-${idx}`}
                          className="flex items-center gap-2 max-w-full bg-[#F1F5F9] text-[#111827] text-[13px] px-3 py-1 rounded-md"
                        >
                          <span className="max-w-[320px] truncate">{t}</span>
                          <button
                            type="button"
                            className="text-[#64748B] hover:text-red-600 leading-none"
                            onClick={() => removeTagAtIndex(idx)}
                            aria-label="Remove URL"
                          >
                            <span className="material-symbols-outlined !text-[16px] mt-1">
                              close
                            </span>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>}
            </div>
          </div>
        </div>

        <div className="px-[20px] py-[20px] border-t border-[#E5E5E5] flex justify-between items-center bg-[#F9FBFD]">
          <button type="button" className="text-sm font-bold text-[#64748B] hover:text-[#111827] cursor-pointer" onClick={() => onHide()}>
            Cancel
          </button>

          <button type="button" className="inline-flex items-center gap-2 h-10 px-4 bg-[#111827] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1f2937] disabled:bg-[#CBD5E1] disabled:text-[#64748B] disabled:cursor-not-allowed transition-colors" onClick={handleButtonOnClick} disabled={buttonLoading}>
            <Image src="/images/new/sparkle-icon.svg" alt="Sparkle" width={18} height={18} />
            <span>Train External URLs</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  </>)
}