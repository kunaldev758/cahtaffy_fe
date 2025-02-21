'use client'

import Image from 'next/image'
import AddcontentModal from './addContentModal'
import { useEffect } from 'react'
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

import { useSocket } from '@/app/socketContext'


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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Adjust items per page as needed
  const [paginatedData, setPaginatedData] = useState<any>({ data: [], loading: true })
  const [sourceTypeFilter,setSourceTypeFilter] = useState<any>("Show All Sources");
  const [actionTypeFilter,setActionTypeFilter] = useState<any>("Action 1");

  
  const totalPages = Math.ceil(webPageCount.crawled + docCount.crawled + faqCount.crawled / itemsPerPage);


  const handleSourceTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSourceTypeFilter(event.target.value);
  };

  const handleActionTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setActionTypeFilter(event.target.value);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const getData = () => {
    if (!socket) return;
     setTrainingList({ data: [], loading: true }); //set loading here
    socket.on('client-connect-response', function () {
      socket.emit('get-credit-count')
      socket.emit('get-training-list-count')
      socket.emit('get-training-list', { skip: (currentPage - 1) * itemsPerPage, limit: itemsPerPage , sourcetype:sourceTypeFilter ,actionType :actionTypeFilter })
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
      console.log(data,"training list data");
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
      socket.emit('get-training-list', { skip: (currentPage - 1) * itemsPerPage, limit: itemsPerPage, sourcetype:sourceTypeFilter ,actionType :actionTypeFilter })
    }) 

    socket.on('web-pages-crawled', function (data: any) {
      console.log("crawled", data);
    })

    socket.on('web-page-crawled', ({ trainingListId }) => {
      setTrainingList((prevTrainingList: any) => ({
        data: prevTrainingList.data.map((item: any) =>
          item._id === trainingListId ? { ...item, trainingStatus: 2 } : item
        ),
        loading: false,
      }));
    });

    socket.on('web-page-crawling-started', ({ trainingListId }) => {
      setTrainingList((prevTrainingList: any) => ({
        data: prevTrainingList.data.map((item: any) =>
          item._id === trainingListId ? { ...item, trainingStatus: 1 } : item
        ),
        loading: false,
      }));
    });

    socket.on('web-page-minifying-started', ({ trainingListId }) => {
      setTrainingList((prevTrainingList: any) => ({
        data: prevTrainingList.data.map((item: any) =>
          item._id === trainingListId ? { ...item, trainingStatus: 2 } : item
        ),
        loading: false,
      }));
    });

    socket.on('web-page-minified', ({ trainingListId }) => {
      setTrainingList((prevTrainingList: any) => ({
        data: prevTrainingList.data.map((item: any) =>
          item._id === trainingListId ? { ...item, trainingStatus: 4 } : item
        ),
        loading: false,
      }));
    });

    socket.on('web-pages-minified', function (data: any) {
      console.log("minfied", data)
      // Create an object to index data.list items based on _id
      const indexedData = data.list.reduce((acc: any, item: any) => {
        acc[item._id] = item;
        return acc;
      }, {});

      // Update the trainingList state with the modified array
      setTrainingList((prevTrainingList: any) => ({
        data: prevTrainingList.data.map((item1: any) => ({
          ...item1,
          trainingStatus: indexedData[item1._id] && item1.trainingStatus < 3 ? 3 : item1.trainingStatus,
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
      setTrainingList((prevTrainingList: any) => ({
        data: prevTrainingList.data.map((item1: any) => ({
          ...item1,
          trainingStatus: indexedData[item1._id] && item1.trainingStatus < 4 ? 4 : item1.trainingStatus,
        })),
        loading: false,
      }));

    })

     socket.on('faq-added', ( { trainingList }) => {
      setTrainingList((prevTrainingList: any) => ({
           data: [trainingList,...prevTrainingList.data],
           loading: false,
         }));
       socket.emit('get-training-list-count')
     });

      socket.on('doc-snippet-added', ({ trainingList }) => {
       setTrainingList((prevTrainingList: any) => ({
            data: [trainingList,...prevTrainingList.data],
            loading: false,
          }));
        socket.emit('get-training-list-count')
      });


    socket.emit('client-connect')
  }

  useEffect(() => {
    getData()
  }, [currentPage,sourceTypeFilter,actionTypeFilter])


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
                <select 
                className="form-select"
                  value={sourceTypeFilter}
                  onChange={handleSourceTypeChange}
                >
                  <option>Show All Sources</option>
                  <option>Web Pages</option>
                  <option>Doc/Snippets</option>
                  <option>FAQs</option>
                </select>
              </div>

              <div className="custom-dropi">
                <select 
                className="form-select"
                value={actionTypeFilter}
                onChange={handleActionTypeChange}
                >
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
                  (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center' }}>
                        <p>Loading training list...</p>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      </td>
                    </tr>
                  )

                  :
                  <>
                    {trainingList.data.map((item: any, key: any) => (
                      <TrainingList
                        key={key}
                        item={item}
                        componentKey={key}
                        selectAllCheckbox={selectAllCheckbox}
                        handleOnchangeCheckbox={(componentKey: any, checkboxValue: any) => {
                          setTrainingListCheckbox((trainingListCheckbox: any) => ({
                            ...trainingListCheckbox,
                            [componentKey]: checkboxValue,
                          }));
                        }}
                      />
                    ))}
                  </>
                }
              </tbody>
            </table>
          </div>

          <div className="pagination-controls">
            <button
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </button>

            {totalPages <= 10 ? (
              // Show all pages if totalPages <= 10
              Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index}
                  className={currentPage === index + 1 ? 'active' : ''}
                  onClick={() => handlePageChange(index + 1)}
                  style={{ backgroundClip: "red" }}
                >
                  {index + 1}
                </button>
              ))
            ) : (
              // Handle ellipsis for more than 10 pages
              <>
                <button
                  className={currentPage === 1 ? 'active' : ''}
                  onClick={() => handlePageChange(1)}
                >
                  1
                </button>

                {currentPage > 4 && <span>...</span>}

                {Array.from({ length: 5 }, (_, index) => {
                  const page = currentPage - 2 + index;
                  if (page > 1 && page < totalPages) {
                    return (
                      <button
                        key={page}
                        className={currentPage === page ? 'active' : ''}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    );
                  }
                  return null;
                })}

                {currentPage < totalPages - 3 && <span>...</span>}

                <button
                  className={currentPage === totalPages ? 'active' : ''}
                  onClick={() => handlePageChange(totalPages)}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </button>

            {/* Page Search */}
            <div className="page-search">
              <input
                type="number"
                min="1"
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const page = Math.min(
                    Math.max(Number(e.target.value), 1),
                    totalPages
                  );
                  handlePageChange(page);
                }}
              />
              <button onClick={() => handlePageChange(currentPage)}>Go</button>
            </div>
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