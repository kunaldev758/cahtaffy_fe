"use client"

import { agentAcceptInviteVerify } from "@/app/_api/dashboard/action"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "react-toastify"

type InviteStatus = "verifying" | "success" | "error"

export default function AgentAcceptInviteContent() {
    const params = useSearchParams()
    const router = useRouter()
    const [status, setStatus] = useState<InviteStatus>("verifying")
    const [message, setMessage] = useState("Accepting your invitation…")

    const token = params?.get("token")

    useEffect(() => {
        if (!token) {
            setStatus("error")
            setMessage("Invalid or missing invitation link.")
            toast.error("Invalid or missing invitation link")
            return
        }

        let cancelled = false

        const verifyToken = async () => {
            try {
                const res = await agentAcceptInviteVerify(token)
                if (cancelled) return;

                console.log("Verification response:", res)

                if (res.status_code !== 200) {
                    setStatus("error")
                    const errorMessage =
                        typeof res === "object" && res?.message
                            ? res.message
                            : "Invitation could not be accepted."
                    setMessage(errorMessage);
                    toast.error(errorMessage);
                    // return
                }else{

                    setStatus("success")
                    setMessage(res.message)
                    toast.success(res.message)

                }

                setTimeout(() => {
                    router.push("/agent-login")
                }, 2000)
            } catch {
                if (cancelled) return
                setStatus("error")
                setMessage("Something went wrong. Please try again.")
                toast.error("Something went wrong. Please try again.")
            }
        }

        verifyToken()
        return () => {
            cancelled = true
        }
    }, [token, router])

    const title =
        status === "success"
            ? "You're all set!"
            : status === "error"
              ? "Invitation failed"
              : "Accepting invitation"

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                <div className="bg-white py-10 px-8 shadow-xl rounded-2xl text-center">
                    <div
                        className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-6 ${
                            status === "success"
                                ? "bg-green-100"
                                : status === "error"
                                  ? "bg-red-100"
                                  : "bg-indigo-100"
                        }`}
                    >
                        {status === "verifying" && (
                            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                        )}
                        {status === "success" && (
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        )}
                        {status === "error" && (
                            <XCircle className="h-8 w-8 text-red-600" />
                        )}
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>

                    {status === "error" ? (
                        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-left">
                            <p className="text-sm font-semibold text-red-800 mb-1">
                                Something went wrong
                            </p>
                            <p className="text-sm text-red-700 leading-relaxed">{message}</p>
                            <p className="mt-3 text-xs text-red-600/80">
                                The link may be expired or invalid. Ask your team admin to send a new invitation.
                            </p>
                        </div>
                    ) : (
                        <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
                    )}

                    {status === "success" && (
                        <p className="mt-4 text-sm text-indigo-600 font-medium">
                            Redirecting to login…
                        </p>
                    )}

                    {status === "verifying" && (
                        <div className="flex justify-center gap-1.5 mt-6">
                            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" />
                            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
                            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
                        </div>
                    )}

                </div>

                <p className="text-center text-xs text-gray-500 mt-6">Chataffy · Agent portal</p>
            </div>
        </div>
    )
}
