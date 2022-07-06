import { useEffect, useState } from 'react';
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "./Firebase";
import Fixtures from "./Fixtures";
import { trackPromise } from "react-promise-tracker";

export default function Competitions({user, userObj, getUserObj, leaderboardOpen}) {

    const [competitions, setCompetitions] = useState([]);
    
    useEffect(() => {
        getCompetitions();
    }, [user])
    
    function getCompetitions() {
        trackPromise(getDocs(collection(db, "competitions"))
        .then((querySnapshot) => {
            let comps = [];
            querySnapshot.forEach((doc) => {
                comps.push(doc.data());
            });
            setCompetitions(comps);
        })
        .catch((error) => {
            console.log(error)
        }));
    }

    function joinCompetition(name) {
        const key = userObj[0];
        let newObj = userObj[1];
        newObj.competitions.push({name: name, predictions: [], results: []});
        trackPromise(setDoc(doc(db, "users", key), newObj)
        .then(() => {
            getUserObj();
        })
        .catch((error) => {
            console.log(error);
        }));
    }

    function outcome(home, away) {
        if (home > away) { return 'Home' }
        else if (home < away) { return 'Away' }
        else if (home === away) { return 'Draw'; }
    }

    function score(comp, out) {
        if (out === 0) {
            return userObj[1].competitions.find(c => c.name === comp.name).results.length
        }
        else {
            const results = userObj[1].competitions.find(c => c.name === comp.name).results;
            const predictions = userObj[1].competitions.find(c => c.name === comp.name).predictions;
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


    return (
        <div className="competitions">
            {competitions.map((competition, i) => {
                return (
                    <div className="competition" key={i}>
                        <h4>{competition.name}</h4>
                        <span className="leaderboardLabel" onClick={() => leaderboardOpen(competition)}>Leaderboard</span>
                        {(userObj !== undefined & userObj.length !== 0 & userObj !== null) ? ((userObj[1].competitions.some(x => x.name === competition.name)) ? 
                            <div className="competitionIn">
                                <div className="statisticsOuter">
                                    <div className="statistics">
                                        <span>Matches Predicted: {score(competition, 0)}</span>
                                        <span>Correct Outcome: {score(competition, 1)}</span> 
                                        <span>Correct Scoreline: {score(competition, 2)}</span> 
                                        <span>Points: {score(competition, 3)}</span> 
                                    </div>
                                </div>
                                <Fixtures competition={competition} userObj={userObj} user={user} getUserObj={getUserObj}/>
                            </div>
                        : <p style={{cursor: 'pointer', fontSize: '14px', fontWeight: '600'}} onClick={() => joinCompetition(competition.name)}>Join Competition</p>) : "-"}
                    </div>
                )
            })}
        </div>
    )
}