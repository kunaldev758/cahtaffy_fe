'use client'

import { useState, useEffect, useRef, useTransition } from "react"
import io from 'socket.io-client'
import './_components/widgetcss.css'
import Image from "next/image"
import { basePath } from "@/next.config"
import { format } from "date-fns"
const axios = require('axios');

import { getThemeSettings, getIsVisitorExists, saveVisitorDetails } from "@/app/_api/dashboard/action";

let socket: any



export default function Home({ params }: { params: { slug: any } }) {
	const [inputMessage, setInputMessage] = useState('')
	const [conversation, setConversation] = useState<any>([])
	const [aiMessage, setAiMessage] = useState('')
	const [showWidget, setShowWidget] = useState(true)
	const [socketConnection, setSocketConnection] = useState(false)
	const [error, setError] = useState(false)
	const [themeSettings, setThemeSettings] = useState<any>(null)
	const [conversationStatus, setConversationStatus] = useState('open')
	const [conversationId, setConversationId] = useState(null)
	const [formData, setFormData] = useState({});
	const [visitorExists, setVisitorExists] = useState(true)
	const [visitorIp, setVisitorIp] = useState(null);
	const [visitorLocation, setVisitorLocation] = useState(null);
	const [fields, setFields] = useState<any>([]);
	const [feedback, setFeedback] = useState(null);


	const chatBottomRef = useRef<any>(null)
	const visitorMessageRemove = useRef(false)

	const OpenVisitorId = localStorage.getItem('openaiVisitorId');




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

	const getThemeSettingsAPI = async () => {
		const response = await getThemeSettings({ widgetId });
		if (response && response.status_code == 200) {
			console.log(response.data, "theme data");
			setThemeSettings(response.data);
		}
	};

	const handelSaveVisitorDetails = async () => {
		await saveVisitorDetails({ location: visitorLocation, ip: visitorIp, visitorDetails: formData });
		setVisitorExists(true)
	}

	const getIsnewVisitor = async () => {
		const response = await getIsVisitorExists({ visitorId: OpenVisitorId });
		if (response && response.status_code == 200) {
			console.log(response.data, "visitor exist data");
			if (response.exists == true) {
				setVisitorExists(true);

			} else {
				setVisitorExists(false);
				// await handelSaveVisitorDetails();
			}
		}
	}
	const getVisitorIpAndLocation = async () => {
		try {
			const response = await axios.get('https://ipinfo.io/?token=def346c1243a80 ');
			console.log(response.data, "location data");
			setVisitorLocation(response.data.country);
			setVisitorIp(response.data.ip);
		} catch (error: any) {
			console.error('Error fetching IP info:', error.message);
		}
	}

	useEffect(() => {
		getIsnewVisitor();
		getThemeSettingsAPI();
		getVisitorIpAndLocation();
	}, []);

	useEffect(() => {
		// Simulate API response
		// const apiFields = [
		// 	{
		// 		id: 1,
		// 		name: "Name",
		// 		value: "",
		// 		required: true,
		// 		_id: "67347cb4ced37f230f457f95",
		// 	},
		// 	{
		// 		id: 2,
		// 		name: "Email",
		// 		value: "",
		// 		required: true,
		// 		_id: "67347cb4ced37f230f457f96",
		// 	},
		// 	{
		// 		id: 3,
		// 		name: "Phone",
		// 		value: "",
		// 		required: true,
		// 		_id: "67347cb4ced37f230f457f97",
		// 	},
		// ];
		// console.log(themeSettings?.fields,"fields")
		setFields(themeSettings?.fields ?? []);
	}, [themeSettings]);




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
			console.log(data.chatMessages, "data.chatMessages")
			setConversation(data.chatMessages)
			setConversationId(data.conversationId)
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


	const handleCloseConversation = () => {
		socket.emit('close-conversation', {
			conversationId: conversationId,
			status: 'close'
		})
		setConversationStatus('close');
	}

	// const UserForm = () => {

	const handleChange = (fieldName: any, value: any) => {
		setFormData({ ...formData, [fieldName]: value });
	};

	const handleSubmit = (e: any) => {
		e.preventDefault();
		console.log("Form Data Submitted:", formData);
		handelSaveVisitorDetails()
		// Add logic to save data, e.g., send it to a backend server
	};

	const handleFeedback = (type: any, messageId: any) => {
		// Emit the feedback to the server
		socket.emit(
			"message-feedback",
			{ messageId: messageId, feedback: type }, // Send message ID and feedback type
			(response: any) => {
				if (response.success) {
					console.log("Feedback updated successfully:", response.updatedMessage);
					setFeedback(type); // Update local state
				} else {
					console.error("Error updating feedback:", response.error);
				}
			}
		);
	};





	return (<>
		{!error &&
			<div className="chataffy-widget-area">
				<div className="chataffy-widgetBtn-box" onClick={() => (setShowWidget((showWidget) => !showWidget))}>
					<div className="chataffy-widget-btn"><Image src={`${basePath}/images/widget/widget-icon.png`} width={37} height={37} alt="" /></div>
				</div>

				{showWidget &&
					<div className="chataffy-messageFrame">
						<div className="chataffy-widget-head" style={{ "background": themeSettings?.colorFields[0]?.value }}>
							<div className="chataffy-widget-headLeft">
								<div className="chataffy-head-clientLogo"><Image src={`${basePath}/images/widget/client-logo.png`} width={40} height={40} alt="" /></div>
								<div className="chataffy-head-infoArea">
									<div className="chataffy-headName" style={{ "color": themeSettings?.colorFields[1]?.value }}>{themeSettings?.titleBar ? themeSettings?.titleBar : "Chataffy"}</div>
									<div className="chataffy-headStatus" style={{ "color": "#ffffff" }}><span className="chataffy-statusPoint"></span> Online</div>
								</div>
							</div>

							<div className="chataffy-widget-headRight">
								<button type="button" className="chataffy-widget-closeBtn" onClick={() => (setShowWidget((showWidget) => !showWidget))}><Image src={`${basePath}/images/widget/close-btn.svg`} width={20} height={20} alt="" /></button>
							</div>
						</div>

						<div className="chataffy-widget-body">
							<div className="chataffy-widget-chatArea">
								{visitorExists == true ?
									<div>
										{conversation.map((item: any, key: any) => (
											<div key={key}>
												{(item.sender_type == 'system' || item.sender_type == 'bot' || item.sender_type == 'agent') &&
													<div className="chataffy-widget-messageArea" ref={chatBottomRef}>
														<div className="chataffy-widget-messageImage">
															<Image src={`${basePath}/images/widget/client-logo.png`} width={40} height={40} alt="" />
														</div>

														<div className="chataffy-widget-messageBox">
															<div className="chataffy-widget-message" style={{ "background": themeSettings?.colorFields[2]?.value, "color": themeSettings?.colorFields[3]?.value }}>
																<div dangerouslySetInnerHTML={{ __html: item.message }} />
															</div>
															<div>
																<span>
																	<button
																		onClick={() => handleFeedback("like", item._id)}
																		disabled={feedback === "like"}>👍</button>
																</span>
																<span>
																	<button
																		onClick={() => handleFeedback("dislike", item._id)}
																		disabled={feedback === "dislike"}>👎</button>
																</span>
															</div>
															<div style={{ display: 'none' }}>
																{(item.infoSources) &&
																	item.infoSources.map((source: any, sourceKey: any) => (
																		<>{source}<br /></>
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
															<div className="chataffy-widget-message" style={{ "background": themeSettings?.colorFields[4]?.value, "color": themeSettings?.colorFields[5]?.value }}>
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
									</div>
									:
									<div>
										<form onSubmit={handleSubmit}>
											{/* <div style={{ marginBottom: "15px" }}>
											<label htmlFor="name" style={{ display: "block", marginBottom: "5px" }}>
												Name:
											</label>
											<input
												type="text"
												id="name"
												name="name"
												value={formData.name}
												onChange={handleChange}
												style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
												required
											/>
										</div>
										<div style={{ marginBottom: "15px" }}>
											<label htmlFor="email" style={{ display: "block", marginBottom: "5px" }}>
												Email:
											</label>
											<input
												type="email"
												id="email"
												name="email"
												value={formData.email}
												onChange={handleChange}
												style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
												required
											/>
										</div> */}

											{fields.map((field: any) => (
												<div key={field._id} style={{ marginBottom: "15px" }}>
													<label htmlFor={field._id} style={{ display: "block", marginBottom: "5px" }}>
														{field.name}:
													</label>
													<input
														type={field.name.toLowerCase() === "email" ? "email" : "text"}
														id={field._id}
														name={field.name}
														value={field.value}
														onChange={(e) => handleChange(field.name, e.target.value)}
														required={field.required}
														style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
													/>
												</div>
											))}

											<button
												type="submit"
												style={{
													backgroundColor: "#4CAF50",
													color: "white",
													padding: "10px 20px",
													border: "none",
													borderRadius: "4px",
													cursor: "pointer",
												}}
											>
												Save
											</button>
										</form>
									</div>
								}

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
							{conversationStatus === 'close' ? <div></div> :
								socketConnection ?
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
										<button onClick={handleCloseConversation}>Close Conversation</button>
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