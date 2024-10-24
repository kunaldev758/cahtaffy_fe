'use client'

import { useState, useEffect, useRef, useTransition } from "react"
import io from 'socket.io-client'
import './_components/widgetcss.css'
import Image from "next/image"
import { basePath } from "@/next.config"
import { format } from "date-fns"

import { getThemeSettings } from "@/app/_api/dashboard/action";

let socket: any



export default function Home({ params }: { params: { slug: any } }) {
	const [inputMessage, setInputMessage] = useState('')
	const [conversation, setConversation] = useState<any>([])
	const [aiMessage, setAiMessage] = useState('')
	const [showWidget, setShowWidget] = useState(true)
	const [socketConnection, setSocketConnection] = useState(false)
	const [error, setError] = useState(false)
	const [themeSettings,setThemeSettings] = useState<any>(null)

	const chatBottomRef = useRef<any>(null)
	const visitorMessageRemove = useRef(false)




	const widgetId = params.slug[0]
	const widgetToken = params.slug[1]


	const handleMessageSend = () => {
		if (inputMessage.trim() != '') {
			const id = Date.now()
			visitorMessageRemove.current = true
			socket.emit('visitor-send-message', { message: inputMessage, id: id });
		}
		setInputMessage('')

	}

	const getThemeSettingsAPI = async()=>{
        const response = await getThemeSettings();
        if (response && response.status_code == 200) {
            setThemeSettings(response.data);
        }
    };

	useEffect(()=>{
        getThemeSettingsAPI();
    },[]);




	useEffect(() => {
		socket = io(`${process.env.NEXT_PUBLIC_SOCKET_HOST || ""}`, {
			path: `${process.env.NEXT_PUBLIC_SOCKET_PATH || ""}/socket.io`,
			query: {
				widgetId: widgetId,
				widgetAuthToken: widgetToken,
				visitorId: localStorage.getItem('openaiVisitorId'),
				embedType: 'openai'
			},
		})
		return () => {
			socket.disconnect()
		}
	}, [])


	useEffect(() => {
		socket.emit('visitor-connect')


		socket.on('error-handler', async function (data: any) {
			setError(true)
		})


		socket.on('visitor-connect-response', (data: any) => {
			setSocketConnection(true)
			setConversation(data.chatMessages)
			localStorage.setItem('openaiVisitorId', data.visitorId)
		})



		socket.on('intermediate-response', ({ message }: any) => {
			setAiMessage(message)
		})

		socket.on('conversation-append-message', (data: any) => {
			setConversation((conversation: any) => [...conversation, data.chatMessage])
		})


		socket.on('disconnect', function (data: any) {
			setSocketConnection(false)
		})

		socket.on('connect', function (data: any) {
			setSocketConnection(true)
		})

	}, [])


	useEffect(() => {
		if (conversation.length > 0 && chatBottomRef.current)
			chatBottomRef.current.scrollIntoView({ behavior: 'instant' });
	}, [conversation, showWidget, aiMessage])









	return (<>
		{!error &&
			<div className="chataffy-widget-area">
				<div className="chataffy-widgetBtn-box" onClick={() => (setShowWidget((showWidget) => !showWidget))}>
					<div className="chataffy-widget-btn"><Image src={`${basePath}/images/widget/widget-icon.png`} width={37} height={37} alt="" /></div>
				</div>

				{showWidget &&
					<div className="chataffy-messageFrame">
						<div className="chataffy-widget-head" style={{ "background": "#222222" }}>
							<div className="chataffy-widget-headLeft">
								<div className="chataffy-head-clientLogo"><Image src={`${basePath}/images/widget/client-logo.png`} width={40} height={40} alt="" /></div>
								<div className="chataffy-head-infoArea">
									<div className="chataffy-headName" style={{ "color": "#ffffff" }}>{themeSettings?.titleBar?themeSettings?.titleBar:"Chataffy"}</div>
									<div className="chataffy-headStatus" style={{ "color": "#ffffff" }}><span className="chataffy-statusPoint"></span> Online</div>
								</div>
							</div>

							<div className="chataffy-widget-headRight">
								<button type="button" className="chataffy-widget-closeBtn" onClick={() => (setShowWidget((showWidget) => !showWidget))}><Image src={`${basePath}/images/widget/close-btn.svg`} width={20} height={20} alt="" /></button>
							</div>
						</div>

						<div className="chataffy-widget-body">
							<div className="chataffy-widget-chatArea">
								{conversation.map((item: any, key: any) => (
									<div key={key}>
										{(item.sender_type == 'system' || item.sender_type == 'bot' || item.sender_type == 'agent') &&
											<div className="chataffy-widget-messageArea" ref={chatBottomRef}>
												<div className="chataffy-widget-messageImage">
													<Image src={`${basePath}/images/widget/client-logo.png`} width={40} height={40} alt="" />
												</div>

												<div className="chataffy-widget-messageBox">
													<div className="chataffy-widget-message">
														<div dangerouslySetInnerHTML={{ __html: item.message }} />
													</div>
													<div style={{ display: 'none' }}>
  													{(item.infoSources) && 
														item.infoSources.map((source: any, sourceKey: any) => (
															<>{source}<br/></>
														)) 
													}
													</div>
													<div className="chataffy-widget-messageInfo">
														{format(item.createdAt, 'hh:mm:ss a')}
													</div>
												</div>
											</div>}

										{item.sender_type == 'visitor' &&
											<div className="chataffy-widget-messageClient" ref={chatBottomRef}>
												<div className="chataffy-widget-messageBox">
													<div className="chataffy-widget-message" style={{ "background": "#222222", "color": "#ffffff" }}>
														<div dangerouslySetInnerHTML={{ __html: item.message }} />
													</div>
													{item.createdAt ?
														<div className="chataffy-widget-messageInfo">
															{format(item.createdAt, 'hh:mm:ss a')}
														</div>
														:
														<div className="chataffy-widget-messageInfo">
															Sending...
														</div>
													}
												</div>
											</div>}
									</div>
								))}


								{aiMessage &&
									<div className="chataffy-widget-messageArea" ref={chatBottomRef}>
										<div className="chataffy-widget-messageImage">
											<Image src={`${basePath}/images/widget/client-logo.png`} width={40} height={40} alt="" />
										</div>
										{aiMessage}
									</div>}
							</div>
						</div>


						<div className="chataffy-widget-textarea">
							{socketConnection ?
								<>
									<input type="text" disabled={aiMessage ? true : false} placeholder="Type a message..." className="form-control" value={inputMessage}
										onChange={(event) => {
											setInputMessage(event.target.value)
										}}
										onKeyDown={(event) => {
											if (event.key === 'Enter') {
												handleMessageSend()

											}
										}} />
									<button type="button" className="chataffy-widget-textareaBtn" onClick={handleMessageSend}><Image src={`${basePath}/images/widget/send-icon.svg`} width={18} height={18} alt="" /></button>

								</> :
								<div className="chataffy-widget-internetIssue">
									<div className="chataffy-widget-internetLeft">
										Internet issue
									</div>
									<div className="chataffy-widget-internetLeft">
										Reconnect
									</div>
								</div>}
						</div>

					</div>
				}
			</div>
		}




	</>
	)
}