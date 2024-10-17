
export default function TopBar(Props: any) {

  return (
    <><div className="top-headbar">
      <div className="top-headbar-heading">{Props.heading}</div>
      <div className="top-headbar-right flex gap20">
        {Props.showCredits && 
        <><div className="top-headbar-credit">
          <div className="headbar-credit-area flex justify-content-space-between">
            <div className="credit-text">Free Credit</div>
            {/* <div className="credit-count">{credit.used}/{credit.total}</div> */}
          </div>
          <div className="headbar-credit-progress">
            {/* <div className="credit-progressInner" style={{ "width": `${(Number(credit.used) / Number(credit.total)) * 100}%` }}></div> */}
          </div>
        </div></> 
        }
        {Props.showAddContent &&
        <><button className="custom-btn">Add Content</button></>
        }
      </div>
    </div></>
  )
}