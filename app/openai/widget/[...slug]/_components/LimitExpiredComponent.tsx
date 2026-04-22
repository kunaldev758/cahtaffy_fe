import { leaveAMessage } from "@/app/_api/dashboard/action";
import { useEffect, useState } from "react";
import { FormField, validateField } from "./FormField";

const fields = [
    {
        id: 1,
        value: 'Your name',
        type: 'text',
        placeholder: 'Enter your name',
        required: true,
        validation: {
            minLength: 2,
            maxLength: 100,
        }
    },
    {
        id: 2,
        value: 'E-mail',
        type: 'email',
        placeholder: 'Enter your email',
        required: true,
        validation: {
            pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
        }
    },
    {
        id: 3,
        value: 'Subject',
        type: 'text',
        placeholder: 'Enter subject',
        required: true,
        validation: {
            minLength: 3,
            maxLength: 200,
        }
    },
    {
        id: 4,
        value: 'Message',
        type: 'textarea',
        placeholder: 'Enter your message',
        required: true,
        validation: {
            minLength: 10,
            maxLength: 5000,
        }
    }
];
export default function LimitExpiredComponent({userId, visitorId} : {userId: string | null; visitorId: string | null}) {

    const [formData, setFormData] = useState<any>({});
    const [formErrors, setFormErrors] = useState<any>({});
    const [isSubmittingForm, setIsSubmittingForm] = useState(false);
    const [isLeaveMessageClick, setIsLeaveMessageClick] = useState(false);
    const [messageSent, setMessageSent] = useState(false);

    // Check localStorage for messageSent status on mount
    useEffect(() => {
        if (typeof window !== 'undefined' && visitorId) {
            const messageSentKey = `messageSent_${visitorId}`;
            const savedMessageSent = sessionStorage.getItem(messageSentKey);
            console.log('visitorId',visitorId, 'savedMessageSent', savedMessageSent, savedMessageSent === 'true');
            if (savedMessageSent === 'true') {
                setMessageSent(true);
            }
        }
    }, [visitorId]);

    useEffect(() => {
        const initialFormData: any = {};
        fields?.forEach((field: any) => {
            initialFormData[field.value] = '';
        });
        setFormData(initialFormData);
    }, []);

    const validateForm = () => {
        const errors: any = {};
        let isValid = true;

        fields?.forEach((field: any) => {
            const fieldErrors = validateField(field, formData[field.value]);
            if (fieldErrors.length > 0) {
                errors[field.value] = fieldErrors[0];
                isValid = false;
            }
        });

        setFormErrors(errors);
        return isValid;
    };

    const handleFormFieldChange = (fieldName: string, value: any) => {
        setFormData((prev: any) => ({
            ...prev,
            [fieldName]: value
        }));

        if (formErrors[fieldName]) {
            setFormErrors((prev: any) => ({ ...prev, [fieldName]: '' }));
        }
    };

    const handleSendMessage = async () => {
        try {
            if (!validateForm()) {
                return;
            }

            setIsSubmittingForm(true);

            const response = await leaveAMessage({
                userId,
                name: formData['Your name'],
                email: formData['E-mail'],
                subject: formData['Subject'],
                message: formData['Message']
            });

            if (response.status_code === 200) {
                setFormData({});
                setMessageSent(true);
                
                // Persist messageSent to sessionStorage with visitorId key
                if (typeof window !== 'undefined' && visitorId) {
                    const messageSentKey = `messageSent_${visitorId}`;
                    sessionStorage.setItem(messageSentKey, 'true');
                }
            }
        } catch (error) {
            console.error('Error sending leave message:', error);
        } finally {
            setIsSubmittingForm(false);
        }
    }
    
    if(messageSent){
        return (
            <div className="flex-1 p-[20px] min-h-0 overflow-y-auto bg-white custom-scrollbar">
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl h-[100%] justify-center p-[16px] flex flex-col gap-[20px]">
                    <div className="flex flex-col gap-[8px] w-4/5 mx-auto justify-center text-center">
                        <h3 className="text-[12px] text-red-500">We are currently unavailable.</h3>
                        <h3 className="text-[#111827] mb-2 font-bold text-[20px]">
                            Your message has been sent successfully!
                        </h3>
                        <p className="text-[#64748B] text-[13px] font-normal">
                            We'll get back to you as soon as possible.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if(!isLeaveMessageClick){
        return <LeaveMessage onChange={setIsLeaveMessageClick} />
    }


    return (
        <div className="flex-1 p-[20px] min-h-0 overflow-y-auto bg-white custom-scrollbar">
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-[16px] flex flex-col gap-[20px]">
            <div className="flex flex-col gap-[8px] w-4/5 mx-auto justify-center text-center">
                <h3 className="text-[20px] font-bold text-[#111827] mb-2">
                    Our agents are not available right now.
                </h3>
                <p className="text-[#64748B] text-[13px] font-normal">
                    Please leave a message and we'll get back to you.
                </p>
            </div>

            {fields?.map((field: any) => (
                <FormField
                    key={field.id ?? field._id}
                    field={field}
                    value={formData[field.value] || ''}
                    onChange={(value: any) => handleFormFieldChange(field.value, value)}
                    error={formErrors[field.value]}
                />
            ))}

            <button
                type="button"
                onClick={handleSendMessage}
                disabled={isSubmittingForm}
                className="inline-flex h-[44px] w-full items-center justify-center gap-[8px] rounded-[12px] bg-[#0F172A] px-[20px] text-[13px] font-semibold text-white transition-colors hover:bg-[#111827]"
            >
                {isSubmittingForm ? (
                    <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Sending message...</span>
                    </div>
                ) : (
                    'Leave a message'
                )}
            </button>
        </div>
        </div>
    )
}

function LeaveMessage({onChange}: any) {
    return (
        <div className="flex flex-col items-center justify-center min-h-full p-[20px] gap-[20px]">
            {/* Icon */}
            <div className="flex items-center justify-center w-[60px] h-[60px] bg-[#0F62FE] rounded-full">
                <svg
                    className="w-[32px] h-[32px] text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
            </div>

            {/* Main Content */}
            <div className="flex flex-col gap-[12px] text-center max-w-xs">
                <h2 className="text-[28px] font-bold text-[#111827]">
                    Welcome!
                </h2>
                <p className="text-[18px] font-semibold text-[#111827]">
                    Text us
                </p>
            </div>

            {/* Message Box */}
            <div className="flex items-start gap-[12px] bg-[#FEF3C7] rounded-lg p-[12px] max-w-sm">
                <span className="material-symbols-outlined" style={{ color: 'black' }}>
                    pace
                </span>
                <p className="text-[13px] text-[#6B5B2D] font-normal">
                    We're away at the moment. Leave a message, and we'll reply by email.
                </p>
            </div>

            {/* Button */}
            <button
                onClick={() => onChange(true)}
                className="w-full h-[44px] bg-[#0F62FE] text-white font-semibold text-[13px] rounded-lg hover:bg-[#0353E9] transition-colors flex items-center justify-center gap-[8px]"
            >
                <span>Leave a message</span>
                <svg
                    className="w-[16px] h-[16px]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
            </button>

            {/* Navigation Tabs */}
            <div className="flex gap-0 mt-auto w-full max-w-xs border-t border-[#E5E7EB]">
                <div className="flex-1 flex flex-col items-center justify-center py-[12px] border-b-2 border-[#0F62FE] text-[#0F62FE]">
                    <svg className="w-[20px] h-[20px] mb-1" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                    </svg>
                    <span className="text-[11px] font-medium">Home</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center py-[12px] text-[#9CA3AF]">
                    <svg className="w-[20px] h-[20px] mb-1" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span className="text-[11px] font-medium">Chat</span>
                </div>
            </div>
        </div>
    )
}
