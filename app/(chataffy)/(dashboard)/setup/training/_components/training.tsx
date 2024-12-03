'use client'

import Image from 'next/image'
import { basePath } from '@/next.config'
import AddcontentModal from './addContentModal'
import { useEffect } from 'react'
import { io } from "socket.io-client"
import { useState } from 'react'
import TrainingList from './trainingList'

import { logoutApi } from '@/app/_api/dashboard/action'
import { useRouter } from 'next/navigation'

import webPageIconPic from '@/images/web-page-icon.svg'
import docSnippetsIconPic from '@/images/doc-snippets-icon.svg'
import faqIconPic from '@/images/faq-icon.svg'
import searchIconPic from '@/images/search-icon.svg'


import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

import { useSocket } from "@/app/socketContext";

export default function Home(Props: any) {
  const router = useRouter()
  const { socket } = useSocket();

  const [showModal, setShowModal] = useState(false)
  const [webPageCount, setWebPageCount] = useState({ crawled: 0, total: 0, loading: true })
  const [docCount, setDocCount] = useState({ crawled: 0, total: 0, loading: true })
  const [faqCount, setFaqCount] = useState({ crawled: 0, total: 0, loading: true })
  const [credit, setCredit] = useState({ used: 0, total: 0 })
  const [trainingList, setTrainingList] = useState<any>({ data: [], loading: true })
  const [search, setSearch] = useState('')
  const [trainingListCheckbox, setTrainingListCheckbox] = useState({})
  const [selectAllCheckbox, setSelectAllCheckbox] = useState(false)

  const getData = () => {
    if (!socket) return;
    console.log("hello connected");

    // socket.on('client-connect-response', function () {
    //   socket.emit('get-credit-count')
    //   socket.emit('get-conversations-list')
    // })

    socket.on('client-connect-response',async function () {
      await socket.emit('get-credit-count')
      await socket.emit('get-training-list-count')
      await socket.emit('get-training-list')
    })

    socket.on('get-credit-count-response', function ({ data }: any) {
      setCredit({ used: data.used, total: data.total })
    })

    socket.on('get-training-list-count-response', function ({ data }: any) {
      setWebPageCount({ crawled: data.crawledPages, total: data.totalPages, loading: false })
      setDocCount({ crawled: data.crawledDocs, total: data.totalDocs, loading: false })
      setFaqCount({ crawled: data.crawledFaqs, total: data.totalFaqs, loading: false })
    })

    socket.on('get-training-list-response', function ({ data }: any) {
      setTrainingList({ data: data, loading: false })
    })

    socket.on('error-handler', async function (data: any) {
      await logoutApi()
      router.replace('/login')
    })


    socket.on('web-pages-added', function (data: any) {
      console.log("added", data);

      socket.emit('get-credit-count')
      socket.emit('get-training-list-count')
      socket.emit('get-training-list')
    })

    socket.on('web-pages-crawled', function (data: any) {
      console.log("crawled", data);

      // Create an object to index data.list items based on _id
      const indexedData = data.list.reduce((acc: any, item: any) => {
        acc[item._id] = item;
        return acc;
      }, {});
      
      // Update the trainingList state with the modified array
      setTrainingList((prevTrainingList: any) => ({
        data: prevTrainingList.data.map((item1: any) => ({
          ...item1,
          trainingStatus: indexedData[item1._id] && item1.trainingStatus<2 ? 2 : item1.trainingStatus,
        })),
        loading: false,
      }));
      
      // Update the webPageCount state with the updatedCrawledCount
      setWebPageCount((webPageCount) => ({ ...webPageCount, crawled: data.updatedCrawledCount }));      

    })

    socket.on('web-pages-minified', function (data: any) {
      console.log("minfied", data)
       // Create an object to index data.list items based on _id
       const indexedData = data.list.reduce((acc: any, item: any) => {
        acc[item._id] = item;
        return acc;
      }, {});
      
      // Update the trainingList state with the modified array
      setTrainingList((prevTrainingList:any) => ({
        data: prevTrainingList.data.map((item1: any) => ({
          ...item1,
          trainingStatus: indexedData[item1._id] && item1.trainingStatus<3 ? 3 : item1.trainingStatus,
        })),
        loading: false,
      }));
      
    })

    socket.on('web-pages-mapped', function (data: any) {
      console.log("mapped", data)
       // Create an object to index data.list items based on _id
       const indexedData = data.list.reduce((acc: any, item: any) => {
        acc[item._id] = item;
        return acc;
      }, {});
      
      // Update the trainingList state with the modified array
      setTrainingList((prevTrainingList:any) => ({
        data: prevTrainingList.data.map((item1: any) => ({
          ...item1,
          trainingStatus: indexedData[item1._id] && item1.trainingStatus<4 ? 4 : item1.trainingStatus,
        })),
        loading: false,
      }));
      
    })

    socket.emit('client-connect');
  }

  useEffect(() => {
    getData()
  }, [socket])

  return (
    <>

      <div className="top-headbar">
        <div className="top-headbar-heading">Training</div>
        <div className="top-headbar-right flex gap20">
          <div className="top-headbar-credit">
            <div className="headbar-credit-area flex justify-content-space-between">
              <div className="credit-text">Free Credit</div>
              <div className="credit-count">{credit.used}/{credit.total}</div>
            </div>
            <div className="headbar-credit-progress">
              <div className="credit-progressInner" style={{ "width": `${(Number(credit.used) / Number(credit.total)) * 100}%` }}></div>
            </div>

          </div>
          <button className="custom-btn" onClick={() => {
            setShowModal(true)
          }}>Add Content</button>
        </div>
      </div>

      <div className="main-content-area">
        <div className="training-highlight-area">
          <div className="training-highlight-box">
            <div className="training-highlight-top flex align-item-center gap15">
              <div className="training-highlightTop-img">
                <Image src={webPageIconPic} alt="" width={24} height={24} />
              </div>
              <p>Web Pages</p>
            </div>

            <div className="training-highlight-mid">
              <div className="training-highlight-count">
                {webPageCount.loading ?
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> :
                  <h3>{webPageCount.crawled}</h3>}
                <p>Crawled Pages</p>
              </div>
              <div className="training-highlight-count">
                {webPageCount.loading ?
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> :
                  <h3>{webPageCount.total}</h3>}
                <p>Total Pages</p>
              </div>
            </div>
          </div>

          <div className="training-highlight-box">
            <div className="training-highlight-top flex align-item-center gap15">
              <div className="training-highlightTop-img">
                <Image src={docSnippetsIconPic} alt="" width={24} height={24} />
              </div>
              <p>Doc/Snippets</p>
            </div>

            <div className="training-highlight-mid">
              <div className="training-highlight-count">
                {docCount.loading ?
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> :
                  <h3>{docCount.crawled}</h3>}
                <p>Crawled Doc</p>
              </div>
              <div className="training-highlight-count">
                {docCount.loading ?
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> :
                  <h3>{docCount.total}</h3>}
                <p>Total Doc</p>
              </div>
            </div>
          </div>

          <div className="training-highlight-box">
            <div className="training-highlight-top flex align-item-center gap15">
              <div className="training-highlightTop-img">
                <Image src={faqIconPic} alt="" width={24} height={24} />
              </div>
              <p>FAQs</p>
            </div>

            <div className="training-highlight-mid">
              <div className="training-highlight-count">
                {faqCount.loading ?
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> :
                  <h3>{faqCount.crawled}</h3>}
                <p>Crawled FAQs</p>
              </div>
              <div className="training-highlight-count">
                {faqCount.loading ?
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> :
                  <h3>{faqCount.total}</h3>}
                <p>Total FAQs</p>
              </div>
            </div>
          </div>
        </div>

        <div className="training-table-area">
          <div className="training-table-head flex justify-content-space-between align-item-center">
            <div className="training-tableHead-left flex gap20">
              <div className="custom-dropi">
                <select className="form-select">
                  <option>Show All Sources</option>
                  <option>Web Pages</option>
                  <option>Doc/Snippets</option>
                  <option>FAQs</option>
                </select>
              </div>

              <div className="custom-dropi">
                <select className="form-select">
                  <option>Action</option>
                  <option>Action 1</option>
                  <option>Action 2</option>
                </select>
              </div>
            </div>

            <div className="training-tableHead-right">
              <div className="input-box input-iconBox">
                <span className="input-icon"><Image src={searchIconPic} alt="" width={21} height={20} /></span>
                <input type="text" placeholder="Search" className="form-control" value={search} onChange={(event: any) => {
                  setSearch(event.target.value)
                }} />
              </div>
            </div>
          </div>

          <div className="training-table">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" checked={selectAllCheckbox} onChange={() => {
                        setSelectAllCheckbox(!selectAllCheckbox)
                      }} />
                    </div>
                    Title/URL
                  </th>
                  <th>Type</th>
                  <th>Last Edit</th>
                  <th>Time Used</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {trainingList.loading ?
                  <>
                    {[...Array(10)].map((_, index) => (
                      <tr key={index}>
                        {[...Array(6)].map((_, index) => (
                          <td key={index}>
                            <Skeleton />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>

                  :
                  <>
                    {trainingList.data.map((item: any, key: any) => (
                      <TrainingList
                        key={key}
                        item={item}
                        componentKey={key}
                        selectAllCheckbox={selectAllCheckbox}
                        handleOnchangeCheckbox={(componentKey: any, checkboxValue: any) => {
                          setTrainingListCheckbox((trainingListCheckbox: any) => ({ ...trainingListCheckbox, [componentKey]: checkboxValue })
                          )
                        }}
                      />
                    ))}
                  </>

                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <AddcontentModal
        showModal={showModal}
        onHide={() => {
          setShowModal(false)
        }}
      />
    </>
  )
}