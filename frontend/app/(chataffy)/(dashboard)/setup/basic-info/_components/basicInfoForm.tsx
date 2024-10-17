'use client';

import { useEffect, useState } from "react";
import { getBasicInfoApi, setBasicInfoApi } from "@/app/_api/dashboard/action";
import { toast } from 'react-toastify';


export default function BasicInfoForm(Props: any) {
    const [basicInfo, setBasicInfo] = useState({
        website: '',
        organisation: '',
        fallbackMessage: '',
        email: '',
        phone: ''
    });
    const fetchBasicInfo = async()=>{
        const response = await getBasicInfoApi(basicInfo);
        if (response && response.status_code == 200) {
            setBasicInfo(response.data);
        }
    };

    useEffect(()=>{
        fetchBasicInfo();
    },[]);

    // Handle form submission
    const handleSubmit = async (e:any) => {
        e.preventDefault();
        try {
            const response = await setBasicInfoApi(basicInfo);
            if (!response || response.status_code != 200) {
                throw new Error('Failed to update data');
            }
            toast.success(response.message);
            // alert('Information updated successfully');
        } catch (error) {
            toast.error("Error");
            // alert(error.message);
        }
    };

    // Handle input change
    const handleChange = (e:any) => {
        const { name, value } = e.target;
        setBasicInfo({
        ...basicInfo,
        [name]: value,
        });
    };
    return (
        <><div className="main-content-area">
            <div className="basic-infoArea">
                <form onSubmit={handleSubmit} action="">
                    <div className="input-box mb-20">
                        <label>Type website address</label>
                        <input type="text" name="website" placeholder="Enter your website" value={basicInfo.website} onChange={handleChange} className="form-control" />
                    </div>
                    
                    <div className="input-box mb-20">
                        <label>Organisation Name</label>
                        <input type="text" name="organisation" placeholder="Enter your website" value={basicInfo.organisation} onChange={handleChange} className="form-control" />
                    </div>

                    <div className="input-box mb-20">
                        <label>Fallback Message</label>
                        <textarea name="fallbackMessage" className="form-control" placeholder="Fallback Message here" value={basicInfo.fallbackMessage} onChange={handleChange}></textarea>
                    </div>

                    <div className="input-box mb-20">
                        <label>Email Address</label>
                        <input type="email" name="email" placeholder="Enter your email" value={basicInfo.email} onChange={handleChange} className="form-control" />
                    </div>

                    <div className="input-box mb-20">
                        <label>Phone Number</label>
                        <input type="text" name="phone" placeholder="Enter your phone number" value={basicInfo.phone} onChange={handleChange} className="form-control" />
                    </div>

                    <div>
                        <button className="custom-btn">Save Info</button>
                    </div>
                </form>
            </div>
        </div></>
    )
}