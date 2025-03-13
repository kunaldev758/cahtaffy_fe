
'use client'

import Accordion from 'react-bootstrap/Accordion';
import { useEffect, useState, useReducer } from 'react'
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
import { updateThemeSettings ,getThemeSettings ,uploadLogo } from '@/app/_api/dashboard/action';



const initialState = {
  logo: null,
  titleBar: "",
  welcomeMessage: "👋 Hi there! How can I help?",
  showLogo: true,
  isPreChatFormEnabled: true,
  fields: [
    { id: 1, name: 'Name', value: '', required: true },
    { id: 2, name: 'Email', value: '', required: true },
    { id: 3, name: 'Phone', value: '', required: true },
  ],
  colorFields: [
    { id: 1, name: 'title_bar', value: '#FFFFFF' },
    { id: 2, name: 'title_bar_text', value: '#FFFFFF' },
    { id: 3, name: 'visitor_bubble', value: '#FFFFFF' },
    { id: 4, name: 'visitor_bubble_text', value: '#FFFFFF' },
    { id: 5, name: 'ai_bubble', value: '#FFFFFF' },
    { id: 6, name: 'ai_bubble_text', value: '#FFFFFF' },
  ]
};

const actionTypes = {
  UPDATE_FIELD_VALUE: 'UPDATE_FIELD_VALUE',
  TOGGLE_REQUIRED: 'TOGGLE_REQUIRED',
  REMOVE_FIELD: 'REMOVE_FIELD',
  ADD_FIELD: 'ADD_FIELD',
  TOGGLE_PRE_CHAT_FORM: 'TOGGLE_PRE_CHAT_FORM',
  TITLE_BAR_COLOR: 'TITLE_BAR_COLOR',
  TITLE_BAR_TEXT_COLOR: 'TITLE_BAR_TEXT_COLOR',
  VISITOR_BUBBLE_COLOR: 'VISITOR_BUBBLE_COLOR',
  VISITOR_BUBBLE_TEXT_COLOR: 'VISITOR_BUBBLE_TEXT_COLOR',
  AI_BUBBLE_COLOR: 'AI_BUBBLE_COLOR',
  AI_BUBBLE_TEXT_COLOR: 'AI_BUBBLE_TEXT_COLOR',
  SHOW_LOGO: "SHOW_LOGO",
  SHOW_WHITE_LABEL: "SHOW_WHITE_LABEL",
  SET_THEME_DATA: 'SET_THEME_DATA',

};



const reducer = (state:any, action:any) => {
  switch (action.type) {
    case actionTypes.SET_THEME_DATA:
      return { 
        ...state, 
        ...action.payload, 
        // Fallback to existing values for missing fields
        fields: action.payload.fields.length ? action.payload.fields : state.fields,
        colorFields: action.payload.colorFields.length ? action.payload.colorFields : state.colorFields,
        logo: action.payload.logo ?? state.logo,
        titleBar: action.payload.titleBar.length ? action.payload.titleBar : state.titleBar,
        welcomeMessage: action.payload.welcomeMessage.length ? action.payload.welcomeMessage : state.welcomeMessage,
        showLogo: action.payload.showLogo ?? state.showLogo,
        isPreChatFormEnabled: action.payload.isPreChatFormEnabled ?? state.isPreChatFormEnabled,
      };
    case "SET_LOGO":
      return { ...state, logo: action.payload };
    case "SET_TITLE_BAR":
      return { ...state, titleBar: action.payload };
    case "SET_WELCOME_MESSAGE":
      return { ...state, welcomeMessage: action.payload };

    case actionTypes.TOGGLE_PRE_CHAT_FORM:
      return {
        ...state,
        isPreChatFormEnabled: !state.isPreChatFormEnabled
      };
    case "COLOR_CHANGE":
      return {
        ...state,
        chatColorSetting: {
          ...state.chatColorSetting,
        },
      };

    case actionTypes.UPDATE_FIELD_VALUE:
      return {
        ...state,
        fields: state.fields.map((field: any) =>
          field.id === action.payload.id
            ? { ...field, value: action.payload.value }
            : field
        )
      };
    case actionTypes.TOGGLE_REQUIRED:
      return {
        ...state,
        fields: state.fields.map((field: any) =>
          field.id === action.payload.id
            ? { ...field, required: !field.required }
            : field
        )
      };
    case actionTypes.REMOVE_FIELD:
      return {
        ...state,
        fields: state.fields.filter((field: any) => field.id !== action.payload.id)
      };
    case actionTypes.ADD_FIELD:
      return {
        ...state,
        fields: [
          ...state.fields,
          { id: state.fields.length + 1, name: `Field ${state.fields.length + 1}`, value: '', required: false }
        ]
      };
    case actionTypes.TITLE_BAR_COLOR:
      return {
        ...state,
        colorFields: state?.colorFields?.map((colorField: any) =>
          colorField.id === action.payload.id
            ? { ...colorField, value: action.payload.value }
            : colorField
        )
      };

    case actionTypes.SHOW_LOGO:
      return {
        ...state,
        showLogo: !state.showLogo
      }

    case actionTypes.SHOW_WHITE_LABEL:
      return {
        ...state,
        showWhiteLabel: !state.showWhiteLabel
      }

    default:
      return state;
  }
};


