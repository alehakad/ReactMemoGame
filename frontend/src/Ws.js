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

    const socketRef = useRef(null); // ref to hold WebSocket instance
    const messageHandlerRef = useRef(new Map()); // ref to hold on message function

    const addMessageHandler = useCallback((key, handler) => {
        messageHandlerRef.current.set(key, handler);
    }, []);

    useEffect(() => {

        let clientId = Date.now();
        const wsUrl = `ws://127.0.0.1:8000/ws/${clientId}`;

        console.log('Initializing WebSocket');

        socketRef.current = new WebSocket(wsUrl);

        socketRef.current.onopen = () => {
            setWsStatus("Ready");
        }
        socketRef.current.onclose = () => {
            setWsStatus("Closed");
        }
        socketRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setMessages((prevMessages) => [...prevMessages, data]);
            // send to appropriate handler by key to process the latest message
            if (messageHandlerRef.current.has(data.type)) {
                const handler = messageHandlerRef.current.get(data.type);
                handler(data);
            }
        }
        socketRef.current.onerror = () => {
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
        <WebSocketContext.Provider value={{ messages, wsStatus, sendMessage, addMessageHandler }}>
            {children}
        </WebSocketContext.Provider>
    )
}