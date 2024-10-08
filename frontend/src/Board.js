import './Board.css';
import './Timer.css'
import { useState, useEffect, useCallback } from 'react';
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

export default function Board() {
    const { sendMessage, addMessageHandler } = useWebSocket();
    // initialize game configs
    let startStatusMessage = "Wait for other player";
    let startSquares = Array(25).fill(false);
    let startGameDuration = 120;

    let startGameStatusMessage = "Pairs found : 0";

    const [squares, setSquares] = useState(startSquares);
    const [openedImage, setOpenedImage] = useState(null); // to pause between opening and checking image
    const [pairsFound, setPairsFound] = useState(0);
    const [statusMessage, setStatusMessage] = useState(startStatusMessage);
    const [notClickable, setNotClickable] = useState(true); // to diallow opening third image and wait until turn
    const [images, setImages] = useState([]);

    const [gameIsActive, setGameIsActive] = useState(false);

    const [gameDuration, setGameDuration] = useState(startGameDuration);

    const [timerKey, setTimerKey] = useState(0);
    const [boardIsSet, setBoardIsSet] = useState(false); // to set board on first message

    // initialize game field
    const width = 4;
    const height = 4;
    const totalPairs = width * height / 2;


    // start game handles
    const handleStartMesages = useCallback((latestMessage) => {

        // check if game started
        if (latestMessage.hasOwnProperty("started")) {
            console.log("start game");
            setGameIsActive(true);
            setStatusMessage(startGameStatusMessage);
            setNotClickable(false);
            if (latestMessage.hasOwnProperty('canClick')) {
                setNotClickable(!latestMessage.canClick);
            }
    
        }
    }, [startGameStatusMessage])

    // when new message sfrom socket recieved - update images
    const handleLatestMessage = useCallback((latestMessage) => {
        console.log(`handleLatestMessage ${JSON.stringify(latestMessage)}`);

        // construct board images array - only once on connect
        if (!boardIsSet) {
            // shuffle images
            if (latestMessage.hasOwnProperty('board')) {
                console.log("set board");
                const imageUrls = Array.from({ length: totalPairs }, (_, i) => `https://placedog.net/300/200?id=${i + 1}`);
                const pairedImages = [...imageUrls, ...imageUrls];
                let shuffledImages = latestMessage['board'].map(index => pairedImages[index]);
                setImages(shuffledImages);
                setBoardIsSet(true);
                setNotClickable(true);
            }

            return;
        }
        // check message format
        if (latestMessage.hasOwnProperty('imageIdx')) {
            const imageIdx = latestMessage.imageIdx;
            if (imageIdx >= 0 && imageIdx <= squares.length) {
                setSquares((prevSquares) => {
                    const nextSquares = [...prevSquares];
                    console.log(`Image request on ${imageIdx}, ${latestMessage.isOpen}`);
                    nextSquares[imageIdx] = latestMessage.isOpen;
                    console.log(nextSquares.toString());
                    return nextSquares;
                });
                return;
            }
        }

        // allow clickable to this player 
        if (latestMessage.hasOwnProperty('canClick')) {
            setNotClickable(!latestMessage.canClick);
        }

    }, [boardIsSet, totalPairs, squares.length]
    )


    // set websocket on message function
    useEffect(() => {
        addMessageHandler('board', handleLatestMessage);
    }, [addMessageHandler, handleLatestMessage]);

    // set websocket on message function
    useEffect(() => {
        addMessageHandler('start', handleStartMesages);
    }, [addMessageHandler, handleStartMesages]);


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
        // send open image
        sendMessage(JSON.stringify({ type: 'board', imageIdx: idx, isOpen: true }));

        // check after 2 seconds
        if (openedImage !== null) {
            setTimeout(() => {
                if (images[openedImage] === images[idx]) {

                    // send message to websocket to open two images
                    //sendMessage(JSON.stringify({type: 'board', imageIdx: idx, isOpen: true }));
                    //sendMessage(JSON.stringify({type: 'board', imageIdx: openedImage, isOpen: true }));

                    setNotClickable(false);

                    if (pairsFound + 1 === totalPairs) { // won the game
                        setStatusMessage("You won!!");
                        setGameIsActive(false);
                    }
                    else {
                        setStatusMessage(`Pairs found: ${pairsFound + 1}`);
                    }
                    setPairsFound(pairsFound + 1);
                    // setMessage to update leaderbord
                    sendMessage(JSON.stringify({ type: 'points', points: 1 }))
                }
                else {
                    nextSquares[idx] = false;
                    nextSquares[openedImage] = false;
                    setSquares(nextSquares);

                    // send message to websocket to close two images
                    sendMessage(JSON.stringify({ type: 'board', imageIdx: idx, isOpen: false }));
                    sendMessage(JSON.stringify({ type: 'board', imageIdx: openedImage, isOpen: false }));

                    // allow to click for other player
                    sendMessage(JSON.stringify({ type: 'board', canClick: true }));

                    setNotClickable(true); // wait until next turn
                }
                setOpenedImage(null);
            }, 2000);
        }
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
