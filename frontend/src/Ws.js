import { useEffect, useState, useRef, createContext, useContext, useCallback } from "react"


// create context to reuse the same websocket in differrent components
const WebSocketContext = createContext(null);


export const useWebSocket = () => {
    return useContext(WebSocketContext);
};

// custom hook to return status, messages and sendMessages function 
export const WebSocketProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [wsStatus, setWsStatus] = useState("Disconnected");
    const [isReady, setIsReady] = useState(false);

    const socketRef = useRef(null); // ref to hold WebSocket instance
    const messageHandlerRef = useRef(null); // ref to hold on message function

    const setMessageHandler = useCallback((handler) => {
        messageHandlerRef.current = handler;
    }, []);

    useEffect(() => {

        let clientId = Date.now();
        const wsUrl = `ws://10.10.1.242:8000/ws/${clientId}`;

        socketRef.current = new WebSocket(wsUrl);

        socketRef.current.onopen = () => {
            setIsReady(true);
            setWsStatus("Ready");
            socketRef.current.send(JSON.stringify({ message: "Hello" }));
        }
        socketRef.current.onclose = () => {
            setIsReady(false);
            setWsStatus("Closed");
        }
        socketRef.current.onmessage = (event) => {
            console.log(event.data);
            const data = JSON.parse(event.data);
            setMessages((prevMessages) => [...prevMessages, data]);
            // send to board to handle the latest message
            if (messageHandlerRef.current) {
                messageHandlerRef.current(data);
            }
        }
        socketRef.current.onerror = () => {
            setIsReady(false);
            setWsStatus("Error");
        }

        return () => {
            socketRef.current.close();
        };
    }, []);


    // function to send message to websocket
    const sendMessage = (message) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(message);
            console.log('Message sent', message);
        }
        else {
            console.log('Ws is not open');
        }
    }

    return (
        <WebSocketContext.Provider value={{ messages, wsStatus, sendMessage, setMessageHandler}}>
            {children}
        </WebSocketContext.Provider>
    )
}