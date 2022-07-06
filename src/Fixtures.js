import { useEffect, useState } from 'react';
import { doc, setDoc } from "firebase/firestore";
import { db } from "./Firebase";
import { trackPromise } from "react-promise-tracker";

export default function Fixtures({user, userObj, competition, getUserObj}) {

    const allFixtures = require('./FixtureList.json');
    const curFixtures = allFixtures[competition.name];
    const [inputs, setInputs] = useState({});
    const [predictions, setPredictions] = useState([]);
    const [disables, setDisables] = useState([]);

    useEffect(() => {
        getPredictions();
    }, [user, userObj])

    useEffect(() => {
        getResults();
        getDisables();
    }, [predictions])

    function status(time, results) {
        const hours = (new Date(time).getTime() - new Date().getTime()) / 3600000;
        if (hours > competition.deadline) { return "Can predict" }
        else if (hours < competition.deadline & hours > 0) { return "Deadline passed" }
        else if (hours < 0 & results.length === 0) {return "Deadline passed"}
        else if (hours < 0 & results.length !== 0) { return "Results: " + results[0] + " - " + results[1]}
    }

    function far(time) {
        const hours = (new Date(time).getTime() - new Date().getTime()) / 3600000;
        if (hours > competition.start) return true;
    }

    function format(time) {
        var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul","Aug", "Sep", "Oct", "Nov", "Dec"];
        const t = new Date(time);
        return ('0' + t.getDate()).slice(-2) + " " + months[t.getMonth()] + " " + t.getFullYear() + " | " + (('0' + t.getHours()).slice(-2) + ":" + ('0' + t.getMinutes()).slice(-2));
    }

    function predExist(id) {
        return predictions.find(prediction => prediction.fixtureID === id);
    }

    function getPredictions() {
        setPredictions(userObj[1].competitions.find(comp => comp.name === competition.name).predictions);
    }

    function addPrediction(id) {
        if (inputs[id] !== undefined) {
            if (inputs[id].every(x => x !== null) & inputs[id].every(x => x !== '') & inputs[id].every(x => x !== undefined)) {
                const key = userObj[0];
                let newObj = userObj[1];
                (newObj.competitions.find(comp => comp.name === competition.name).predictions).push({fixtureID: id, home: parseInt(inputs[id][0]), away: parseInt(inputs[id][1])})
                trackPromise(setDoc(doc(db, "users", key), newObj)
                .then(() => {
                    getUserObj();
                })
                .catch((error) => {
                    console.log(error);
                }));
            }
            else { alert("Scores not entered for the match.") }
        } else { alert("Scores not entered for the match.") }
    }


    function getDisables() {
        let dis = []
        predictions.forEach((prediction) => {
            dis.push(prediction.fixtureID)
        })
        setDisables(dis);
    }

    function enable(id) {
        let arr = disables;
        let inn = inputs;
        
        arr = arr.filter(function(item) {
            return item !== id;
        })

        inn[id] = [predExist(id).home, predExist(id).away]

        setInputs(inn);
        setDisables(arr);
    }

    function getInput(id, side, score) {
        let scores = inputs[id]
        if (scores === undefined) {scores = new Array(2).fill(null);}
        scores[side] = score;
        setInputs(inputs => ({
            ...inputs,
            ...{[id]: scores}
        }));
    }

    function getResults() {
        const announced = curFixtures.filter(fixture => fixture.results.length !== 0 & ((new Date(fixture.time).getTime() - new Date().getTime()) / 3600000) < 0);
        let results = [];
        announced.forEach((fixture) => {
            if (predictions.some(prediction => prediction.fixtureID === fixture.fixtureID)) {
                results.push({fixtureID: fixture.fixtureID, home: fixture.results[0], away: fixture.results[1]})
            }
        })
        results = results.filter((res) => {
            return (!(userObj[1].competitions.find(comp => comp.name === competition.name).results.some(x => x.fixtureID === res.fixtureID)));
        })
        if (results.length !== 0) {
            const key = userObj[0];
            let newObj = userObj[1];
            results.forEach((res) => {
                newObj.competitions.find(comp => comp.name === competition.name).results.push(res)
            })
            trackPromise(setDoc(doc(db, "users", key), newObj)
            .then(() => {
                getUserObj();
            })
            .catch((error) => {
                console.log(error);
            }));
        }
    }

    return (
        <div className="fixtures">
            <table cellSpacing={0}> 
                <tbody>
                    {curFixtures !== undefined && (curFixtures.map((fixture, i) => {
                        if (!far(fixture.time)) { return (
                            <tr key={i}>
                                <td style={{width: '130px'}}>{format(fixture.time)}</td>
                                <td style={{width: '160px', textAlign: "right"}}>{fixture.homeTeam}</td>
                                <td style={{width: '48px', fontWeight: "600"}}>{(status(fixture.time, fixture.results) === "Can predict") ? <input type="number" className="scoreInput" min="0" max="99" onChange={event => getInput(fixture.fixtureID, 0, event.target.value)} defaultValue={(predExist(fixture.fixtureID) !== undefined) ? predExist(fixture.fixtureID).home : undefined} disabled={((disables.includes(fixture.fixtureID) !== false)) && true}/> : (predExist(fixture.fixtureID) && predExist(fixture.fixtureID).home)}</td>
                                <td style={{width: '7px', fontWeight: 600}}>v</td>
                                <td style={{width: '48px', fontWeight: "600"}}>{(status(fixture.time, fixture.results) === "Can predict") ? <input type="number" className="scoreInput" min="0" max="99" onChange={event => getInput(fixture.fixtureID, 1, event.target.value)} defaultValue={(predExist(fixture.fixtureID) !== undefined) ? predExist(fixture.fixtureID).away : undefined} disabled={((disables.includes(fixture.fixtureID) !== false)) && true}/> : (predExist(fixture.fixtureID) && predExist(fixture.fixtureID).away)}</td>
                                <td style={{width: '160px', textAlign: "left"}}>{fixture.awayTeam}</td>
                                <td>{(status(fixture.time, fixture.results) === "Can predict") ? ((disables.includes(fixture.fixtureID) === false) ? <span style={{cursor: "pointer", color: "green"}} onClick={() => addPrediction(fixture.fixtureID)}>Predict</span> : <span style={{cursor: "pointer"}} onClick={() => enable(fixture.fixtureID)}>Edit</span>) : ((status(fixture.time, fixture.results) === "Deadline passed") ? <span style={{color: "red"}}>Deadline Passed</span> : status(fixture.time, fixture.results))}</td>
                            </tr>
                        )}}))}
                </tbody>
            </table>
        </div>
    )
}