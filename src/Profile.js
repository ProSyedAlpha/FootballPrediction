export default function Profile({userObj, signOut}) {
    return (
        <div className="profile">
            <div className="profileMain">
                <div className="profilePictureDiv">
                    <img className="profilePicture" alt="display" referrerPolicy="no-referrer" src={JSON.parse(localStorage.getItem("user")).profilePic} />
                </div>
                <div className="profileDetailsDiv">
                    <p style={{fontWeight: '600'}}>{JSON.parse(localStorage.getItem("user")).name}</p>
                    <p style={{cursor: 'pointer', fontSize: '14px'}} onClick={signOut}>Sign Out</p>
                </div>
            </div>
            <div className="profilePanel">
                <div className="profilePanelLabel">
                    <p style={{textAlign: "right"}}>COMPETITIONS<br/>JOINED</p>
                </div>
                <div className="profilePanelList">
                    {userObj.length !== 0 ?
                        (userObj[1].competitions.length !== 0) ? userObj[1].competitions.map((comp, i) => {
                            return (
                                <p key={i}>{comp.name}</p>
                            )
                        }) : "None" : "None"
                    }
                </div> 
            </div>
        </div>
    )
}