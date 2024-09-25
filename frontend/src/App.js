import './App.css';
import Board from './Board';
import { WebSocketProvider, useWebSocket } from './Ws';
import ScoresDisplay from './Scores.js'

const WsStatusDisplay = () => {
  const { wsStatus } = useWebSocket();

  return (
    <h2>WebSocket Status: {wsStatus}</h2>
  )
}

export default function App() {

  return (
    <WebSocketProvider>
      <WsStatusDisplay />
      <ScoresDisplay />
      <div className="App">
        <Board />
      </div>
    </WebSocketProvider>
  );
}
