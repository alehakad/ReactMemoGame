import './App.css';
import Board from './Board';
import { WebSocketProvider, useWebSocket } from './Ws';

const MessagesDisplay = () => {
  const { messages, wsStatus } = useWebSocket();

  return (
    <div>
      <h2>WebSocket Status: {wsStatus}</h2>
      <ul>
        {messages.map((msg, index) => (
          <li key={index}>{JSON.stringify(msg)}</li>
        ))}
      </ul>
    </div>
  )
}


export default function App() {

  return (
    <WebSocketProvider>
      <MessagesDisplay />
      <div className="App">
        <Board />
      </div>
    </WebSocketProvider>
  );
}
