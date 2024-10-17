
export default function BasicInfoForm(Props: any) {

    return (
        <><div className="main-content-area">
            <div className="basic-infoArea">
                <form action="">
                    <div className="input-box mb-20">
                        <label>Type website address</label>
                        <input type="text" placeholder="Enter your website" value="www.deskmoz.com" className="form-control" />
                    </div>

                    <div className="input-box mb-20">
                        <label>Fallback Message</label>
                        <textarea className="form-control" placeholder="Fallback Message here"></textarea>
                    </div>

                    <div className="input-box mb-20">
                        <label>Email Address</label>
                        <input type="email" placeholder="Enter your email" className="form-control" />
                    </div>

                    <div className="input-box mb-20">
                        <label>Phone Number</label>
                        <input type="text" placeholder="Enter your phone number" className="form-control" />
                    </div>

                    <div>
                        <button className="custom-btn">Save Info</button>
                    </div>
                </form>
            </div>
        </div></>
    )
}