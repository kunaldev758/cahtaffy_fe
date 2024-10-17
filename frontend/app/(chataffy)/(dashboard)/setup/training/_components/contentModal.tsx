'use client'

import { useEffect, useState } from 'react'
import { Offcanvas, Accordion } from 'react-bootstrap'

import {getOpenaiTrainingListDetail} from '@/app/_api/dashboard/action'
import Skeleton from 'react-loading-skeleton'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home(Props: any) {
  const router = useRouter()
  const [loading,setLoading] = useState(true);

  const [heading,setHeading] = useState('')
  const [type,setType] = useState(0)
  const [lastEdit,setLastEdit] = useState()
  const [status,setStatus] = useState(0) // ==0 ? 'NotStarted' : status==1 ? 'Progress' : status==2 ? 'Success' : 'Failed'
  const [trainingListData,setTrainingListData] = useState<any>({})
  
  const contentType = ['Web Page', 'Faq', 'Document', 'File' ];
  const contentStatus = ['', 'Listed', 'Crawled', 'Minified', 'Mapped'];
  contentStatus[9] = "Failed";
  contentStatus[19] = "Failed";
  contentStatus[99] = "Failed";

  useEffect(()=>{
    getOpenaiTrainingListDetail(Props.id).then((data:any)=>{
      if(data=='error'){
        router.push('/login')
        return false
      }
      setLoading(false);
      setHeading(data.title);
      setType(data.type);
      setLastEdit(data.lastEdit);
      setStatus(data.trainingStatus);
      // setStatus(data.timeUsed);
      // setStatus(data.isActive);
      switch(data.type){
        case 0:
          setTrainingListData(data.webPage);
          break;
        case 1:
          setTrainingListData(data.faq);
          break;
        case 2:
          setTrainingListData(data.snippet);
          break;
        case 3:
          setTrainingListData(data.file);
          break;        
      }
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
                  <div className="crawl-modaldetails-left"><Skeleton /></div>
                  <div className="crawl-modaldetails-right"><a href="" target="_blank"><Skeleton /></a></div>
                </div>

                <div className="crawl-modaldetails-box">
                  <div className="crawl-modaldetails-left"><Skeleton /></div>
                  <div className="crawl-modaldetails-right"><Skeleton /></div>
                </div>

                <div className="crawl-modaldetails-box">
                  <div className="crawl-modaldetails-left"><Skeleton /></div>
                  <div className="crawl-modaldetails-right"><Skeleton /></div>
                </div>

                <div className="crawl-modaldetails-box">
                  <div className="crawl-modaldetails-left"><Skeleton /></div>
                  <div className="crawl-modaldetails-right"><Skeleton /></div>
                </div>
              </div>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>

        <div className="crawl-modalContent">
        <Skeleton count={10}/>
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
                {type==0 && <>
                  <div className="crawl-modaldetails-box">
                    <div className="crawl-modaldetails-left">URL</div>
                    <div className="crawl-modaldetails-right"><a href={trainingListData.url || "#"} target="_blank">{trainingListData.url || ""}</a></div>
                  </div>

                  <div className="crawl-modaldetails-box">
                    <div className="crawl-modaldetails-left">Title</div>
                    <div className="crawl-modaldetails-right">{trainingListData.title || ""}</div>
                  </div>

                  <div className="crawl-modaldetails-box">
                    <div className="crawl-modaldetails-left">Meta Description</div>
                    <div className="crawl-modaldetails-right">{trainingListData.metaDescription || ""}</div>
                  </div>
                </>}
                {type==3 && <>
                  <div className="crawl-modaldetails-box">
                    <div className="crawl-modaldetails-left">File Name</div>
                    <div className="crawl-modaldetails-right"><Link href={trainingListData.path ? ("../"+trainingListData.path) : "#"} target="_blank">{trainingListData.originalFileName || ""}</Link></div>
                  </div>
                </>}

                <div className="crawl-modaldetails-box">
                  <div className="crawl-modaldetails-left">Type</div>
                  <div className="crawl-modaldetails-right">{contentType[type]}</div>
                </div>

                <div className="crawl-modaldetails-box">
                  <div className="crawl-modaldetails-left">Last Edit</div>
                  <div className="crawl-modaldetails-right">{lastEdit}</div>
                </div>

                <div className="crawl-modaldetails-box">
                  <div className="crawl-modaldetails-left">Status</div>
                  <div className="crawl-modaldetails-right"><span className="badge rounded-pill text-bg-success">{contentStatus[status]}</span></div>
                </div>
              </div>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>

        <div className="crawl-modalContent">
          {type==0 && <div dangerouslySetInnerHTML={{ __html: trainingListData.content || "" }} />}
          {type==1 && <>
            <h4>Question:</h4><div dangerouslySetInnerHTML={{ __html: trainingListData.question || "" }} />
            <h4>Answer:</h4><div dangerouslySetInnerHTML={{ __html: trainingListData.answer || "" }} />
          </>}
          {type==2 && (<>
            <h4>Title:</h4><div dangerouslySetInnerHTML={{ __html: trainingListData.title || "" }} />
            <h4>Content:</h4><div dangerouslySetInnerHTML={{ __html: trainingListData.content || "" }} />            
          </>)}
          {type==3 && (<>
              <div dangerouslySetInnerHTML={{ __html: trainingListData.content || "" }} />
          </>)}
        </div>
      </Offcanvas.Body>
    </Offcanvas>}
  </>)
}