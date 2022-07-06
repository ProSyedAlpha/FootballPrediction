import { useState, useEffect } from 'react';
import { usePromiseTracker, trackPromise } from "react-promise-tracker";
import Loading from "./Loading";
import Leaderboard from "./Leaderboard";
import Profile from "./Profile";
import Competitions from "./Competitions";
import { db, auth, provider } from "./Firebase";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { signInWithPopup } from "firebase/auth";

export default function App() {
    
    const {promiseInProgress} = usePromiseTracker();
    const [leaderboard, setLeaderboard] = useState(false);
    const [leaderboardCompetition, setLeaderboardCompetition] = useState(null);
    const [user, setUser] = useState(false);
    const [userObj, setUserObj] = useState([]);

    useEffect(() => {
        if (localStorage.getItem("user") !== null) {
            setUser(true);
        }
    }, []);

    useEffect(() => {
        if (user) {
            getUserObj();
        }
        else {
            setUserObj([]);
        };
    }, [user]);

    const signInWithGoogle = () => {
        signInWithPopup(auth, provider)
        .then((result) => {
            const name = result.user.displayName;
            const email = result.user.email;
            const profilePic = result.user.photoURL;
            localStorage.setItem("user", JSON.stringify({name: name, email: email, profilePic: profilePic}));
            setUser(true);
        })
        .catch((error) => {
            console.log(error);
        });
      };
    
    const signOut = () => {
        localStorage.removeItem("user");
        setUser(false);
    };

    const register = () => {
        const email = JSON.parse(localStorage.getItem('user')).email;
        const name = JSON.parse(localStorage.getItem('user')).name;
        const profilePic = JSON.parse(localStorage.getItem('user')).profilePic;
        trackPromise(addDoc(collection(db, "users"), { email: email, name: name, profilePic: profilePic, competitions: [] })
        .catch((error) => {
            console.log(error);
        }));
        getUserObj();
    }

    const getUserObj = () => {
        trackPromise(getDocs(query(collection(db, "users"), where("email", "==", JSON.parse(localStorage.getItem("user")).email)))
        .then((querySnapshot) => {
            let results = 0;
            querySnapshot.forEach((doc) => {
                results += 1;
                setUserObj([doc.id, doc.data()]);
            })
            if (results === 0) register()
        })
        .catch((error) => {
            console.log(error)
        }));
    }

    function format(time) {
        var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul","Aug", "Sep", "Oct", "Nov", "Dec"];
        const t = new Date(time);
        return ('0' + t.getDate()).slice(-2) + " " + months[t.getMonth()] + " " + t.getFullYear() + " | " + (('0' + t.getHours()).slice(-2) + ":" + ('0' + t.getMinutes()).slice(-2));
    }

    function leaderboardOpen(competition) {
        setLeaderboard(true);
        setLeaderboardCompetition(competition)
    }

    function leaderboardQuit() {
        setLeaderboard(false);
    }

    return (
        <div className="main">
          <div className="in">
          <h1 className="title">Predict Football</h1>
            <div className="inner" style={user ? {width: '720px'}: {}}>
                {user ?
                    <div className="innermost">
                        <Profile userObj={userObj} signOut={signOut}/>
                        <Competitions user={user} userObj={userObj} getUserObj={getUserObj} leaderboardOpen={leaderboardOpen}/>
                    </div> : 
                    <button type="button" className="signInButton" onClick={signInWithGoogle}>Sign in with Google</button>}
            </div>
            <span className="date">{format(new Date().toISOString())}</span>
          </div>
          {leaderboard && <Leaderboard user={user} competition={leaderboardCompetition} quit={leaderboardQuit}/>}
          {promiseInProgress && <Loading/>}
        </div>
      );
}