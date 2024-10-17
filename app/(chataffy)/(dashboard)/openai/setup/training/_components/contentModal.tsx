'use client'

import { useEffect, useState } from 'react'
import { Offcanvas, Accordion } from 'react-bootstrap'

import {getOpenaiTrainingListDetail} from '@/app/_api/dashboard/action'
import Skeleton from 'react-loading-skeleton'
import { useRouter } from 'next/navigation'

export default function Home(Props: any) {
  const router = useRouter()
  const [heading,setHeading] = useState()
  const [title,setTitle] = useState()
  const [url,setUrl] = useState()
  const [metaDescription,setMetaDescription] = useState()
  const [type,setType] = useState()
  const [lastEdit,setLastEdit] = useState()
  const [status,setStatus] = useState()
  const [content,setContent] = useState<any>()
  const [loading,setLoading] = useState(true)

  useEffect(()=>{
    getOpenaiTrainingListDetail(Props.id).then((data:any)=>{
      if(data=='error'){
        router.push('/login')
        return false
      }
      setLoading(false)
      setHeading(data.title)
      setType(data.type)
      setLastEdit(data.lastEdit)
      setTitle(data.webPage.title)
      setUrl(data.webPage.url)
      setMetaDescription(data.webPage.metaDescription)
      setContent(data.webPage.content)
      setStatus(data.webPage.crawlingStatus)
      
    })
  }, [])

  return (<>
  {loading ?
    <Offcanvas show={Props.show} onHide={Props.handleClose} placement='end' className='Contentdetails-modal'>
      <Offcanvas.Header closeButton>
        <Offcanvas.Title><Skeleton /></Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body className='p-0'>
        <Accordion defaultActiveKey="0" className='Contentdetails-accordion'>
          <Accordion.Item eventKey="0">
            <Accordion.Header>DETAILS</Accordion.Header>
            <Accordion.Body>
              <div className="crawl-modaldetails">
                <div className="crawl-modaldetails-box">
                  <div className="crawl-modaldetails-left">URL</div>
                  <div className="crawl-modaldetails-right"><a href="" target="_blank"><Skeleton /></a></div>
                </div>

                <div className="crawl-modaldetails-box">
                  <div className="crawl-modaldetails-left">Title</div>
                  <div className="crawl-modaldetails-right"><Skeleton /></div>
                </div>

                <div className="crawl-modaldetails-box">
                  <div className="crawl-modaldetails-left">Meta Description</div>
                  <div className="crawl-modaldetails-right"><Skeleton /></div>
                </div>

                <div className="crawl-modaldetails-box">
                  <div className="crawl-modaldetails-left">Type</div>
                  <div className="crawl-modaldetails-right"><Skeleton /></div>
                </div>

                <div className="crawl-modaldetails-box">
                  <div className="crawl-modaldetails-left">Last Edit</div>
                  <div className="crawl-modaldetails-right"><Skeleton /></div>
                </div>

                <div className="crawl-modaldetails-box">
                  <div className="crawl-modaldetails-left">Status</div>
                  <div className="crawl-modaldetails-right"><Skeleton /></div>
                </div>
              </div>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>

        <div className="crawl-modalContent">
        <Skeleton count={30}/>
        </div>
      </Offcanvas.Body>
    </Offcanvas>

:
    <Offcanvas show={Props.show} onHide={Props.handleClose} placement='end' className='Contentdetails-modal'>
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>{heading}</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body className='p-0'>
        <Accordion defaultActiveKey="0" className='Contentdetails-accordion'>
          <Accordion.Item eventKey="0">
            <Accordion.Header>DETAILS</Accordion.Header>
            <Accordion.Body>
              <div className="crawl-modaldetails">
                <div className="crawl-modaldetails-box">
                  <div className="crawl-modaldetails-left">URL</div>
                  <div className="crawl-modaldetails-right"><a href="" target="_blank">{url}</a></div>
                </div>

                <div className="crawl-modaldetails-box">
                  <div className="crawl-modaldetails-left">Title</div>
                  <div className="crawl-modaldetails-right">{title}</div>
                </div>

                <div className="crawl-modaldetails-box">
                  <div className="crawl-modaldetails-left">Meta Description</div>
                  <div className="crawl-modaldetails-right">{metaDescription}</div>
                </div>

                <div className="crawl-modaldetails-box">
                  <div className="crawl-modaldetails-left">Type</div>
                  <div className="crawl-modaldetails-right">{type==0 ? 'Web Page' : type==1 ? 'File' : type==2 ? 'Snippet' : 'Faq' }</div>
                </div>

                <div className="crawl-modaldetails-box">
                  <div className="crawl-modaldetails-left">Last Edit</div>
                  <div className="crawl-modaldetails-right">{lastEdit}</div>
                </div>

                <div className="crawl-modaldetails-box">
                  <div className="crawl-modaldetails-left">Status</div>
                  <div className="crawl-modaldetails-right"><span className="badge rounded-pill text-bg-success">{status==0 ? 'NotStarted' : status==1 ? 'Progress' : status==2 ? 'Success' : 'Failed'}</span></div>
                </div>
              </div>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>

        <div className="crawl-modalContent">
         <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      </Offcanvas.Body>
    </Offcanvas>}
  </>)
}