'use client'

import { useState,useEffect } from 'react'
import { Modal } from 'react-bootstrap'
import { openaiWebPageScrapeApi } from '@/app/_api/dashboard/action'
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation'
import { getClientData } from '@/app/_api/dashboard/action'

export default function Home(Props: any) {
  const router = useRouter()
  const [toggle, setToggle] = useState(false)
  const [url, setUrl] = useState('')
  const [urls, setUrls] = useState('')
  const [buttonLoading, setButtonLoading] = useState(false)
  const [client,setClient] = useState(null) as any;

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
    let sitemap = (toggle == true ? urls : url)
    if (url.trim().length == 0 && toggle == false) {
      toast.error("Enter URL")
      return false
    }

    if (urls.trim().length == 0 && toggle == true) {
      toast.error("Enter URLs")
      return false
    }

    
    setButtonLoading(true)

    let response: any = null
    if(toggle == true){
       response = await openaiWebPageScrapeApi(sitemap,true)
    } else{
       response = await openaiWebPageScrapeApi(sitemap,false)
    }
    // const response: any = await openaiWebPageScrapeApi(sitemap)
    if (response==null || response == 'error'){
      setButtonLoading(false)
      router.push('/login')
    }
    setButtonLoading(false)
    Props.onHide()
    toast.success(response.message)

  }

  return (<>

    <Modal show={Props.showModal} onHide={Props.onHide} size='sm' centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title as='h1'>Add new Web Pages</Modal.Title>
      </Modal.Header>
      <Modal.Body>
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
            <div>
              <p>One sitemap already added you can't add another try adding URls manually below</p>
            </div>
          )}

          <div className="contnet-specific-urlArea">
            <div className="specific-urlHeading">
              <h4>You can also provide a list of specific URLs to add content from</h4>
              <label className="toggle">
                <input className="toggle-checkbox" type="checkbox" checked={toggle} onChange={() => { setToggle(!toggle) }} />
                <div className="toggle-switch"></div>
              </label>
            </div>

            {toggle &&
              <div className="specific-urlBox">
                <textarea className="form-control" placeholder="https://chataffy.com,  https://chataffy.com/page1,  https://chataffy.com/page2" onChange={(event) => {
                  setUrls(event.target.value)
                }}>{urls}</textarea>
              </div>}
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
            : 'Fetch External URLs'}
        </button>
      </Modal.Footer>
    </Modal>
  </>)
}