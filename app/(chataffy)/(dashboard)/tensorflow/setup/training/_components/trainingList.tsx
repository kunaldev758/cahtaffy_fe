'use client'

import { useEffect, useState } from "react"
import ContentModal from './contentModal'
import { tensorflowToggleActiveStatus } from '../../../../../../_api/dashboard/action'

export default function Home({ item, handleOnchangeCheckbox, componentKey, selectAllCheckbox }: { item: any, handleOnchangeCheckbox: any, componentKey: any, selectAllCheckbox: any }) {
  const [toggle, setToggle] = useState(item.isActive)
  const [checkbox, setCheckbox] = useState(false)
  const [contentShowModal,setContentShowModal] = useState(false)

  useEffect(() => {
    setCheckbox(selectAllCheckbox)
  }, [selectAllCheckbox])
  return (
    <>
    {contentShowModal && <ContentModal show={contentShowModal} handleClose={() => { setContentShowModal(false) }} id={item._id}/>}
      <tr>
        <td>
          <div className="form-check">
            <input className="form-check-input" type="checkbox" checked={checkbox} onChange={() => {
              setCheckbox(!checkbox)
              handleOnchangeCheckbox(componentKey, !checkbox)
            }} />
          </div>
         <span className="trainingModal-url" onClick={()=>{
          setContentShowModal(true)
         }}>{item.title}</span> 
        </td>
        <td>{item.type==0 ? 'Web Page' : item.type==1 ? 'File' : item.type==2 ? 'Snippet' : 'Faq' }</td>
        <td>{item.lastEdit}</td>
        <td>{item.timeUsed}</td>
        <td>
          {/* <span className={`badge rounded-pill text-bg-warning`}>{item.crawlingStatus==0 ? 'NotStarted' : item.crawlingStatus==1 ? 'Progress' : item.crawlingStatus==2 ? 'Success' : 'Failed'}</span>
          <span className={`badge rounded-pill text-bg-warning`}>{item.mappingStatus==0 ? 'NotStarted' : item.mappingStatus==1 ? 'Progress' : item.mappingStatus==2 ? 'Success' : 'Failed'}</span> */}
        <span className={`badge rounded-pill text-bg-warning`}>{item.trainingStatus}</span>
        </td>
        <td>
          <label className="toggle">
            <input className="toggle-checkbox" type="checkbox" checked={Boolean(toggle)} onChange={async() => {
              setToggle(!toggle)
              await tensorflowToggleActiveStatus(item._id)
            }} />
            <div className="toggle-switch"></div>
          </label>
        </td>
      </tr>
    </>)
}