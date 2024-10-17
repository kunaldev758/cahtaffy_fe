
'use client'

import Accordion from 'react-bootstrap/Accordion';
import { useEffect, useState } from 'react'
import { getWidgetToken } from '@/app/_api/dashboard/action'
import { useRouter } from 'next/navigation'
import EmbeddingCode from './embeddingCode'
import appearanceIconImage from '@/images/appearance-icon.svg'
import logoUploadImage from '@/images/logo-upload.png'
import widgetPositionIconImage from '@/images/widget-position-icon.svg'
import preChatFormIconImage from '@/images/pre-chat-form-icon.svg'
import tagPlusImage from '@/images/tag-plus.svg'
import additionalTweaksIconImage from '@/images/additional-tweaks-icon.svg'
import widgetIconImage from '@/images/widget-icon.png'
import clientLogoImage from '@/images/client-logo.png'
import closeBtnImage from '@/images/close-btn.svg'
import sendIconWidgetImage from '@/images/send-icon-widget.svg'
import Image from 'next/image';


export default function Widget() {

  return (
    <><div className="main-content-area">
      <div className="inbox-area d-flex">
        <div className="widget-settingSection flex-grow-1">
          <div className="inbox-heading d-flex justify-content-between align-item-center">
            <div className="top-headbar-heading">Widget Setting</div>
          </div>
    
          <div className="widget-settingInner custom-scrollbar">
            <div className="widget-settingBox">
              <Accordion className="accordion Contentdetails-accordion" id="accordionExample">
                <Accordion.Item eventKey="0" className="accordion-item">
                  <Accordion.Header><Image src={appearanceIconImage} alt="" /> Embed Code</Accordion.Header>
                  <Accordion.Body className="accordion-body">
                    <EmbeddingCode />
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </div>

            <div className="widget-settingBox">
              <Accordion className="accordion Contentdetails-accordion" id="accordionExample">
                <Accordion.Item eventKey="0" className="accordion-item">
                  <Accordion.Header><Image src={appearanceIconImage} alt="" /> Appearance</Accordion.Header>
                  <Accordion.Body className="accordion-body">
                      <div className="setting-accordionArea">
                        <div className="setting-field widget-logoUpload mb-20">
                        <Image src={logoUploadImage} alt="" />
                        </div>
                        <p className="mb-20"><strong>Note:</strong> Please upload jpg, png, or gif file that is no larger than 1500x1000 pixels.</p>

                        <div className="input-box mb-20">
                          <label>Title Bar Text</label>
                          <input type="text" placeholder="Enter a title" className="form-control" />
                        </div>

                        <div className="input-box mb-20">
                          <label>Title Bar Text</label>
                          <textarea className="form-control" placeholder="Welcome Message here"></textarea>
                        </div>

                        <div className="widget-colorPicker flex-wrap d-flex gap-20">
                          <div className="color-pickerBox">
                            <label className="form-label">Title Bar</label>
                            <div className="border rounded-3 d-flex align-item-center justify-content-between">
                              <span className="colorCode">#FFFFFF</span>
                              <div className="pick-colorBox">
                                <span></span>
                              </div>
                            </div>
                          </div>

                          <div className="color-pickerBox">
                            <label className="form-label">Title Bar</label>
                            <div className="border rounded-3 d-flex align-item-center justify-content-between">
                              <span className="colorCode">#FFFFFF</span>
                              <div className="pick-colorBox">
                                <span></span>
                              </div>
                            </div>
                          </div>

                          <div className="color-pickerBox">
                            <label className="form-label">Title Bar</label>
                            <div className="border rounded-3 d-flex align-item-center justify-content-between">
                              <span className="colorCode">#FFFFFF</span>
                              <div className="pick-colorBox">
                                <span></span>
                              </div>
                            </div>
                          </div>

                          <div className="color-pickerBox">
                            <label className="form-label">Title Bar</label>
                            <div className="border rounded-3 d-flex align-item-center justify-content-between">
                              <span className="colorCode">#FFFFFF</span>
                              <div className="pick-colorBox">
                                <span></span>
                              </div>
                            </div>
                          </div>

                          <div className="color-pickerBox">
                            <label className="form-label">Title Bar</label>
                            <div className="border rounded-3 d-flex align-item-center justify-content-between">
                              <span className="colorCode">#FFFFFF</span>
                              <div className="pick-colorBox">
                                <span></span>
                              </div>
                            </div>
                          </div>

                          <div className="color-pickerBox">
                            <label className="form-label">Title Bar</label>
                            <div className="border rounded-3 d-flex align-item-center justify-content-between">
                              <span className="colorCode">#FFFFFF</span>
                              <div className="pick-colorBox">
                                <span></span>
                              </div>
                            </div>
                          </div>

                          <div className="color-pickerBox">
                            <label className="form-label">Title Bar</label>
                            <div className="border rounded-3 d-flex align-item-center justify-content-between">
                              <span className="colorCode">#FFFFFF</span>
                              <div className="pick-colorBox">
                                <span></span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </div>

            <div className="widget-settingBox">
              <Accordion className="accordion Contentdetails-accordion" id="accordionExample2">
                <Accordion.Item eventKey="0" className="accordion-item">
                  <Accordion.Header><Image src={widgetPositionIconImage} alt="" /> Widget Position</Accordion.Header>
                  <Accordion.Body className="accordion-body">
                      <div className="setting-accordionArea widget-position">
                        <div className="d-flex gap-20">
                          <div className="custom-dropi">
                            <label className="form-label">Align to:</label>
                            <select className="form-select width-100">
                              <option>Right</option>
                              <option>Left</option>
                            </select>
                          </div>

                          <div>
                            <label className="form-label">Side spacing:</label>
                            <div className="d-flex align-item-center gap-2">
                              <input type="text" className="form-control width-100" defaultValue="0" />
                                <label className="form-label mb-0">px</label>
                            </div>
                          </div>

                          <div>
                            <label className="form-label">Bottom spacing:</label>
                            <div className="d-flex align-item-center gap-2">
                              <input type="text" className="form-control width-100" defaultValue="0" />
                                <label className="form-label mb-0">px</label>
                            </div>
                          </div>
                        </div>
                      </div>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </div>

            <div className="widget-settingBox">
              <Accordion className="accordion Contentdetails-accordion" id="accordionExample3">
                <Accordion.Item eventKey="0" className="accordion-item">
                  <Accordion.Header><Image src={preChatFormIconImage} alt="" />
                          Pre Chat Form
                          <label className="toggle ml-10">
                            <input className="toggle-checkbox" type="checkbox" defaultChecked />
                              <div className="toggle-switch"></div>
                          </label>
                  </Accordion.Header>
                  <Accordion.Body className="accordion-body">
                      <div className="setting-accordionArea">
                        <div className="pre-chatArea">
                          <div className="preChat-box mb-20">
                            <div className="preChat-head d-flex justify-content-end">
                              <div className="d-flex align-item-center gap-2">
                                <div className="form-check">
                                  <input className="form-check-input" type="checkbox" defaultChecked id="flexCheckDefault" />
                                </div>
                                <label htmlFor="flexCheckDefault">Required</label>
                                <button type="button" className="btn-close ml-10"></button>
                              </div>
                            </div>

                            <div className="input-box mt-3">
                              <input type="text" placeholder="Name" className="form-control" />
                            </div>
                          </div>

                          <div className="preChat-box mb-20">
                            <div className="preChat-head d-flex justify-content-end">
                              <div className="d-flex align-item-center gap-2">
                                <div className="form-check">
                                  <input className="form-check-input" type="checkbox" defaultChecked id="flexCheckDefault2" />
                                </div>
                                <label htmlFor="flexCheckDefault2">Required</label>
                                <button type="button" className="btn-close ml-10"></button>
                              </div>
                            </div>

                            <div className="input-box mt-3">
                              <input type="email" placeholder="Email" className="form-control" />
                            </div>
                          </div>

                          <div className="preChat-box mb-20">
                            <div className="preChat-head d-flex justify-content-end">
                              <div className="d-flex align-item-center gap-2">
                                <div className="form-check">
                                  <input className="form-check-input" type="checkbox" defaultChecked id="flexCheckDefault3" />
                                </div>
                                <label htmlFor="flexCheckDefault3">Required</label>
                                <button type="button" className="btn-close ml-10"></button>
                              </div>
                            </div>

                            <div className="input-box mt-3">
                              <input type="text" placeholder="Phone" className="form-control" />
                            </div>
                          </div>

                          <div>
                            <button className="custom-btn d-flex gap-2 align-item-center"><Image src={tagPlusImage} alt="" /> Add Element</button>
                          </div>
                        </div>
                      </div>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </div>

            <div className="widget-settingBox">
              <Accordion className="accordion Contentdetails-accordion" id="accordionExample4">
                <Accordion.Item eventKey="0" className="accordion-item">
                  <Accordion.Header><Image src={additionalTweaksIconImage} alt="" /> Additional tweaks</Accordion.Header>
                  <Accordion.Body className="accordion-body">
                      <div className="setting-accordionArea">
                        <div className="additional-tweakArea mt-20">
                          <div className="additional-tweakBox d-flex align-item-center mb-20 position-relative">
                            <h4 className="mb-0">Show logo</h4>
                            <label className="toggle">
                              <input className="toggle-checkbox" type="checkbox" defaultChecked />
                                <div className="toggle-switch"></div>
                            </label>
                          </div>

                          <div className="additional-tweakBox d-flex align-item-center position-relative">
                            <h4 className="mb-0">White label widget</h4>
                            <label className="toggle">
                              <input className="toggle-checkbox" type="checkbox" defaultChecked />
                                <div className="toggle-switch"></div>
                            </label>
                          </div>
                        </div>
                      </div>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </div>


          </div>
        </div>

        <div className="widget-previewSection">
          <div className="inbox-heading d-flex justify-content-between align-item-center">
            <div className="top-headbar-heading">Preview</div>
          </div>

          <div className="chataffy-widget-area">
            <div className="chataffy-widgetBtn-box" style={{right: "40px"}}>
              <div className="chataffy-widget-btn"><Image src={widgetIconImage} alt="" width={37} height={37} /></div>
            </div>

            <div className="chataffy-messageFrame">
              <div className="chataffy-widget-head" style={{background: "#222222"}}>
                <div className="chataffy-widget-headLeft">
                  <div className="chataffy-head-clientLogo"><Image src={clientLogoImage} alt="" width={40} height={40} /></div>
                  <div className="chataffy-head-infoArea">
                    <div className="chataffy-headName" style={{color: "#ffffff"}}>Chataffy</div>
                    <div className="chataffy-headStatus" style={{color: "#ffffff"}}><span className="chataffy-statusPoint"></span> Online</div>
                  </div>
                </div>

                <div className="chataffy-widget-headRight">
                  <button type="button" className="chataffy-widget-closeBtn"><Image src={closeBtnImage} alt="" /></button>
                </div>
              </div>

              <div className="chataffy-widget-body">
                <div className="chataffy-widget-chatArea">
                  <div className="chataffy-widget-messageArea">
                    <div className="chataffy-widget-messageImage">
                      <Image src={clientLogoImage} alt="" width={40} height={40} />
                    </div>

                    <div className="chataffy-widget-messageBox">
                      <div className="chataffy-widget-message">
                        <p>👋 Hi there! How can I help?</p>
                      </div>
                      <div className="chataffy-widget-messageInfo">
                        03:10 PM
                      </div>
                    </div>
                  </div>

                  <div className="chataffy-widget-messageClient">
                    <div className="chataffy-widget-messageBox">
                      <div className="chataffy-widget-message" style={{background: "#222222", color: "#ffffff"}}>
                        <p>Can I change the date of my reservation?</p>
                      </div>
                      <div className="chataffy-widget-messageInfo">
                        2m ago・Seen
                      </div>
                    </div>
                  </div>

                  <div className="chataffy-widget-messageArea">
                    <div className="chataffy-widget-messageImage">
                      <Image src={clientLogoImage} alt="" width={40} height={40} />
                    </div>

                    <div className="chataffy-widget-messageBox">
                      <div className="chataffy-widget-message">
                        <p>Yes, you can change the date of your reservation for up to seven days in advance. To do this, first go to “Your Reservations” and click the relevant one. Then, go to “Change Details” and enter a new date. Finally, click “Confirm”. That’s it!</p>
                      </div>
                      <div className="chataffy-widget-messageInfo">
                        03:10 PM
                      </div>
                    </div>
                  </div>


                </div>
              </div>

              <div className="chataffy-widget-textarea">
                <input type="text" placeholder="Type a message..." className="form-control" />
                  <button type="button" className="chataffy-widget-textareaBtn"><Image src={sendIconWidgetImage} alt="" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div></>
  )
}