export default function Widget() {
  const [userId,setUserId] = useState<string | null>(null);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [selectedLogo,setSelectedLogo] = useState(clientLogoImage)
  const [error, setError] = useState<string | null>(null); // For validation errors
  const [themeData,setThemeData] = useState(null);

  const handleLogoChange = async (e: any) => {
    const logo = e.target.files?.[0];
    if (!logo) return;
    const formData = new FormData();
    formData.append("logo", logo);
    try {
      await uploadLogo(formData); // Upload the logo to the backend
      const previewUrl = URL.createObjectURL(logo); // Generate a preview URL
      setSelectedLogo(previewUrl as any); // Update the state for preview
      dispatch({ type: "SET_LOGO", payload: previewUrl });
    } catch (error) {
      setError("Failed to upload logo. Please try again.");
    }
  };

  const handleImageClick = () => {
    document.getElementById("logoUploadInput")!.click(); // Trigger file input click
  };

  const handleTitleBarChange = (e: any) => {
    dispatch({ type: "SET_TITLE_BAR", payload: e.target.value })
  };

  const handleWelcomeBarChange = (e: any) => {
    dispatch({ type: "SET_WELCOME_MESSAGE", payload: e.target.value })
  };

  const handleInputChange = (id:any, value:any) => {
    dispatch({
      type: actionTypes.UPDATE_FIELD_VALUE,
      payload: { id, value }
    });
  };

  const handleToggleRequired = (id:any) => {
    dispatch({
      type: actionTypes.TOGGLE_REQUIRED,
      payload: { id }
    });
  };

  const handleRemoveField = (id:any) => {
    dispatch({
      type: actionTypes.REMOVE_FIELD,
      payload: { id }
    });
  };

  const handleAddField = () => {
    dispatch({ type: actionTypes.ADD_FIELD });
  };

  const handleTogglePreChatForm = () => {
    dispatch({ type: actionTypes.TOGGLE_PRE_CHAT_FORM });
  };

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>, id: any) => {
    let value = event.target.value;
    dispatch({
      type: actionTypes.TITLE_BAR_COLOR,
      payload: { id, value }
    })
  };

  const handleToggleShowLogo = () => {
    dispatch({
      type: actionTypes.SHOW_LOGO,
    })
  }

  const handleTogglewhiteLabel = () => {
    dispatch({
      type: actionTypes.SHOW_WHITE_LABEL,
    })
  }


  const handelWidgetSettings = async () => {
    const themeSettings = {
      logo: state.logo,
      titleBar: state.titleBar,
      welcomeMessage: state.welcomeMessage,
      showLogo: state.showLogo,
      isPreChatFormEnabled: state.isPreChatFormEnabled,
      fields: state.fields,
      colorFields: state.colorFields,
    };
  
    try {
      await updateThemeSettings({themeSettings,userId});
      // You could add more code here to handle a successful update if needed
    } catch (error) {
      setError("Failed to update theme settings.");
    }
  };

  useEffect(() => {
    // Ensure this code runs only on the client side
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('userId');
      setUserId(storedUserId);
    }
  }, []);

  useEffect(()=>{
    async function fetchData(){
     const data =  await getThemeSettings({userId});
     console.log(data,"theme data")
     if (data) {
      dispatch({ type: actionTypes.SET_THEME_DATA, payload: data.data });
    }
     setThemeData(data);
    }
    fetchData()
  },[])

  useEffect(() => {
    if (state.logo) {
      //if state.logo has 'blob' in it, it means it is a local file
      if (state.logo.includes('blob')) {
        setSelectedLogo(state.logo)
      } else {
        setSelectedLogo(`${process.env.NEXT_PUBLIC_FILE_HOST}${state.logo}` as any)
      }
    }
  }, [state.logo])


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
                        {state.logo ?
                          <Image src={selectedLogo} alt="Logo" onClick={handleImageClick} width={100} height={100}
                            style={{ cursor: 'pointer' }} />
                          :
                          <Image src={logoUploadImage} alt="" onClick={handleImageClick}
                            style={{ cursor: 'pointer' }} />
                        }
                        <input
                          type="file"
                          id="logoUploadInput"
                          style={{ display: "none" }}
                          accept="image/*"
                          onChange={handleLogoChange}
                        />
                      </div>
                      <p className="mb-20"><strong>Note:</strong> Please upload jpg, png, or gif file that is no larger than 1500x1000 pixels.</p>

                      <div className="input-box mb-20">
                        <label>Title Bar Text</label>
                        <input type="text" placeholder="Enter a title" className="form-control" value={state.titleBar} onChange={handleTitleBarChange} />
                      </div>

                      <div className="input-box mb-20">
                        <label>Welcome Message</label>
                        <textarea className="form-control" placeholder="Welcome Message here" value={state.welcomeMessage} onChange={handleWelcomeBarChange}></textarea>
                      </div>

                      <div className="widget-colorPicker flex-wrap d-flex gap-20">

                        {state.colorFields.map((field:any) => (
                          <div className="color-pickerBox">
                            <label className="form-label">{field.name}</label>
                            <div className="border rounded-3 d-flex align-items-center justify-content-between">
                              <span className="colorCode">{field.value}</span>
                              <div className="pick-colorBox">
                                <input
                                  type="color"
                                  value={field.value} // Set the current selected color
                                  onChange={(event) => handleColorChange(event, field.id)} // Handle color change
                                />
                              </div>
                            </div>
                          </div>
                        ))}
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
                      {/* <input className="toggle-checkbox" type="checkbox" defaultChecked />
                       */}
                      <input
                        className="toggle-checkbox"
                        type="checkbox"
                        checked={state.isPreChatFormEnabled}
                        onChange={handleTogglePreChatForm}  // Toggles the pre-chat form enabled state
                      />
                      <div className="toggle-switch"></div>
                    </label>
                  </Accordion.Header>
                  <Accordion.Body className="accordion-body">
                    {state.isPreChatFormEnabled && (
                      <div className="setting-accordionArea">
                        <div className="pre-chatArea">
                          {state?.fields?.map((field:any, index:any) => (
                            <div className="preChat-box mb-20">
                              <div className="preChat-head d-flex justify-content-end">
                                <div className="d-flex align-item-center gap-2">
                                  <div className="form-check">
                                    <input className="form-check-input"
                                      type="checkbox"
                                      checked={field.required}
                                      onChange={() => handleToggleRequired(field.id)}
                                      id={`flexCheckDefault${index}`}
                                    />
                                  </div>
                                  <label htmlFor={`flexCheckDefault${index}`}>Required</label>


                                  <button
                                    type="button"
                                    className="btn-close ml-10"
                                    onClick={() => handleRemoveField(field.id)}
                                  ></button>

                                </div>
                              </div>
                              <div className="input-box mt-3">
                                <input
                                  type={field.name === 'Email' ? 'email' : 'text'}
                                  placeholder={field.name}
                                  className="form-control"
                                  value={field.value}
                                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div>
                          <button className="custom-btn d-flex gap-2 align-item-center" onClick={handleAddField}><Image src={tagPlusImage} alt="" /> Add Element</button>
                        </div>
                      </div>
                    )}
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
                            <input
                              className="toggle-checkbox"
                              type="checkbox"
                              checked={state.showLogo}
                              onChange={() => handleToggleShowLogo()}
                            />
                            <div className="toggle-switch"></div>
                          </label>
                        </div>

                        <div className="additional-tweakBox d-flex align-item-center position-relative">
                          <h4 className="mb-0">White label widget</h4>
                          <label className="toggle">
                            <input
                              className="toggle-checkbox"
                              type="checkbox"
                              checked={state.showWhiteLabel}
                              onChange={() => handleTogglewhiteLabel()}
                            />
                            <div className="toggle-switch"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </div>

            <div>
              <button onClick={handelWidgetSettings}>save</button>
            </div>


          </div>
        </div>

        <div className="widget-previewSection">
          <div className="inbox-heading d-flex justify-content-between align-item-center">
            <div className="top-headbar-heading">Preview</div>
          </div>

          <div className="chataffy-widget-area">
            <div className="chataffy-widgetBtn-box" style={{ right: "40px" }}>
              <div className="chataffy-widget-btn"><Image src={widgetIconImage} alt="" width={37} height={37} /></div>
            </div>

            <div className="chataffy-messageFrame">
              <div className="chataffy-widget-head" style={{ background: state?.colorFields[0]?.value }}>
                <div className="chataffy-widget-headLeft">
                  <div className="chataffy-head-clientLogo">
                    {state.showLogo && <Image src={selectedLogo} alt="" width={40} height={40} />}
                  </div>
                  <div className="chataffy-head-infoArea">
                    <div className="chataffy-headName" style={{ color: state?.colorFields[1]?.value }}>{state.titleBar} </div>
                    <div className="chataffy-headStatus" style={{ color: "#ffffff" }}><span className="chataffy-statusPoint"></span> Online</div>
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
                      <Image src={selectedLogo} alt="" width={40} height={40} />
                    </div>

                    <div className="chataffy-widget-messageBox">
                      <div className="chataffy-widget-message" style={{ background: state?.colorFields[4]?.value, color: state?.colorFields[5]?.value }}>
                        <p>{state.welcomeMessage}</p>
                      </div>
                      <div className="chataffy-widget-messageInfo">
                        03:10 PM
                      </div>
                    </div>
                  </div>

                  <div className="chataffy-widget-messageClient">
                    <div className="chataffy-widget-messageBox">
                      <div className="chataffy-widget-message" style={{ background: state?.colorFields[2]?.value, color: state?.colorFields[3]?.value }}>
                        <p>Can I change the date of my reservation?</p>
                      </div>
                      <div className="chataffy-widget-messageInfo">
                        2m ago・Seen
                      </div>
                    </div>
                  </div>

                  <div className="chataffy-widget-messageArea">
                    <div className="chataffy-widget-messageImage">
                      <Image src={selectedLogo} alt="" width={40} height={40} />
                    </div>

                    <div className="chataffy-widget-messageBox">
                      <div className="chataffy-widget-message" style={{ background: state?.colorFields[4]?.value, color: state?.colorFields[5]?.value }}>
                        <p>Yes, you can change the date of your reservation for up to seven days in advance. To do this, first go to “Your Reservations” and click the relevant one. Then, go to “Change Details” and enter a new date. Finally, click “Confirm”. That’s it!</p>
                      </div>
                      <div className="chataffy-widget-messageInfo">
                        03:10 PM
                      </div>
                    </div>
                  </div>


                </div>
              </div>

              <div className="chataffy-widget-textarea" style={{ border: '2px' }}>
                <input type="text" placeholder="Type a message..." className="form-control" />
                <button type="button" className="chataffy-widget-textareaBtn"><Image src={sendIconWidgetImage} alt="" /></button>
              </div>

            </div>
            {state.showWhiteLabel && <div style={{ backgroundColor: "green", fontSize: 20, padding: 10, marginBottom: 10, }}>hello</div>}
          </div>
        </div>
      </div>


    </div ></>
  )
}