import { useEffect, useState } from 'react';
import { collection, getDocs } from "firebase/firestore";
import { db } from "./Firebase";
import { trackPromise } from "react-promise-tracker";

export default function Leaderboard({user, competition, quit}) {
    
    const [compUsers, setCompUsers] = useState([]);

    useEffect(() => {
        getCompUsers();
    }, [user])
    
    function outcome(home, away) {
        if (home > away) { return 'Home' }
        else if (home < away) { return 'Away' }
        else if (home === away) { return 'Draw'; }
    }

    function score(predictions, results, comp, out) {
        if (out === 0) {
            return results.length;
        }
        else {
            let correctOutcome = 0;
            let correctScoreline = 0;
            results.forEach((result) => {
                const predHome = predictions.find(pred => pred.fixtureID === result.fixtureID).home;
                const predAway = predictions.find(pred => pred.fixtureID === result.fixtureID).away;
                if (result.home === predHome & result.away === predAway) {
                    correctScoreline += 1;
                }
                else if (outcome(predHome, predAway) === outcome(result.home, result.away)) {
                    correctOutcome += 1;
                }
            })
            let points = (correctScoreline * comp.scoreline) + (correctOutcome * comp.outcome);
            if (out === 1) {  return correctOutcome; }
            else if (out === 2) { return correctScoreline; }
            else if (out === 3) { return points; }
        }
        
    }

    function getCompUsers() {
        trackPromise(getDocs(collection(db, "users"))
        .then((querySnapshot) => {
            let cUsers = [];
            querySnapshot.forEach((doc) => {
                if (doc.data().competitions.some(cu => cu.name === competition.name)) {
                    let x = doc.data().competitions.find(comp => comp.name === competition.name);
                    delete x.name;
                    x.name = doc.data().name;
                    x.profilePic = doc.data().profilePic;
                    x.matchesPredicted = score(x.predictions, x.results, competition, 0);
                    x.correctOutcome = score(x.predictions, x.results, competition, 1);
                    x.correctScoreline = score(x.predictions, x.results, competition, 2);
                    x.points = score(x.predictions, x.results, competition, 3);
                    delete x.results;
                    delete x.predictions;
                    cUsers.push(x);
                }
            });
            cUsers = cUsers.sort((a, b) => (a.points > b.points ? -1 : 1));
            setCompUsers(cUsers);
        })
        .catch((error) => {
            console.log(error)
        }));
    }

    return (
        <div className="leaderboardModal">
            <div className="leaderboard">
                <span className="leaderboardQuit" onClick={quit}>✕</span>
                <h4>Leaderboard</h4>
                <h4 style={{fontSize: "15px"}}>{competition.name}</h4>
                <table className="leaderboardTable" cellSpacing="0">
                    <tbody>
                        <tr>
                            <td>#</td>
                            <td></td>
                            <td>Name</td>
                            <td>Matches Predicted</td>
                            <td>Correct Outcome</td>
                            <td>Correct Scoreline</td>
                            <td>Points</td>
                        </tr>
                        {compUsers !== undefined && compUsers.map((compU, i) => {
                            return (
                                <tr key={i}>
                                    <td>{i+1}</td>
                                    <td><img alt="display" referrerPolicy="no-referrer" src={compU.profilePic} /></td>
                                    <td style={{textAlign: "left"}}>{compU.name}</td>
                                    <td>{compU.matchesPredicted}</td>
                                    <td>{compU.correctOutcome}</td>
                                    <td>{compU.correctScoreline}</td>
                                    <td>{compU.points}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}