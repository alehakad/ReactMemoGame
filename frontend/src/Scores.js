import { useCallback, useEffect, useState } from 'react';
import './Scores.css'
import { useWebSocket } from './Ws';

const ScoresDisplay = () => {

    const { addMessageHandler } = useWebSocket();
    const [players, setPlayers] = useState([]); // array of players with points

    // const players = [
    //     { name: 'Player 1', score: 100 },
    //     { name: 'Player 2', score: 90 },
    //     { name: 'Player 3', score: 80 },
    // ];

    const handleLatestMessage = useCallback((latestMessage) => {
        if (latestMessage.hasOwnProperty('players')) {
            setPlayers(latestMessage['players']);
        }
    }, []
    )

    // set websocket on message function
    useEffect(() => {
        addMessageHandler("points", handleLatestMessage);
    }, [addMessageHandler, handleLatestMessage]);



    return (
        <div className="leaderboard-container">
            <h2>Leaderboard</h2>
            <table className="leaderboard-table">
                <thead>
                    <tr>
                        <th>Player</th>
                        <th>Score</th>
                    </tr>
                </thead>
                <tbody>
                    {players.map((player, index) => (
                        <tr key={index}>
                            <td>{player.name}</td>
                            <td>{player.score}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default ScoresDisplay;