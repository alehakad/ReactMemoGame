import './Board.css';
import './Timer.css'
import { useState, useEffect } from 'react';
import { useWebSocket } from './Ws';
import Timer from './Timer';

function Square({ xCoord, yCoord, isFlipped, imageUrl, onClickFunc }) {
    return (
        <td>
            <div className="flip-card" onClick={!isFlipped ? onClickFunc : undefined}>
                <div className={`flip-card-inner ${isFlipped ? 'rotate' : ''}`} >
                    <div className="flip-card-front">
                        {xCoord},{yCoord}
                    </div>
                    <div className="flip-card-back">
                        <img src={imageUrl} alt="Card" />
                    </div>
                </div>
            </div>
        </td>
    );
}


function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

export default function Board() {
    const { wsStatus, sendMessage } = useWebSocket();
    // initialize game configs
    let startStatusMessage = "Pairs found: 0";
    let startSquares = Array(25).fill(false);
    let startGameDuration = 120;

    const [squares, setSquares] = useState(startSquares);
    const [openedImage, setOpenedImage] = useState(null); // to pause between opening and checking image
    const [pairsFound, setPairsFound] = useState(0);
    const [statusMessage, setStatusMessage] = useState(startStatusMessage);
    const [notClickable, setNotClickable] = useState(false); // to diallow opening third image

    const [images, setImages] = useState([]);

    const [gameIsActive, setGameIsActive] = useState(true);

    const [gameDuration, setGameDuration] = useState(startGameDuration);

    const [timerKey, setTimerKey] = useState(0);

    // initialize game field
    const width = 4;
    const height = 4;
    const totalPairs = width * height / 2;

    useEffect(() => {
        const imageUrls = Array.from({ length: totalPairs }, (_, i) => `https://placedog.net/300/200?id=${i + 1}`);
        const pairedImages = [...imageUrls, ...imageUrls];
        shuffleArray(pairedImages);
        setImages(pairedImages);
    }, [totalPairs]);



    function handleClick(idx) {
        if (notClickable) { return; }
        if (idx === openedImage) { return; }

        if (openedImage !== null) {
            setNotClickable(true);
        }
        else {
            setOpenedImage(idx);
        }
        // openImage
        const nextSquares = squares.slice();
        nextSquares[idx] = !nextSquares[idx];
        setSquares(nextSquares);

        // send message to webocket
        sendMessage(`Square with index ${idx} was clicked`);

        // check after 2 seconds
        setTimeout(() => {
            if (openedImage !== null) {
                if (images[openedImage] === images[idx]) {
                    if (pairsFound + 1 === totalPairs) { // won the game
                        setStatusMessage("You won!!");
                        setGameIsActive(false);
                    }
                    else {
                        setStatusMessage(`Pairs found: ${pairsFound + 1}`);
                    }
                    setPairsFound(pairsFound + 1);
                }
                else {
                    nextSquares[idx] = false;
                    nextSquares[openedImage] = false;
                    setSquares(nextSquares);
                }
                setOpenedImage(null);
                setNotClickable(false);

            }
        }, 1000);
    }

    const rows = [];

    let imgIndex = 0;

    for (let i = 0; i < height; i++) {
        const cells = [];
        for (let j = 0; j < width; j++) {
            const index = i * width + j; // key of list element
            cells.push(
                <Square
                    key={`${i}-${j}`}
                    xCoord={i}
                    yCoord={j}
                    isFlipped={squares[index]}
                    onClickFunc={() => handleClick(index)}
                    imageUrl={images[imgIndex]}
                />
            );
            ++imgIndex;
        }
        rows.push(<tr key={i}>{cells}</tr>);
    }

    // add timer
    const handleTimeUp = () => {
        alert('Time is up!');
        setGameIsActive(false);
    };

    // reset all game properties
    function restartGame() {
        setGameDuration(startGameDuration);
        setTimerKey(prevKey => prevKey + 1);
        setSquares(startSquares);
        setOpenedImage(null);
        setPairsFound(0);
        setStatusMessage(startStatusMessage);
        setNotClickable(false);
        setGameIsActive(true);
    }

    return (
        <div className='Board'>
            <Timer key={timerKey} isActive={gameIsActive} onTimeUp={handleTimeUp} duration={gameDuration} />
            <div className='status'>{statusMessage}</div>
            <button className='restart-button' onClick={restartGame}>Restart</button>
            <table>
                <tbody>{rows}</tbody>
            </table>
        </div>
    );
}
