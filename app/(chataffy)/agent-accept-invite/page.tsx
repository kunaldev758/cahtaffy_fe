"use client"
import { agentAcceptInviteVerify } from "@/app/_api/dashboard/action"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { toast } from "react-toastify"

export default function AgentAcceptInvite() {
    // Add auth check here if needed

    const params = useSearchParams()
    const router=useRouter()

    const token = params?.get('token')
    console.log(token)

    const veriFyToken = async () => {
        try {
            const res = await agentAcceptInviteVerify(token)
            console.log(res)
            if(res.message){
                toast.success(res.message)
                setTimeout(()=>{
                    router.push("/agent-login")
                },2000)
            }
        } catch (error) {
            console.log(error)
        }
    }
    useEffect(() => {
        veriFyToken()


    }, [token])
    return <h1>hello</h1>

}