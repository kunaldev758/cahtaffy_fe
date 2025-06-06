
import {Metadata} from 'next'
import Image from 'next/image'



export const metadata: Metadata = {
  title: 'Chataffy | Dashboard',
  description: 'Chataffy | Dashboard',
  
}
import calendarImage from '@/images/calendar.svg';
import totalChatIconImage from '@/images/total-chat-icon.svg';
import totalMessageIconImage from '@/images/total-message-icon.svg';
import artIconImage from '@/images/art-icon.svg';
import csatIconImage from '@/images/csat-icon.svg';
import fallbackMessageIconImage from '@/images/fallback-message-icon.svg';
import uptimeIconImage from '@/images/uptime-icon.svg';
import trainingIconImage from '@/images/training-icon.svg';
import closeBtnImage from '@/images/close-btn.svg';
import tagPlusImage from '@/images/tag-plus.svg';
import mapImage from '@/images/map.png';

export default function Home() {
  return (
    <><div className="main-content">


    <div className="top-headbar">
        <div className="top-headbar-heading">Dashboard</div>
        <div className="top-headbar-right">
            <div className="date-pickerArea">
                <div className="input-box input-iconBox">
                    <span className="input-icon"><Image src={calendarImage} alt="" /></span>
                    <input type="text" placeholder="Search" className="form-control" value="13 June 2023 - 14 July 2023" />
                </div>
            </div>
        </div>
    </div>

    <div className="main-content-area">
        <div className="dashboard-area d-flex gap-20">
            <div className="dashboard-left flex-grow-1">
                <div className="d-grid gap-20 grid-column-4">
                    <div className="card d-flex flex-column">
                        <div className="dashboard-Lefticon">
                            <Image src={totalChatIconImage} alt="" />
                        </div>
                        <div className="dashboard-highlightContent">
                            <h3>200</h3>
                            <p>Total Chat</p>
                        </div>
                    </div>
                    
                    <div className="card d-flex flex-column">
                        <div className="dashboard-Lefticon">
                            <Image src={totalMessageIconImage} alt="" />
                        </div>
                        <div className="dashboard-highlightContent">
                            <h3>2,000</h3>
                            <p>Total Message</p>
                        </div>
                    </div>

                    <div className="card d-flex flex-column">
                        <div className="dashboard-Lefticon">
                            <Image src={artIconImage} alt="" />
                        </div>
                        <div className="dashboard-highlightContent">
                            <h3>10.22s</h3>
                            <p>ART</p>
                        </div>
                    </div>

                    <div className="card d-flex flex-column">
                        <div className="dashboard-Lefticon">
                            <Image src={csatIconImage} alt="" />
                        </div>
                        <div className="dashboard-highlightContent">
                            <h3>100%</h3>
                            <p>CSAT</p>
                        </div>
                    </div>
                </div>

                <div className="d-grid gap-20 mt-20 grid-column-2">
                    <div className="card d-flex flex-row gap-20 align-item-center">
                        <div className="dashboard-Lefticon mb-0">
                            <Image src={fallbackMessageIconImage} alt="" />
                        </div>
                        <div className="dashboard-highlightContent">
                            <h3>40</h3>
                            <p>Fallback Message</p>
                        </div>
                    </div>
                    
                    <div className="card d-flex flex-row gap-20 align-item-center">
                        <div className="dashboard-Lefticon mb-0">
                            <Image src={uptimeIconImage} alt="" />
                        </div>
                        <div className="dashboard-highlightContent">
                            <h3>100.00%</h3>
                            <p>Uptime</p>
                        </div>
                    </div>
                </div>

                <div className="d-grid gap-20 mt-20">                            
                    <div className="card training-highlight-box">
                        <div className="d-flex flex-row gap-20 align-item-center">
                            <div className="dashboard-Lefticon dashboard-aiIcon mb-0">
                                <Image src={trainingIconImage} alt="" />
                            </div>
                            <div className="dashboard-highlightContent">
                                <h3 className="mb-0">Ai Assists</h3>
                            </div>
                        </div>
    
                        <div className="training-highlight-mid mt-3 mb-0">
                            <div className="training-highlight-count">
                                <h3>500</h3>
                                <p>AI Chats</p>
                            </div>
                            <div className="training-highlight-count">
                                <h3>2000</h3>
                                <p>Total Chats</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-right">
                <div className="card setup-progresrArea">
                    <div className="setup-progressHead">
                        <div className="d-flex align-item-center justify-content-between">
                            <h3>Get Started</h3>
                            <button type="button" className="plain-btn"><Image src={closeBtnImage} alt="" /></button>
                        </div>
                        <p className="text-gray mt-6">We&apos;ll guide you to setup your account.</p>
                    </div>
                    <div className="dashboard-progressBar">
                        <div className="headbar-credit-progress"></div>
                        <div className="headbar-credit-area">
                            <div className="credit-text">1 of 3 tasks completed</div>
                        </div>
                        <div className="dashboard-setupArea">
                            <ul className="m-0 p-0">
                                <li className="d-flex align-item-center justify-content-between position-relative">
                                    <div className="d-flex gap-3 align-item-center">
                                        <div className="setup-progressPoint done"></div>
                                        <p>Web Page</p>
                                    </div>
                                </li>

                                <li className="d-flex align-item-center justify-content-between position-relative">
                                    <div className="d-flex gap-3 align-item-center">
                                        <div className="setup-progressPoint"></div>
                                        <p>Doc/Snippets</p>
                                    </div>
                                    <button className="custom-btn d-flex gap-2 align-item-center"><Image src={tagPlusImage} alt="" /> Add</button>
                                </li>

                                <li className="d-flex align-item-center justify-content-between position-relative">
                                    <div className="d-flex gap-3 align-item-center">
                                        <div className="setup-progressPoint"></div>
                                        <p>FAQ&apos;s</p>
                                    </div>
                                    <button className="custom-btn d-flex gap-2 align-item-center"><Image src={tagPlusImage} alt="" /> Add</button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="card setup-progresrArea mt-20">
                    <div className="mapArea">
                        <Image src={mapImage} alt="" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</div></>
  )
}