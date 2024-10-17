'use client'

import {getMessageSources} from '@/app/_api/dashboard/action'
import { useEffect, useState } from 'react';

import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

import ContentModal from '@/app/(chataffy)/(dashboard)/setup/training/_components/contentModal'

export default function InformationSources(props: any) {
  const [informationSources, setInformationSources] = useState<any>({ data: [], loading: true});
  const sourceType = ["Web Page", "File", "Snippet", "FAQ"];
  const [dataFetched, setDataFetched] = useState(false);
  const [contentShowModal,setContentShowModal] = useState("")

  const getInformationSources = async (trainingListIds: any) => {
    try {
      getMessageSources(trainingListIds).then((data: any) => {
        console.log(data, "messageSources");
        setInformationSources({ data:data.trainingLists, loading:false });
        setDataFetched(true); 
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  useEffect(()=>{
    if(!dataFetched){
      getInformationSources(props.trainingListIds);
    }
  },[props.trainingListIds]);

  return (
    <>
      {props.trainingListIds.map((item: any, index: any) => (
        <div key={index}>
          {contentShowModal===item && <ContentModal show={contentShowModal===item} handleClose={() => { setContentShowModal("") }} id={item}/>}
        </div>
      ))}
      <div className="sourceChat-show">
        {informationSources.loading ?
                  <>
                    {[...Array(3)].map((_, index) => (
                      <p key={index} data-bs-toggle="offcanvas" data-bs-target="#contentModal" aria-controls="offcanvasWithBothOptions"><Skeleton /></p>
                    ))}
                  </>
                  :
                  <>
                    {informationSources.data.map((item: any, index: any) => (
                      <p key={index} data-bs-toggle="offcanvas" data-bs-target="#contentModal" aria-controls="offcanvasWithBothOptions" onClick={()=>{
                        setContentShowModal(item._id)
                       }}><strong>{sourceType[item.type]}</strong> - {item.title}</p>
                    ))}
                  </>
        }
      </div>
    </>
    )
}